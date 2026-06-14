import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { recognizeManualAction, uploadManual, setKitStatus } from "../actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import { ImportJsonForm } from "./import-json-form";
import { PickingTable } from "@/components/picking-table";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "待识别",
  processing: "识别中",
  done: "已识别",
  failed: "识别失败",
};

export default async function KitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  const byRunner = view === "runner";

  const kit = await prisma.modelKit.findUnique({
    where: { id },
    include: {
      series: { include: { grade: true } },
      manuals: { orderBy: { createdAt: "desc" } },
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { parts: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!kit) notFound();

  const sections = kit.sections;
  const itemCount = sections.reduce((n, s) => n + s.parts.length, 0);
  const totalQty = sections.reduce(
    (n, s) => n + s.parts.reduce((m, p) => m + p.quantity, 0),
    0,
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/admin/kits" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← 型号管理
      </Link>

      <h1 className="mt-2 text-2xl font-bold">{kit.name}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
        <span>
          {kit.series.grade.name} · {kit.series.name}
          {kit.code ? ` · ${kit.code}` : ""}
          {kit.scale ? ` · ${kit.scale}` : ""}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            kit.status === "published" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {kit.status === "published" ? "已发布" : kit.status === "archived" ? "已下架" : "草稿"}
        </span>
        {kit.status !== "published" ? (
          <form action={setKitStatus}>
            <input type="hidden" name="modelKitId" value={kit.id} />
            <input type="hidden" name="status" value="published" />
            <SubmitButton
              pendingText="…"
              className="rounded border border-green-600 px-2 py-0.5 text-xs text-green-700 hover:bg-green-600 hover:text-white disabled:opacity-50"
            >
              发布
            </SubmitButton>
          </form>
        ) : (
          <form action={setKitStatus}>
            <input type="hidden" name="modelKitId" value={kit.id} />
            <input type="hidden" name="status" value="draft" />
            <SubmitButton
              pendingText="…"
              className="rounded border border-neutral-400 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
            >
              转草稿
            </SubmitButton>
          </form>
        )}
      </div>

      {/* 说明书 + 识别 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">说明书</h2>
        {kit.manuals.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">还没有上传说明书。</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {kit.manuals.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0 text-sm">
                  <div className="truncate font-mono text-xs text-neutral-500">{m.pdfKey}</div>
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

      {/* 取件表 */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">取件表</h2>
          <div className="flex items-center gap-3">
            {sections.length > 0 && (
              <span className="text-xs text-neutral-500">
                {sections.length} 部位 · {itemCount} 取件项 · 总数 {totalQty}
              </span>
            )}
            <Link
              href={`/admin/kits/${kit.id}/edit`}
              className="rounded-lg border border-neutral-900 px-3 py-1.5 text-xs font-medium hover:bg-neutral-900 hover:text-white"
            >
              {sections.length > 0 ? "编辑 / 复核" : "手动编辑"}
            </Link>
          </div>
        </div>

        {sections.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            尚无取件表数据。点上方「开始识别」自动识别，或在下方导入 JSON。
          </p>
        ) : (
          <div className="mt-3">
            <PickingTable sections={sections} basePath={`/admin/kits/${kit.id}`} byRunner={byRunner} />
          </div>
        )}

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

function UploadForm({ modelKitId }: { modelKitId: string }) {
  return (
    <form
      action={uploadManual}
      className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-white p-5"
    >
      <input type="hidden" name="modelKitId" value={modelKitId} />
      <input type="file" name="file" accept="application/pdf,.pdf" required className="text-sm" />
      <SubmitButton pendingText="上传中…">上传 PDF</SubmitButton>
    </form>
  );
}
