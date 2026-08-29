import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import UpdateNotifier from "../components/UpdateNotifier";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <UpdateNotifier />
        {children}
      </body>
    </html>
  );
}
