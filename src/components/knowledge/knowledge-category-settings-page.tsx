"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KnowledgeCategoryManager } from "@/components/knowledge/knowledge-category-manager";
import { useAppStore } from "@/store/app-store";

export function KnowledgeCategorySettingsPage() {
  const { state, actions } = useAppStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

  const itemCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    state.knowledgeItems.forEach((item) => {
      if (item.categoryId) {
        map[item.categoryId] = (map[item.categoryId] ?? 0) + 1;
      }
    });
    return map;
  }, [state.knowledgeItems]);

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">分类管理</h2>
            <p className="mt-1 text-sm text-ink/65">低频功能下沉到设置页，避免首页过载。</p>
          </div>
          <Link href="/knowledge" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回知识库
          </Link>
        </div>
      </section>

      <KnowledgeCategoryManager
        categories={state.knowledgeCategories}
        itemCountByCategory={itemCountByCategory}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onAddCategory={actions.addKnowledgeCategory}
        onUpdateCategory={actions.updateKnowledgeCategory}
        onDeleteCategory={actions.deleteKnowledgeCategory}
        onReorderCategory={actions.reorderKnowledgeCategory}
      />
    </div>
  );
}
