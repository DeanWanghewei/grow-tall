import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "成长日记",
  description: "记录小朋友的身高体重成长",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "成长日记", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#FF8A3D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="warm">
      <body className="antialiased">{children}</body>
    </html>
  );
}
