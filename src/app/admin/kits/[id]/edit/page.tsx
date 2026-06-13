import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SchemeEditor } from "./scheme-editor";

export const dynamic = "force-dynamic";

export default async function EditSchemePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kit = await prisma.modelKit.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { parts: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!kit) notFound();

  const initial = kit.sections.map((s) => ({
    name: s.name,
    color: s.color ?? "#3b82f6",
    parts: s.parts.map((p) => ({
      runnerName: p.runnerName,
      gateNo: p.gateNo,
      quantity: p.quantity,
    })),
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`/admin/kits/${id}`} className="text-sm text-neutral-500 hover:text-neutral-800">
        ← {kit.name}
      </Link>
      <h1 className="mt-2 text-2xl font-bold">复核 / 编辑取件表</h1>
      <p className="mt-1 text-sm text-neutral-500">
        改完点「保存」整体覆盖。重点核对数量（识别的弱项）。
      </p>
      <SchemeEditor modelKitId={id} kitName={kit.name} initial={initial} />
    </main>
  );
}
