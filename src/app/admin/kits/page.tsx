import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function KitsPage() {
  const kits = await prisma.modelKit.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      series: { include: { grade: true } },
      _count: { select: { manuals: true } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-800">
            ← 控制台
          </Link>
          <h1 className="mt-2 text-2xl font-bold">型号管理</h1>
        </div>
        <Link
          href="/admin/kits/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + 新建型号
        </Link>
      </div>

      {kits.length === 0 ? (
        <p className="mt-10 text-neutral-500">还没有型号，点右上角新建。</p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {kits.map((kit) => (
            <li key={kit.id}>
              <Link
                href={`/admin/kits/${kit.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50"
              >
                <div>
                  <div className="font-medium">{kit.name}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {kit.series.grade.name} · {kit.series.name}
                    {kit.code ? ` · ${kit.code}` : ""}
                    {kit.scale ? ` · ${kit.scale}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>{kit._count.manuals} 本说明书</span>
                  <span className="rounded bg-neutral-100 px-2 py-1">{kit.status}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
