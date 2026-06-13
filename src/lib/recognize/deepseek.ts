import OpenAI from "openai";
import { ExtractionSchema, type Extraction } from "./schema";
import { RECOGNIZE_PROMPT as PROMPT } from "./prompt";

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

  let res;
  try {
    res = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      max_tokens: 8192,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("image_url") || msg.includes("image")) {
      throw new Error(
        "DeepSeek API 不支持图片输入（已实测其 OpenAI/Anthropic 兼容口均不处理图片）。" +
          "说明书是图片，无法用 DeepSeek 自动识别。请改用支持视觉的模型（如 Qwen-VL / GLM-4V / Gemini / Claude API），或使用「导入识别 JSON」手动录入。",
      );
    }
    throw e;
  }

  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("DeepSeek 未返回内容");

  return ExtractionSchema.parse(JSON.parse(text));
}
