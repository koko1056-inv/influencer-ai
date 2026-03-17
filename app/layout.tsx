import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Influencer AI - SNS自動投稿システム",
  description: "AIインフルエンサーによるSNS自動投稿管理ダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: '"Inter", "Noto Sans JP", sans-serif',
          background: "#08080c",
          color: "#e4e4e7",
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
