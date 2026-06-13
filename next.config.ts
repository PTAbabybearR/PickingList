import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 识别会读取本地 PDF 并发给模型，可能传较大 base64；放宽 Server Action 体积上限
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // PDF 转图依赖(含原生 canvas)不打包，运行时按 node 模块加载
  serverExternalPackages: ["pdf-to-img", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
