
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "短剧 AI 工作台",
  description: "AI 短剧创作平台"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

