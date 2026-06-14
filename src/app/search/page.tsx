import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const kits = query
    ? await prisma.modelKit.findMany({
        where: {
          status: "published",
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
            { series: { name: { contains: query } } },
          ],
        },
        include: { series: { include: { grade: true } } },
        orderBy: { name: "asc" },
        take: 50,
      })
    : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-800">首页</Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-800">搜索</span>
      </nav>

      <form action="/search" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="搜索型号名 / 编号 / 作品系列…"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <button className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700">
          搜索
        </button>
      </form>

      {query && (
        <p className="mt-4 text-sm text-neutral-500">
          “{query}” 找到 {kits.length} 个结果
        </p>
      )}

      {kits.length > 0 && (
        <ul className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {kits.map((k) => (
            <li key={k.id}>
              <Link href={`/kit/${k.id}`} className="block px-5 py-4 hover:bg-neutral-50">
                <div className="font-medium">{k.name}</div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  {k.series.grade.name} · {k.series.name}
                  {k.code ? ` · ${k.code}` : ""}
                  {k.scale ? ` · ${k.scale}` : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
