import { z } from "zod";

/**
 * 识别提取的结构化 Schema —— 以"部位"为核心组织（参考 dammiz 取件表结构）。
 * 手动导入与自动识别共用同一结构。
 */

export const SectionPartSchema = z.object({
  runnerName: z.string().describe("板件名，如 A / B1"),
  gateNo: z.string().describe("剪口编号，如 26"),
  quantity: z.number().int().describe("该部位需要这个零件的数量"),
});

export const SectionSchema = z.object({
  name: z.string().describe("部位名，如 头 / 胸部 / 手臂 / 腿部"),
  color: z.string().optional().describe("UI 标记色 hex，如 #1E90FF，可空"),
  parts: z.array(SectionPartSchema),
});

export const ExtractionSchema = z.object({
  modelKit: z.object({
    name: z.string().describe("型号名称，如 RX-78-2 高达"),
    code: z.string().optional().describe("型号编号"),
    scale: z.string().optional().describe("比例，如 1/144"),
  }),
  sections: z.array(SectionSchema).describe("按部位组织的取件表"),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
