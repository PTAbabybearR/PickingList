import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PickingTable } from "@/components/picking-table";

export const dynamic = "force-dynamic";

export default async function PublicKitPage({
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
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { parts: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  // 仅展示已发布的型号
  if (!kit || kit.status !== "published") notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-800">首页</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/grades/${kit.series.gradeId}`} className="hover:text-neutral-800">
          {kit.series.grade.name}
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/series/${kit.seriesId}`} className="hover:text-neutral-800">
          {kit.series.name}
        </Link>
      </nav>

      <h1 className="mt-3 text-2xl font-bold">{kit.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {kit.series.grade.name} · {kit.series.name}
        {kit.code ? ` · ${kit.code}` : ""}
        {kit.scale ? ` · ${kit.scale}` : ""}
      </p>

      <div className="mt-8">
        {kit.sections.length === 0 ? (
          <p className="text-sm text-neutral-500">暂无取件表数据。</p>
        ) : (
          <PickingTable sections={kit.sections} basePath={`/kit/${kit.id}`} byRunner={byRunner} />
        )}
      </div>
    </main>
  );
}
