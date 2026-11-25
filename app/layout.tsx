
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // 这一行最重要，引入刚刚建好的样式

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI 短剧创作平台",
  description: "从创意到成片的全流程 AI 创作工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
