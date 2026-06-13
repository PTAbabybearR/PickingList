import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PickingList — 拼装模型取件表",
  description: "高达 / 机甲拼装模型取件表平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
