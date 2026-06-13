import { prisma } from "@/lib/db";
import type { Extraction } from "./schema";

export type PersistResult = {
  runners: number;
  parts: number;
  steps: number;
  stepParts: number;
  unmatchedGateNos: string[]; // 步骤里引用了但板件清单中找不到的剪口号
};

/**
 * 把识别提取结果写入草稿（Runner/Part/Step/StepPart）。
 * 幂等：先清空该型号已有的 Runner 与 Step（级联删除 Part / StepPart），再重建。
 * 手动导入与自动识别共用此函数。
 */
export async function persistExtraction(
  modelKitId: string,
  ext: Extraction,
): Promise<PersistResult> {
  return prisma.$transaction(async (tx) => {
    // 清空旧数据（Part 随 Runner 级联删、StepPart 随 Part/Step 级联删）
    await tx.runner.deleteMany({ where: { modelKitId } });
    await tx.step.deleteMany({ where: { modelKitId } });

    const gateMap = new Map<string, string>(); // gateNo -> partId
    let parts = 0;

    for (const r of ext.runners) {
      const runner = await tx.runner.create({
        data: {
          modelKitId,
          label: r.label,
          color: r.color ?? null,
          count: r.count ?? 1,
        },
      });
      for (const p of r.parts) {
        const part = await tx.part.create({
          data: {
            runnerId: runner.id,
            gateNo: p.gateNo,
            quantity: p.quantity,
            note: p.note ?? null,
          },
        });
        gateMap.set(p.gateNo, part.id);
        parts++;
      }
    }

    let stepParts = 0;
    const unmatched = new Set<string>();

    for (const s of ext.steps) {
      const step = await tx.step.create({
        data: { modelKitId, stepNo: s.stepNo, pageNo: s.pageNo ?? null },
      });
      for (const sp of s.parts) {
        const partId = gateMap.get(sp.gateNo);
        if (!partId) {
          unmatched.add(sp.gateNo); // 找不到对应零件：不丢弃信息，记录待复核
          continue;
        }
        await tx.stepPart.create({
          data: { stepId: step.id, partId, quantity: sp.quantity },
        });
        stepParts++;
      }
    }

    // 可选：同步型号名称/编号/比例（仅在原值为空时补）
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

    return {
      runners: ext.runners.length,
      parts,
      steps: ext.steps.length,
      stepParts,
      unmatchedGateNos: [...unmatched],
    };
  });
}
