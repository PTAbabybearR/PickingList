"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

/** 新建型号 */
export async function createKit(formData: FormData) {
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const scale = String(formData.get("scale") ?? "").trim();

  if (!seriesId) throw new Error("请选择作品系列");
  if (!name) throw new Error("请填写型号名称");

  const series = await prisma.series.findUnique({ where: { id: seriesId } });
  if (!series) throw new Error("所选系列不存在");

  const kit = await prisma.modelKit.create({
    data: {
      seriesId,
      name,
      code: code || null,
      scale: scale || null,
    },
  });

  revalidatePath("/admin/kits");
  redirect(`/admin/kits/${kit.id}`);
}

/** 为型号上传 PDF 说明书（存本地 + 建 Manual 记录，识别后续触发） */
export async function uploadManual(formData: FormData) {
  const modelKitId = String(formData.get("modelKitId") ?? "").trim();
  const file = formData.get("file");

  if (!modelKitId) throw new Error("缺少型号 ID");
  if (!(file instanceof File) || file.size === 0) throw new Error("请选择 PDF 文件");

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("只接受 PDF 文件");

  const kit = await prisma.modelKit.findUnique({ where: { id: modelKitId } });
  if (!kit) throw new Error("型号不存在");

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `manuals/${modelKitId}/${randomUUID()}.pdf`;
  await getStorage().put(key, bytes);

  await prisma.manual.create({
    data: {
      modelKitId,
      pdfKey: key,
      recognizeStatus: "pending",
    },
  });

  revalidatePath(`/admin/kits/${modelKitId}`);
}
