import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { recognizeManualAction, uploadManual } from "../actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import { ImportJsonForm } from "./import-json-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "待识别",
  processing: "识别中",
  done: "已识别",
  failed: "识别失败",
};

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kit = await prisma.modelKit.findUnique({
    where: { id },
    include: {
      series: { include: { grade: true } },
      manuals: { orderBy: { createdAt: "desc" } },
      runners: {
        orderBy: { label: "asc" },
        include: { parts: { orderBy: { gateNo: "asc" } } },
      },
      _count: { select: { steps: true } },
    },
  });

  if (!kit) notFound();

  // 零件总数 = Σ 板件张数 × 单张数量（PRD 统计口径）
  const partKinds = kit.runners.reduce((n, r) => n + r.parts.length, 0);
  const partTotal = kit.runners.reduce(
    (n, r) => n + r.parts.reduce((m, p) => m + r.count * p.quantity, 0),
    0,
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/admin/kits" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← 型号管理
      </Link>

      <h1 className="mt-2 text-2xl font-bold">{kit.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {kit.series.grade.name} · {kit.series.name}
        {kit.code ? ` · ${kit.code}` : ""}
        {kit.scale ? ` · ${kit.scale}` : ""} · 状态 {kit.status}
      </p>

      {/* 说明书 + 识别 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">说明书</h2>

        {kit.manuals.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">还没有上传说明书。</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {kit.manuals.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0 text-sm">
                  <div className="truncate font-mono text-xs text-neutral-500">
                    {m.pdfKey}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-400">
                    {m.createdAt.toLocaleString("zh-CN")}
                    {m.pageCount ? ` · ${m.pageCount} 页` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded bg-neutral-100 px-2 py-1 text-xs">
                    {STATUS_LABEL[m.recognizeStatus] ?? m.recognizeStatus}
                  </span>
                  <form action={recognizeManualAction}>
                    <input type="hidden" name="manualId" value={m.id} />
                    <input type="hidden" name="modelKitId" value={kit.id} />
                    <SubmitButton
                      pendingText="识别中…"
                      className="rounded-lg border border-neutral-900 px-3 py-1.5 text-xs font-medium hover:bg-neutral-900 hover:text-white disabled:opacity-50"
                    >
                      {m.recognizeStatus === "done" ? "重新识别" : "开始识别"}
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <UploadForm modelKitId={kit.id} />
      </section>

      {/* 取件表结果（两种识别方式共用展示，便于对比） */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">取件表（草稿）</h2>
          {kit.runners.length > 0 && (
            <div className="text-xs text-neutral-500">
              {kit.runners.length} 板件 · {partKinds} 种零件 · 总数 {partTotal} · 步骤{" "}
              {kit._count.steps}
            </div>
          )}
        </div>

        {kit.runners.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            尚无取件表数据。点上方「开始识别」自动识别，或在下方导入 JSON。
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-2">板件</th>
                  <th className="px-4 py-2">颜色</th>
                  <th className="px-4 py-2">张数</th>
                  <th className="px-4 py-2">剪口（数量）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {kit.runners.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-2 font-medium">{r.label}</td>
                    <td className="px-4 py-2 text-neutral-600">{r.color ?? "-"}</td>
                    <td className="px-4 py-2 text-neutral-600">{r.count}</td>
                    <td className="px-4 py-2 text-neutral-600">
                      {r.parts
                        .map((p) => `${p.gateNo}×${p.quantity}`)
                        .join("，")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 手动导入（实验期：由 Claude Code 产出 JSON 后粘贴） */}
        <details className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-700">
            导入识别 JSON（手动 / 实验用）
          </summary>
          <ImportJsonForm modelKitId={kit.id} />
        </details>
      </section>
    </main>
  );
}

// 上传表单（保留原行为）
function UploadForm({ modelKitId }: { modelKitId: string }) {
  return (
    <form
      action={uploadManual}
      className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-white p-5"
    >
      <input type="hidden" name="modelKitId" value={modelKitId} />
      <input
        type="file"
        name="file"
        accept="application/pdf,.pdf"
        required
        className="text-sm"
      />
      <SubmitButton pendingText="上传中…">上传 PDF</SubmitButton>
    </form>
  );
}
