import './globals.css';

export const metadata = {
  title: '短剧工坊',
  description: 'AI 短剧创作平台',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
