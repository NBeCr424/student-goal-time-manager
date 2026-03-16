"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页", short: "Home" },
  { href: "/plan", label: "计划", short: "Plan" },
  { href: "/knowledge", label: "知识库", short: "Wiki" },
  { href: "/ideas", label: "想法", short: "Idea" },
  { href: "/profile", label: "我的", short: "Me" },
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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/92 px-2 py-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-medium transition ${
                  active ? "bg-mint/30 text-ink" : "text-ink/70"
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider">{item.short}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
