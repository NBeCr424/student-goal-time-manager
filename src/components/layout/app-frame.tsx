"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/plan", label: "计划" },
  { href: "/knowledge", label: "知识库" },
  { href: "/ideas", label: "想法" },
  { href: "/profile", label: "我的" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/plan") {
    return pathname === "/plan" || pathname.startsWith("/goals/");
  }
  return pathname.startsWith(href);
}

function pageTitle(pathname: string): string {
  if (pathname === "/") {
    return "今日仪表盘";
  }
  if (pathname === "/plan" || pathname.startsWith("/goals/")) {
    return "目标与计划";
  }
  if (pathname === "/knowledge") {
    return "知识库";
  }
  if (pathname === "/ideas") {
    return "想法收件箱";
  }
  if (pathname === "/profile") {
    return "我的成长";
  }
  return "学生时间管理";
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div>
            <p className="soft-label">Goal-Driven Study</p>
            <h1 className="text-lg font-semibold text-ink md:text-xl">{pageTitle(pathname)}</h1>
          </div>
          <p className="hidden rounded-full border border-ink/10 bg-white px-3 py-1 text-xs text-ink/70 md:block">
            学生轻量时间管理 App MVP
          </p>
        </div>

        <div className="mx-auto hidden max-w-6xl px-4 pb-3 md:block md:px-6">
          <ul className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active ? "bg-mint text-ink" : "bg-white/80 text-ink/70 hover:bg-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
