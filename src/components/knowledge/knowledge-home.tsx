"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";

function sourceLabel(sourceType?: string): string {
  if (sourceType === "today_note") {
    return "今日速记";
  }
  if (sourceType === "outside_knowledge") {
    return "长期积累";
  }
  return "知识条目";
}

export function KnowledgeHome() {
  const { state } = useAppStore();
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const recentItems = useMemo(
    () => [...state.knowledgeItems].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4),
    [state.knowledgeItems],
  );

  function onSearch() {
    const clean = keyword.trim();
    if (!clean) {
      router.push("/knowledge/items");
      return;
    }
    router.push(`/knowledge/items?q=${encodeURIComponent(clean)}`);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">知识库</h2>
            <p className="mt-1 text-sm text-ink/65">上方负责录入，下方通过分类文件夹浏览资料。</p>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickCreate((prev) => !prev)}
            className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70"
          >
            {showQuickCreate ? "收起入口" : "新建入口"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSearch();
              }
            }}
            placeholder="搜索标题、正文、标签"
            className="min-w-0 flex-1 rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
          <button type="button" onClick={onSearch} className="rounded-xl bg-ink px-4 py-2 text-sm text-white">
            搜索
          </button>
        </div>

        {showQuickCreate && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/knowledge/today-note" className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-ink/70">
              今日知识速记
            </Link>
            <Link href="/knowledge/outside" className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-ink/70">
              非课堂知识积累
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/knowledge/today-note" className="rounded-2xl border border-mint/45 bg-mint/15 p-4">
          <p className="text-xs text-ink/60">快速记录</p>
          <h3 className="mt-1 text-base font-semibold text-ink">今日知识速记</h3>
          <p className="mt-1 text-xs text-ink/70">课堂重点、临时概念、方法要点，先记下来再整理。</p>
        </Link>

        <Link href="/knowledge/outside" className="rounded-2xl border border-sky/40 bg-sky/10 p-4">
          <p className="text-xs text-ink/60">长期沉淀</p>
          <h3 className="mt-1 text-base font-semibold text-ink">非课堂知识积累</h3>
          <p className="mt-1 text-xs text-ink/70">自学资料、阅读笔记、课外整理，持续形成个人资料库。</p>
        </Link>
      </section>

      <section className="px-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink/60">按分类找知识</p>
          <Link
            href="/knowledge/categories"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/75"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-sm">📁</span>
            分类文件夹
          </Link>
        </div>
      </section>

      <section className="card-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">最近使用</h3>
          <Link href="/knowledge/items" className="text-xs text-ink/65 underline">
            查看全部
          </Link>
        </div>

        <ul className="mt-3 space-y-2">
          {recentItems.map((item) => (
            <li key={item.id}>
              <Link href={`/knowledge/items/${item.id}`} className="block rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-ink/55">
                  {sourceLabel(item.sourceType)} · 更新于 {item.updatedAt}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {recentItems.length === 0 && <p className="mt-2 text-sm text-ink/60">暂无知识条目。</p>}
      </section>

      <details className="card-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">低频管理</summary>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href="/knowledge/settings/categories" className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-ink/70">
            分类管理
          </Link>
          <Link href="/knowledge/courses" className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-ink/70">
            课程学习地图
          </Link>
        </div>
      </details>
    </div>
  );
}
