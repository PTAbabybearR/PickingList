import { prisma } from "@/lib/db";
import type { Extraction } from "./schema";

export type PersistResult = {
  sections: number;
  items: number; // 取件项总条数
  totalQty: number; // 数量合计
};

/**
 * 把识别提取结果写入草稿（Section/SectionPart）。
 * 幂等：先清空该型号已有的 Section（级联删 SectionPart），再重建。
 * 手动导入与自动识别共用此函数。
 */
export async function persistExtraction(
  modelKitId: string,
  ext: Extraction,
): Promise<PersistResult> {
  return prisma.$transaction(async (tx) => {
    await tx.section.deleteMany({ where: { modelKitId } });

    let items = 0;
    let totalQty = 0;

    for (let i = 0; i < ext.sections.length; i++) {
      const s = ext.sections[i];
      const section = await tx.section.create({
        data: {
          modelKitId,
          name: s.name,
          color: s.color ?? null,
          sortOrder: i,
        },
      });
      for (let j = 0; j < s.parts.length; j++) {
        const p = s.parts[j];
        await tx.sectionPart.create({
          data: {
            sectionId: section.id,
            runnerName: p.runnerName,
            gateNo: p.gateNo,
            quantity: p.quantity,
            sortOrder: j,
          },
        });
        items++;
        totalQty += p.quantity;
      }
    }

    // 同步型号编号/比例（仅在原值为空时补）
    if (ext.modelKit) {
      const kit = await tx.modelKit.findUnique({ where: { id: modelKitId } });
      if (kit) {
        await tx.modelKit.update({
          where: { id: modelKitId },
          data: {
            code: kit.code ?? ext.modelKit.code ?? null,
            scale: kit.scale ?? ext.modelKit.scale ?? null,
          },
        });
      }
    }

    return { sections: ext.sections.length, items, totalQty };
  });
}
