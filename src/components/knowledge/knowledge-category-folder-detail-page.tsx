"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { markRecentKnowledgeCategory } from "@/lib/knowledge-category-preferences";
import { useAppStore } from "@/store/app-store";

interface KnowledgeCategoryFolderDetailPageProps {
  categoryId: string;
}

type SourceFilter = "all" | "today_note" | "outside_knowledge";

function sourceLabel(sourceType?: string): string {
  if (sourceType === "today_note") {
    return "今日速记";
  }
  if (sourceType === "outside_knowledge") {
    return "非课堂积累";
  }
  return "知识条目";
}

function summarize(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (clean.length <= 90) {
    return clean;
  }
  return `${clean.slice(0, 90)}...`;
}

export function KnowledgeCategoryFolderDetailPage({ categoryId }: KnowledgeCategoryFolderDetailPageProps) {
  const { state } = useAppStore();
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  useEffect(() => {
    markRecentKnowledgeCategory(categoryId);
  }, [categoryId]);

  const category = state.knowledgeCategories.find((item) => item.id === categoryId);

  const relatedCategoryIds = useMemo(
    () => [categoryId, ...state.knowledgeCategories.filter((item) => item.parentId === categoryId).map((item) => item.id)],
    [categoryId, state.knowledgeCategories],
  );

  const itemList = useMemo(
    () =>
      state.knowledgeItems
        .filter((item) => relatedCategoryIds.includes(item.categoryId ?? "cat_uncategorized"))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [relatedCategoryIds, state.knowledgeItems],
  );

  const filteredItemList = useMemo(() => {
    if (sourceFilter === "all") {
      return itemList;
    }
    return itemList.filter((item) => (item.sourceType ?? "outside_knowledge") === sourceFilter);
  }, [itemList, sourceFilter]);

  if (!category) {
    return (
      <div className="card-surface p-4">
        <h2 className="section-title">分类不存在</h2>
        <p className="mt-2 text-sm text-ink/65">该分类可能已删除。</p>
        <Link href="/knowledge/categories" className="mt-3 inline-flex rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink/70">
          返回分类文件夹
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">{category.name}</h2>
            <p className="mt-1 text-sm text-ink/65">该分类下共 {itemList.length} 条内容。</p>
          </div>
          <Link href="/knowledge/categories" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回文件夹
          </Link>
        </div>

        <div className="mt-3 inline-flex rounded-full border border-ink/15 bg-white p-1">
          <button
            type="button"
            onClick={() => setSourceFilter("all")}
            className={`rounded-full px-3 py-1 text-xs ${sourceFilter === "all" ? "bg-ink text-white" : "text-ink/70"}`}
          >
            全部
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("today_note")}
            className={`rounded-full px-3 py-1 text-xs ${sourceFilter === "today_note" ? "bg-ink text-white" : "text-ink/70"}`}
          >
            今日速记
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter("outside_knowledge")}
            className={`rounded-full px-3 py-1 text-xs ${sourceFilter === "outside_knowledge" ? "bg-ink text-white" : "text-ink/70"}`}
          >
            非课堂积累
          </button>
        </div>
      </section>

      <section className="card-surface p-4">
        <ul className="space-y-2">
          {filteredItemList.map((item) => {
            const attachmentCount = item.attachments?.length ?? 0;
            return (
              <li key={item.id}>
                <Link href={`/knowledge/items/${item.id}`} className="block rounded-xl border border-ink/10 bg-white p-3">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-ink/60">{summarize(item.content)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink/60">
                    <span className="badge border-ink/15 bg-paper text-ink/70">{item.updatedAt}</span>
                    <span className="badge border-ink/15 bg-white text-ink/70">{sourceLabel(item.sourceType)}</span>
                    {attachmentCount > 0 && <span className="badge border-ink/15 bg-white text-ink/70">附件 {attachmentCount}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {filteredItemList.length === 0 && <p className="mt-2 text-sm text-ink/60">当前筛选下暂时没有内容。</p>}
      </section>
    </div>
  );
}
