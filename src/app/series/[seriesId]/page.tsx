import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = await params;
  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: { grade: true },
  });
  if (!series) notFound();

  const kits = await prisma.modelKit.findMany({
    where: { seriesId, status: "published" },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-800">首页</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/grades/${series.gradeId}`} className="hover:text-neutral-800">
          {series.grade.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-800">{series.name}</span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold">{series.name}</h1>

      {kits.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">该系列下还没有已发布的型号。</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {kits.map((k) => (
            <li key={k.id}>
              <Link href={`/kit/${k.id}`} className="block px-5 py-4 hover:bg-neutral-50">
                <div className="font-medium">{k.name}</div>
                {(k.code || k.scale) && (
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {[k.code, k.scale].filter(Boolean).join(" · ")}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
