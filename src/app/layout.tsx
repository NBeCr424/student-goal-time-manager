import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";
import { AppFrame } from "@/components/layout/app-frame";
import { AppStoreProvider } from "@/store/app-store";

const bodyFont = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-body",
});

const titleFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-title",
});

export const metadata: Metadata = {
  title: "学生目标驱动时间管理 App",
  description: "面向学生的轻量目标管理、三件事执行、复盘与目标驱动日历。",
  applicationName: "学生时间管理",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#6fd3c8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${bodyFont.variable} ${titleFont.variable} font-sans text-ink antialiased`}>
        <AppStoreProvider>
          <AppFrame>{children}</AppFrame>
        </AppStoreProvider>
      </body>
    </html>
  );
}
