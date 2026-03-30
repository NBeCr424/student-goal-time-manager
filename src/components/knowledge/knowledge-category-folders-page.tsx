"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  KnowledgeCategoryPreferenceState,
  loadKnowledgeCategoryPreferences,
  markRecentKnowledgeCategory,
  saveKnowledgeCategoryPreferences,
  togglePinnedKnowledgeCategory,
} from "@/lib/knowledge-category-preferences";
import { useAppStore } from "@/store/app-store";

const EMPTY_PREFS: KnowledgeCategoryPreferenceState = {
  pinnedCategoryIds: [],
  recentCategoryIds: [],
};

const UNCATEGORIZED_CATEGORY_ID = "cat_uncategorized";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" aria-label="关闭抽屉" onClick={onClose} className="absolute inset-0 bg-black/35" />
      <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-ink">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70"
          >
            关闭
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function KnowledgeCategoryFoldersPage() {
  const { state, actions } = useAppStore();
  const [preferences, setPreferences] = useState<KnowledgeCategoryPreferenceState>(EMPTY_PREFS);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [menuCategoryId, setMenuCategoryId] = useState<string | null>(null);
  const [pendingDeleteCategoryId, setPendingDeleteCategoryId] = useState<string | null>(null);
  const [hint, setHint] = useState("");

  useEffect(() => {
    setPreferences(loadKnowledgeCategoryPreferences());
  }, []);

  useEffect(() => {
    const validCategoryIds = new Set(state.knowledgeCategories.map((category) => category.id));
    setPreferences((prev) => {
      const pinnedCategoryIds = prev.pinnedCategoryIds.filter((id) => validCategoryIds.has(id));
      const recentCategoryIds = prev.recentCategoryIds.filter((id) => validCategoryIds.has(id));
      if (
        pinnedCategoryIds.length === prev.pinnedCategoryIds.length &&
        recentCategoryIds.length === prev.recentCategoryIds.length
      ) {
        return prev;
      }
      return saveKnowledgeCategoryPreferences({ pinnedCategoryIds, recentCategoryIds });
    });
  }, [state.knowledgeCategories]);

  const topLevelCategories = useMemo(
    () => state.knowledgeCategories.filter((category) => !category.parentId).sort((a, b) => a.order - b.order),
    [state.knowledgeCategories],
  );

  const categoryStats = useMemo(() => {
    const childMap = new Map<string, string[]>();
    state.knowledgeCategories.forEach((category) => {
      if (!category.parentId) {
        return;
      }
      const list = childMap.get(category.parentId) ?? [];
      list.push(category.id);
      childMap.set(category.parentId, list);
    });

    return topLevelCategories.map((category) => {
      const relatedIds = [category.id, ...(childMap.get(category.id) ?? [])];
      const relatedItems = state.knowledgeItems.filter((item) =>
        relatedIds.includes(item.categoryId ?? UNCATEGORIZED_CATEGORY_ID),
      );
      const latestUpdated = relatedItems.map((item) => item.updatedAt).sort((a, b) => b.localeCompare(a))[0];
      return {
        category,
        count: relatedItems.length,
        latestUpdated,
      };
    });
  }, [state.knowledgeCategories, state.knowledgeItems, topLevelCategories]);

  const statByCategoryId = useMemo(
    () => new Map(categoryStats.map((entry) => [entry.category.id, entry])),
    [categoryStats],
  );

  const pinnedStats = useMemo(
    () => preferences.pinnedCategoryIds.map((id) => statByCategoryId.get(id)).filter(isDefined),
    [preferences.pinnedCategoryIds, statByCategoryId],
  );

  const recentStats = useMemo(
    () => preferences.recentCategoryIds.map((id) => statByCategoryId.get(id)).filter(isDefined),
    [preferences.recentCategoryIds, statByCategoryId],
  );

  const editingCategory = useMemo(
    () => state.knowledgeCategories.find((category) => category.id === editingCategoryId) ?? null,
    [editingCategoryId, state.knowledgeCategories],
  );

  const pendingDeleteCategory = useMemo(
    () => state.knowledgeCategories.find((category) => category.id === pendingDeleteCategoryId) ?? null,
    [pendingDeleteCategoryId, state.knowledgeCategories],
  );

  function openCategory(categoryId: string) {
    const next = markRecentKnowledgeCategory(categoryId);
    setPreferences(next);
  }

  function togglePinned(categoryId: string) {
    const next = togglePinnedKnowledgeCategory(categoryId);
    setPreferences(next);
  }

  function submitCreateCategory(event: FormEvent) {
    event.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) {
      return;
    }
    actions.addKnowledgeCategory(clean);
    setNewCategoryName("");
    setShowCreateSheet(false);
    setHint(`已新建分类：${clean}`);
  }

  function openEditCategory(categoryId: string, categoryName: string) {
    const target = state.knowledgeCategories.find((category) => category.id === categoryId);
    if (!target || target.isSystem) {
      return;
    }

    setMenuCategoryId(null);
    setEditingCategoryId(categoryId);
    setEditingCategoryName(categoryName);
  }

  function submitEditCategory(event: FormEvent) {
    event.preventDefault();
    if (!editingCategoryId) {
      return;
    }
    const clean = editingCategoryName.trim();
    if (!clean) {
      return;
    }
    actions.updateKnowledgeCategory(editingCategoryId, clean);
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setHint("分类名称已更新。");
  }

  function requestDeleteCategory(categoryId: string) {
    setMenuCategoryId(null);
    setPendingDeleteCategoryId(categoryId);
  }

  function confirmDeleteCategory() {
    if (!pendingDeleteCategory || pendingDeleteCategory.isSystem) {
      return;
    }
    actions.deleteKnowledgeCategory(pendingDeleteCategory.id);
    setPendingDeleteCategoryId(null);
    setHint(`已删除分类：${pendingDeleteCategory.name}，原有知识内容已转为未分类。`);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="section-title">分类文件夹</h2>
            <p className="mt-1 text-sm text-ink/65">像文件夹一样按分类找知识，先找分类再看内容。</p>
          </div>
          <Link href="/knowledge" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回知识库
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateSheet(true)}
          className="mt-3 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink/80"
        >
          + 新建分类
        </button>
      </section>

      <section className="card-surface p-4">
        <div>
          <h3 className="section-title">置顶分类</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {pinnedStats.map((entry) => (
              <Link
                key={`pinned_${entry.category.id}`}
                href={`/knowledge/categories/${entry.category.id}`}
                onClick={() => openCategory(entry.category.id)}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-ink/80"
              >
                <span>📁</span>
                {entry.category.name}
              </Link>
            ))}
            {pinnedStats.length === 0 && <p className="text-xs text-ink/60">暂无置顶分类。</p>}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="section-title">最近使用分类</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentStats.map((entry) => (
              <Link
                key={`recent_${entry.category.id}`}
                href={`/knowledge/categories/${entry.category.id}`}
                onClick={() => openCategory(entry.category.id)}
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/75"
              >
                <span>📁</span>
                {entry.category.name}
              </Link>
            ))}
            {recentStats.length === 0 && <p className="text-xs text-ink/60">还没有最近使用记录。</p>}
          </div>
        </div>
      </section>

      <section className="card-surface p-4">
        <ul className="space-y-2">
          {categoryStats.map(({ category, count, latestUpdated }) => {
            const isPinned = preferences.pinnedCategoryIds.includes(category.id);
            return (
              <li key={category.id} className="rounded-xl border border-ink/10 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/knowledge/categories/${category.id}`} onClick={() => openCategory(category.id)} className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">📁</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{category.name}</p>
                        <p className="mt-1 text-xs text-ink/60">{count} 条内容</p>
                        {isPinned && (
                          <span className="mt-1 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                            已置顶
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuCategoryId((prev) => (prev === category.id ? null : category.id))}
                      className="rounded-full border border-ink/20 bg-white px-2 py-0.5 text-xs text-ink/70"
                      aria-label="更多操作"
                    >
                      ···
                    </button>
                    {menuCategoryId === category.id && (
                      <div className="absolute right-0 top-7 z-10 min-w-28 rounded-xl border border-ink/15 bg-white p-1 shadow-card">
                        {!category.isSystem && (
                          <button
                            type="button"
                            onClick={() => openEditCategory(category.id, category.name)}
                            className="w-full rounded-lg px-2 py-1 text-left text-xs text-ink/75 hover:bg-paper"
                          >
                            编辑
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            togglePinned(category.id);
                            setMenuCategoryId(null);
                          }}
                          className="w-full rounded-lg px-2 py-1 text-left text-xs text-ink/75 hover:bg-paper"
                        >
                          {isPinned ? "取消置顶" : "置顶"}
                        </button>
                        {!category.isSystem && (
                          <button
                            type="button"
                            onClick={() => requestDeleteCategory(category.id)}
                            className="w-full rounded-lg px-2 py-1 text-left text-xs text-red-700 hover:bg-red-50"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-right text-[11px] text-ink/55">{latestUpdated ? `最近更新：${latestUpdated}` : "暂无内容"}</p>
              </li>
            );
          })}
        </ul>

        {categoryStats.length === 0 && <p className="mt-2 text-sm text-ink/60">暂无分类，可先在分类管理中创建。</p>}
      </section>

      {hint && <p className="px-1 text-center text-xs text-ink/60">{hint}</p>}

      <BottomSheet open={showCreateSheet} title="新建分类" onClose={() => setShowCreateSheet(false)}>
        <form onSubmit={submitCreateCategory} className="space-y-3">
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="分类名称"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存分类
          </button>
        </form>
      </BottomSheet>

      <BottomSheet
        open={Boolean(editingCategory)}
        title="编辑分类"
        onClose={() => {
          setEditingCategoryId(null);
          setEditingCategoryName("");
        }}
      >
        {editingCategory && (
          <form onSubmit={submitEditCategory} className="space-y-3">
            <input
              value={editingCategoryName}
              onChange={(event) => setEditingCategoryName(event.target.value)}
              placeholder="分类名称"
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
            />
            <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
              保存修改
            </button>
          </form>
        )}
      </BottomSheet>

      <BottomSheet open={Boolean(pendingDeleteCategory)} title="确认删除分类" onClose={() => setPendingDeleteCategoryId(null)}>
        {pendingDeleteCategory && (
          <div className="space-y-3">
            <p className="text-sm text-ink/80">
              确认删除“{pendingDeleteCategory.name}”吗？
              <br />
              删除后，该分类下的知识内容将变为未分类。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteCategoryId(null)}
                className="flex-1 rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
