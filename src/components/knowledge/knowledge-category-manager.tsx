"use client";

import { FormEvent, useMemo, useState } from "react";
import { KnowledgeCategory } from "@/lib/types";

interface KnowledgeCategoryManagerProps {
  categories: KnowledgeCategory[];
  itemCountByCategory: Record<string, number>;
  selectedCategoryId?: string;
  onSelectCategory: (categoryId?: string) => void;
  onAddCategory: (name: string, parentId?: string) => void;
  onUpdateCategory: (categoryId: string, name: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategory: (categoryId: string, direction: "up" | "down") => void;
}

export function KnowledgeCategoryManager({
  categories,
  itemCountByCategory,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategory,
}: KnowledgeCategoryManagerProps) {
  const [newName, setNewName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parentId).sort((a, b) => a.order - b.order),
    [categories],
  );

  function submitNewCategory(event: FormEvent) {
    event.preventDefault();
    if (!newName.trim()) {
      return;
    }

    onAddCategory(newName, parentId || undefined);
    setNewName("");
    setParentId("");
  }

  return (
    <section className="space-y-3">
      <form className="rounded-xl border border-ink/10 bg-white p-3" onSubmit={submitNewCategory}>
        <h4 className="text-sm font-semibold text-ink">分类管理</h4>
        <p className="mt-1 text-xs text-ink/60">支持父子一层嵌套，系统分类不可删除。</p>

        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_180px_120px]">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="新增分类名称"
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
          <select
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="">无父分类</option>
            {parentCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white">
            新增
          </button>
        </div>
      </form>

      <article className="rounded-xl border border-ink/10 bg-white p-3">
        <button
          type="button"
          onClick={() => onSelectCategory(undefined)}
          className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${!selectedCategoryId ? "bg-mint/35" : "hover:bg-paper"}`}
        >
          全部分类
        </button>

        <ul className="mt-2 space-y-2">
          {parentCategories.map((category) => {
            const children = categories
              .filter((item) => item.parentId === category.id)
              .sort((a, b) => a.order - b.order);

            const editing = editingId === category.id;

            return (
              <li key={category.id} className="rounded-lg border border-ink/10 p-2">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    className={`flex-1 rounded px-2 py-1 text-left text-sm ${
                      selectedCategoryId === category.id ? "bg-mint/35" : "hover:bg-paper"
                    }`}
                  >
                    {category.name}
                    <span className="ml-1 text-xs text-ink/55">({itemCountByCategory[category.id] ?? 0})</span>
                    {category.isSystem && <span className="ml-1 text-[11px] text-sky-600">系统</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => onReorderCategory(category.id, "up")}
                    className="rounded border border-ink/15 px-2 py-1 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorderCategory(category.id, "down")}
                    className="rounded border border-ink/15 px-2 py-1 text-xs"
                  >
                    ↓
                  </button>
                </div>

                <div className="mt-1 flex flex-wrap gap-1">
                  {editing ? (
                    <>
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="flex-1 rounded border border-ink/15 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateCategory(category.id, editingName);
                          setEditingId(null);
                          setEditingName("");
                        }}
                        className="rounded bg-ink px-2 py-1 text-xs text-white"
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                      className="rounded border border-ink/15 px-2 py-1 text-xs"
                    >
                      编辑
                    </button>
                  )}

                  {!category.isSystem && (
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(category.id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                    >
                      删除
                    </button>
                  )}
                </div>

                {children.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-3">
                    {children.map((child) => (
                      <li key={child.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectCategory(child.id)}
                          className={`flex-1 rounded px-2 py-1 text-left text-xs ${
                            selectedCategoryId === child.id ? "bg-mint/35" : "hover:bg-paper"
                          }`}
                        >
                          - {child.name}
                          <span className="ml-1 text-[11px] text-ink/55">({itemCountByCategory[child.id] ?? 0})</span>
                        </button>
                        {!child.isSystem && (
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(child.id)}
                            className="rounded border border-red-200 px-2 py-0.5 text-[11px] text-red-600"
                          >
                            删
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}