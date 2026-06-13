import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { recognizeManualAction, uploadManual, setKitStatus } from "../actions";
import { SubmitButton } from "@/app/admin/_components/submit-button";
import { ImportJsonForm } from "./import-json-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "待识别",
  processing: "识别中",
  done: "已识别",
  failed: "识别失败",
};

type PartLite = { runnerName: string; gateNo: string; quantity: number };

// 自然排序：A, B1, B2, C … / 剪口 2 在 13 前
function natCmp(a: string, b: string) {
  return a.localeCompare(b, "en", { numeric: true });
}

function fmtPart(p: PartLite) {
  return p.quantity > 1 ? `${p.gateNo}×${p.quantity}` : p.gateNo;
}

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
            kit.status === "published"
              ? "bg-green-100 text-green-700"
              : "bg-neutral-100 text-neutral-600"
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

      {/* 取件表（部位为核心，两视图切换） */}
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
          <>
            {/* 视图切换 */}
            <div className="mt-3 inline-flex rounded-lg border border-neutral-200 bg-white p-0.5 text-sm">
              <Link
                href={`/admin/kits/${kit.id}`}
                className={`rounded-md px-3 py-1 ${!byRunner ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
              >
                按部位
              </Link>
              <Link
                href={`/admin/kits/${kit.id}?view=runner`}
                className={`rounded-md px-3 py-1 ${byRunner ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
              >
                按板件
              </Link>
            </div>

            <div className="mt-4">
              {byRunner ? (
                <RunnerView sections={sections} />
              ) : (
                <SectionView sections={sections} />
              )}
            </div>
          </>
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

// 按部位：每个部位下按板件分组列出剪口
function SectionView({
  sections,
}: {
  sections: { id: string; name: string; color: string | null; parts: PartLite[] }[];
}) {
  return (
    <div className="space-y-3">
      {sections.map((s) => {
        const byRunner = new Map<string, PartLite[]>();
        for (const p of s.parts) {
          if (!byRunner.has(p.runnerName)) byRunner.set(p.runnerName, []);
          byRunner.get(p.runnerName)!.push(p);
        }
        const runners = [...byRunner.keys()].sort(natCmp);
        return (
          <div key={s.id} className="rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: s.color ?? "#999" }}
              />
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-neutral-400">
                {s.parts.reduce((m, p) => m + p.quantity, 0)} 件
              </span>
            </div>
            <div className="space-y-1.5 px-4 py-3 text-sm">
              {runners.map((rn) => (
                <div key={rn} className="flex gap-2">
                  <span className="w-10 shrink-0 font-mono font-medium text-neutral-700">
                    {rn}
                  </span>
                  <span className="text-neutral-600">
                    {byRunner.get(rn)!.map(fmtPart).join("、")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 按板件：每块板件下按部位分组列出剪口
function RunnerView({
  sections,
}: {
  sections: { name: string; color: string | null; parts: PartLite[] }[];
}) {
  // runnerName -> [{sectionName, color, parts[]}]
  const map = new Map<string, { name: string; color: string | null; parts: PartLite[] }[]>();
  for (const s of sections) {
    const perRunner = new Map<string, PartLite[]>();
    for (const p of s.parts) {
      if (!perRunner.has(p.runnerName)) perRunner.set(p.runnerName, []);
      perRunner.get(p.runnerName)!.push(p);
    }
    for (const [rn, parts] of perRunner) {
      if (!map.has(rn)) map.set(rn, []);
      map.get(rn)!.push({ name: s.name, color: s.color, parts });
    }
  }
  const runners = [...map.keys()].sort(natCmp);

  return (
    <div className="space-y-3">
      {runners.map((rn) => {
        const groups = map.get(rn)!;
        const qty = groups.reduce(
          (m, g) => m + g.parts.reduce((k, p) => k + p.quantity, 0),
          0,
        );
        return (
          <div key={rn} className="rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
              <span className="font-mono font-semibold">{rn}</span>
              <span className="text-xs text-neutral-400">板件 · {qty} 件</span>
            </div>
            <div className="space-y-1.5 px-4 py-3 text-sm">
              {groups.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex w-16 shrink-0 items-center gap-1 text-neutral-700">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: g.color ?? "#999" }}
                    />
                    {g.name}
                  </span>
                  <span className="text-neutral-600">{g.parts.map(fmtPart).join("、")}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
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
