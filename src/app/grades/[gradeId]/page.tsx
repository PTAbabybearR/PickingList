import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GradePage({
  params,
}: {
  params: Promise<{ gradeId: string }>;
}) {
  const { gradeId } = await params;
  const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
  if (!grade) notFound();

  const series = await prisma.series.findMany({
    where: { gradeId, modelKits: { some: { status: "published" } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-800">首页</Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-800">{grade.name}</span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold">{grade.name} · 作品系列</h1>

      {series.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">该等级下还没有已发布的型号。</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {series.map((s) => (
            <li key={s.id}>
              <Link href={`/series/${s.id}`} className="block px-5 py-4 hover:bg-neutral-50">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
