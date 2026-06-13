import Link from "next/link";
import { prisma } from "@/lib/db";
import { KitForm } from "./kit-form";

export const dynamic = "force-dynamic";

export default async function NewKitPage() {
  const grades = await prisma.grade.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      series: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
    },
  });

  const data = grades.map((g) => ({
    id: g.id,
    name: g.name,
    series: g.series,
  }));

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link href="/admin/kits" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← 型号管理
      </Link>
      <h1 className="mt-2 text-2xl font-bold">新建型号</h1>
      <KitForm grades={data} />
    </main>
  );
}
