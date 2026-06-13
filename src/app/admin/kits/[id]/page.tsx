import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { uploadManual } from "../actions";

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
    },
  });

  if (!kit) notFound();

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

      <section className="mt-10">
        <h2 className="text-lg font-semibold">说明书</h2>

        {kit.manuals.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">还没有上传说明书。</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {kit.manuals.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-5 py-3">
                <div className="text-sm">
                  <div className="font-mono text-xs text-neutral-500">{m.pdfKey}</div>
                  <div className="mt-0.5 text-xs text-neutral-400">
                    {m.createdAt.toLocaleString("zh-CN")}
                  </div>
                </div>
                <span className="rounded bg-neutral-100 px-2 py-1 text-xs">
                  {STATUS_LABEL[m.recognizeStatus] ?? m.recognizeStatus}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form
          action={uploadManual}
          className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-white p-5"
        >
          <input type="hidden" name="modelKitId" value={kit.id} />
          <input
            type="file"
            name="file"
            accept="application/pdf,.pdf"
            required
            className="text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            上传 PDF
          </button>
        </form>
        <p className="mt-2 text-xs text-neutral-400">
          上传后会创建一条待识别记录。识别功能将在下一步接入。
        </p>
      </section>
    </main>
  );
}
