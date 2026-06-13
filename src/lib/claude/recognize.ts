import { z } from "zod";
import { anthropic, RECOGNITION_MODEL } from "./client";
import { ExtractionSchema, type Extraction } from "./schema";
import { getStorage } from "@/lib/storage";

const PROMPT = `你是一名高达/机甲拼装模型(Gunpla)说明书解析助手。
请阅读这本官方 PDF 说明书，按给定结构提取"取件表"数据：

1.【核心，准确率优先】板件(runner)总览：板件编号、注塑颜色、同款张数；
   每块板件上的零件：剪口编号(如 A-3)、单张板件上的数量。
2.【尽力而为】拼装步骤：步号、对应页码、该步用到的零件(剪口编号)及用量。
   步骤为装配示意图，识别困难；不确定时宁缺勿错，可返回空数组。

仅依据说明书内容，不要臆造。`;

/**
 * 识别一本说明书 PDF，返回结构化提取结果（对应 PRD 附录 B）。
 *
 * 占位实现：已打通"读本地 PDF → base64 → Claude 原生读取 → 结构化输出 → Zod 校验"，
 * 尚未接入：分页/大文件分批、Prompt Caching、写入数据库草稿、错误重试。
 * 这些在接管理员上传流程时补全。
 */
export async function recognizeManual(pdfKey: string): Promise<Extraction> {
  const pdf = await getStorage().read(pdfKey);
  const base64 = pdf.toString("base64");

  const res = await anthropic.messages.create({
    model: RECOGNITION_MODEL,
    max_tokens: 16000,
    output_config: {
      format: {
        type: "json_schema",
        schema: z.toJSONSchema(ExtractionSchema),
      },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("识别失败：模型未返回文本结果");
  }
  return ExtractionSchema.parse(JSON.parse(text.text));
}
