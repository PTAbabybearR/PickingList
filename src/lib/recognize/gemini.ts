import OpenAI from "openai";
import { ExtractionSchema, type Extraction } from "./schema";
import { RECOGNIZE_PROMPT as PROMPT } from "./prompt";

/** Gemini（Google AI Studio）的 OpenAI 兼容客户端。支持 image_url 图片输入。 */
export function createGeminiClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL:
      process.env.GEMINI_BASE_URL ??
      "https://generativelanguage.googleapis.com/v1beta/openai",
  });
}

export async function recognizeWithGemini(images: Buffer[]): Promise<Extraction> {
  const client = createGeminiClient();
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

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
  if (!text) throw new Error("Gemini 未返回内容");

  return ExtractionSchema.parse(JSON.parse(text));
}
