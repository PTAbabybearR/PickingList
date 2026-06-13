import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { pdfToTiles } from "./pdf";
import { recognizeWithDeepSeek } from "./deepseek";
import { recognizeWithGemini } from "./gemini";
import { persistExtraction, type PersistResult } from "./persist";
import type { Extraction } from "./schema";

const MAX_PAGES = Number(process.env.RECOGNITION_MAX_PAGES ?? "40");
const SCALE = Number(process.env.RECOGNITION_SCALE ?? "6");
const TILE_COLS = Number(process.env.RECOGNITION_TILE_COLS ?? "2");
const TILE_ROWS = Number(process.env.RECOGNITION_TILE_ROWS ?? "2");

/** 识别提供商分发（适配器）。新增 provider 在此加一个分支即可。 */
function recognizeImages(images: Buffer[]): Promise<Extraction> {
  const provider = process.env.LLM_PROVIDER ?? "gemini";
  switch (provider) {
    case "gemini":
      return recognizeWithGemini(images);
    case "deepseek":
      return recognizeWithDeepSeek(images);
    default:
      throw new Error(`未支持的识别提供商: ${provider}`);
  }
}

/**
 * 自动识别一本说明书：读本地 PDF → 转图 → 视觉模型结构化提取 → 写入草稿。
 * 更新 Manual.recognizeStatus：processing → done / failed。
 */
export async function recognizeManual(manualId: string): Promise<PersistResult> {
  const manual = await prisma.manual.findUnique({ where: { id: manualId } });
  if (!manual) throw new Error("说明书不存在");

  await prisma.manual.update({
    where: { id: manualId },
    data: { recognizeStatus: "processing" },
  });

  try {
    const pdf = await getStorage().read(manual.pdfKey);
    // 高倍渲染 + 切块：避免整页被模型压缩丢失小剪口号（实测准确率大幅提升）
    const { images, totalPages, truncated } = await pdfToTiles(pdf, {
      scale: SCALE,
      cols: TILE_COLS,
      rows: TILE_ROWS,
      maxPages: MAX_PAGES,
    });
    if (truncated) {
      console.warn(
        `[recognize] ${manual.pdfKey} 共 ${totalPages} 页，仅识别前 ${MAX_PAGES} 页`,
      );
    }

    const ext = await recognizeImages(images);
    const result = await persistExtraction(manual.modelKitId, ext);

    await prisma.manual.update({
      where: { id: manualId },
      data: {
        recognizeStatus: "done",
        recognizedAt: new Date(),
        pageCount: totalPages,
      },
    });
    return result;
  } catch (e) {
    await prisma.manual.update({
      where: { id: manualId },
      data: { recognizeStatus: "failed" },
    });
    throw e;
  }
}
