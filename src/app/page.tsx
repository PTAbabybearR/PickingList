import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const grades = await prisma.grade.findMany({
    where: { series: { some: { modelKits: { some: { status: "published" } } } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">PickingList · 拼装模型取件表</h1>
      <p className="mt-2 text-neutral-600">按等级浏览，或搜索型号，查看取件表。</p>

      <form action="/search" className="mt-6 flex gap-2">
        <input
          name="q"
          placeholder="搜索型号名 / 编号 / 作品系列…"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <button className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700">
          搜索
        </button>
      </form>

      <h2 className="mt-12 text-sm font-semibold text-neutral-500">按等级浏览</h2>
      {grades.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">还没有已发布的取件表。</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {grades.map((g) => (
            <Link
              key={g.id}
              href={`/grades/${g.id}`}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center text-lg font-semibold transition hover:border-neutral-400"
            >
              {g.name}
            </Link>
          ))}
        </div>
      )}

      <p className="mt-16 text-xs text-neutral-400">
        <Link href="/admin" className="hover:text-neutral-700">管理员入口</Link>
      </p>
    </main>
  );
}
