"use client";

import Link from "next/link";

export function AccountEntry() {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden rounded-full border border-ink/10 bg-white px-3 py-1 text-xs text-ink/65 md:inline-flex">本地模式</span>
      <Link href="/plan?tab=import" className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs text-ink/70">
        去导入
      </Link>
    </div>
  );
}
