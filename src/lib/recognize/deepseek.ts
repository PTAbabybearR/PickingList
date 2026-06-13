import OpenAI from "openai";
import { ExtractionSchema, type Extraction } from "./schema";

const PROMPT = `你是一名高达/机甲拼装模型(Gunpla)说明书解析助手。下面是一本官方说明书的逐页图片。
请提取"取件表"数据，并**只**返回一个 JSON 对象，不要任何额外文字。JSON 结构如下：

{
  "modelKit": { "name": "型号名称", "code": "型号编号(可空)", "scale": "比例如1/144(可空)" },
  "runners": [            // 板件列表(核心，准确率优先)
    {
      "label": "板件编号 如 A",
      "color": "注塑颜色(可空)",
      "count": 1,         // 同款板件张数
      "parts": [ { "gateNo": "剪口编号 如 A-3", "quantity": 1, "note": "备注(可空)" } ]
    }
  ],
  "steps": [              // 拼装步骤(尽力而为，识别困难时可为空数组 [])
    { "stepNo": 1, "pageNo": 3, "parts": [ { "gateNo": "A-3", "quantity": 1 } ] }
  ]
}

要求：
- 板件与剪口号尽量准确、完整；数量为整数。
- 步骤为装配示意图，难识别；不确定时宁缺勿错，可返回空数组。
- 仅依据图片内容，不要臆造。`;

export function createDeepSeekClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  });
}

export async function recognizeWithDeepSeek(images: Buffer[]): Promise<Extraction> {
  const client = createDeepSeekClient();
  const model = process.env.RECOGNITION_MODEL ?? "deepseek-v4-flash";

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: PROMPT },
    ...images.map(
      (img): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${img.toString("base64")}` },
      }),
    ),
  ];

  const res = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
    response_format: { type: "json_object" },
    max_tokens: 8192,
  });

  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("DeepSeek 未返回内容");

  return ExtractionSchema.parse(JSON.parse(text));
}
