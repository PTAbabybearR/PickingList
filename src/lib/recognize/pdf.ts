export type PdfToImagesResult = {
  images: Buffer[];
  totalPages: number;
  truncated: boolean; // 是否因 maxPages 被截断
};

/**
 * 将 PDF 每页渲染为 PNG 图片（供视觉模型识别）。
 * scale 越大越清晰但越大；maxPages 限制页数以控成本，截断时 truncated=true（不静默丢弃）。
 */
export async function pdfToImages(
  data: Buffer | Uint8Array,
  opts?: { scale?: number; maxPages?: number },
): Promise<PdfToImagesResult> {
  const scale = opts?.scale ?? 2;
  const maxPages = opts?.maxPages ?? 0; // 0 = 不限

  // 动态加载：避免 pdfjs/canvas 在打包/构建期被求值
  const { pdf } = await import("pdf-to-img");
  const doc = await pdf(data, { scale });
  const total = doc.length;

  const images: Buffer[] = [];
  let i = 0;
  for await (const page of doc) {
    images.push(page);
    i++;
    if (maxPages > 0 && i >= maxPages) break;
  }

  return {
    images,
    totalPages: total,
    truncated: maxPages > 0 && total > maxPages,
  };
}
