"use client";

import { useMemo, useState } from "react";
import { KnowledgeCategory } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const categoryOptions: Array<{ label: string; value: "all" | KnowledgeCategory }> = [
  { label: "全部", value: "all" },
  { label: "课程笔记", value: "course_notes" },
  { label: "方法库", value: "method_library" },
  { label: "错题整理", value: "wrong_question" },
  { label: "链接收藏", value: "link_collection" },
];

const categoryLabelMap: Record<KnowledgeCategory, string> = {
  course_notes: "课程笔记",
  method_library: "方法库",
  wrong_question: "错题整理",
  link_collection: "链接收藏",
};

export function KnowledgePage() {
  const { state } = useAppStore();

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<"all" | KnowledgeCategory>("all");
  const [selectedId, setSelectedId] = useState<string | null>(state.knowledgeItems[0]?.id ?? null);

  const filtered = useMemo(() => {
    return state.knowledgeItems.filter((item) => {
      const matchCategory = category === "all" || item.category === category;
      const targetText = `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase();
      const matchKeyword = targetText.includes(keyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [category, keyword, state.knowledgeItems]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  const relatedTasks = useMemo(() => {
    if (!selected) {
      return [];
    }

    return state.tasks.filter(
      (task) => task.knowledgeItemIds.includes(selected.id) || selected.relatedTaskIds.includes(task.id),
    );
  }, [selected, state.tasks]);

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <h2 className="section-title">知识库</h2>
        <p className="mt-1 text-sm text-ink/70">快速找到学习资料，支持任务关联和分类检索。</p>

        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_220px]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索标题、内容、标签"
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as "all" | KnowledgeCategory)}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="card-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">资料列表</h3>
            <span className="text-xs text-ink/60">{filtered.length} 条</span>
          </div>

          <ul className="mt-3 space-y-2">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    selected?.id === item.id ? "border-ink bg-ink/5" : "border-ink/10 bg-white"
                  }`}
                >
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-ink/65">{categoryLabelMap[item.category]}</p>
                </button>
              </li>
            ))}
          </ul>

          {filtered.length === 0 && <p className="mt-3 text-sm text-ink/60">没有匹配资料。</p>}
        </article>

        <article className="card-surface p-4 md:p-5">
          {!selected && <p className="text-sm text-ink/60">请选择一条知识内容查看详情。</p>}

          {selected && (
            <>
              <p className="soft-label">{categoryLabelMap[selected.category]}</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">{selected.title}</h3>
              <p className="mt-3 rounded-xl bg-white p-3 text-sm text-ink/85 whitespace-pre-wrap">{selected.content}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {selected.tags.map((tag) => (
                  <span key={tag} className="badge border-ink/15 bg-paper text-ink/70">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">关联任务</p>
                <ul className="mt-2 space-y-1 text-sm text-ink/80">
                  {relatedTasks.map((task) => (
                    <li key={task.id}>- {task.title}</li>
                  ))}
                </ul>
                {relatedTasks.length === 0 && <p className="mt-1 text-sm text-ink/55">暂无关联任务。</p>}
              </div>

              <p className="mt-3 text-xs text-ink/55">创建于 {selected.createdAt} · 更新于 {selected.updatedAt}</p>
            </>
          )}
        </article>
      </section>
    </div>
  );
}
