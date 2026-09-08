import type { Metadata, Viewport } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import UpdateNotifier from "../components/UpdateNotifier";

export const metadata: Metadata = {
  title: "ハンコマスター検定",
  description: "日本の伝統的なマナー、ハンコ捺印の極意を学ぶ。",
  // GitHub PagesのbasePath配下（/hanko-master-kentei/）に配信されるため、
  // Next.jsのMetadata APIがbasePathを自動付与しないルート相対パス（先頭"/"）ではなく、
  // ページ自身のURLを基準に解決される相対パスを使う（next.config.mjsの
  // basePath設定と二重管理にならないようにするため）。
  manifest: "manifest.json",
  icons: {
    icon: [
      { url: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#D93A21",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* 共通フォント「M PLUS Rounded 1c」（dev-standards docs/frontend-ui-conventions.md、issue #240） */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ServiceWorkerRegistration />
        <UpdateNotifier />
        {children}
      </body>
    </html>
  );
}
