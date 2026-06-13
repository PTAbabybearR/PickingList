import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 识别会读取本地 PDF 并发给 Claude，可能传较大 base64；放宽 Server Action 体积上限
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
