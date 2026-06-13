import { z } from "zod";

/**
 * 识别提取的结构化 Schema —— 对应 PRD 附录 B。
 * 提供商无关：手动导入(我/Claude Code 产出)与自动识别(DeepSeek)共用同一结构。
 */

export const PartSchema = z.object({
  gateNo: z.string().describe("剪口编号，如 A-3"),
  quantity: z.number().int().describe("单张板件上该零件数量"),
  note: z.string().optional().describe("备注"),
});

export const RunnerSchema = z.object({
  label: z.string().describe("板件编号，如 A / B / C"),
  color: z.string().optional().describe("注塑颜色"),
  count: z.number().int().describe("同款板件张数，默认 1"),
  parts: z.array(PartSchema),
});

export const StepPartRefSchema = z.object({
  gateNo: z.string().describe("引用 runners 中的剪口编号"),
  quantity: z.number().int().describe("该步该零件用量"),
});

export const StepSchema = z.object({
  stepNo: z.number().int().describe("步骤序号"),
  pageNo: z.number().int().optional().describe("对应说明书页码"),
  parts: z.array(StepPartRefSchema),
});

export const ExtractionSchema = z.object({
  modelKit: z.object({
    name: z.string().describe("型号名称，如 RX-78-2 高达"),
    code: z.string().optional().describe("型号编号"),
    scale: z.string().optional().describe("比例，如 1/144"),
  }),
  runners: z.array(RunnerSchema).describe("板件列表（核心，准确率优先）"),
  steps: z.array(StepSchema).describe("拼装步骤（降级：尽力而为，可为空数组）"),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
