"use client";

import { FormEvent, useMemo, useState } from "react";
import { IdeaCategory, IdeaStatus, TaskPlanType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const categoryMap: Record<IdeaCategory, string> = {
  study_inspiration: "学习灵感",
  temporary_todo: "临时待办",
  review_thought: "复盘想法",
  project_idea: "项目点子",
  life_note: "生活想法",
};

function formatIdeaDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const statusMap: Record<IdeaStatus, string> = {
  unprocessed: "未整理",
  archived: "已归档",
  converted_task: "已转任务",
  converted_knowledge: "已转知识库",
};

export function IdeasPage() {
  const { state, actions } = useAppStore();

  const [content, setContent] = useState("");
  const [category, setCategory] = useState<IdeaCategory>("study_inspiration");
  const [tab, setTab] = useState<"unprocessed" | "done">("unprocessed");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unprocessed = useMemo(() => state.ideas.filter((item) => item.status === "unprocessed"), [state.ideas]);
  const done = useMemo(() => state.ideas.filter((item) => item.status !== "unprocessed"), [state.ideas]);
  const list = tab === "unprocessed" ? unprocessed : done;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }
    actions.addIdea(content, category);
    setContent("");
  }

  function convertToTask(ideaId: string, planType: TaskPlanType) {
    actions.convertIdeaToTask(ideaId, planType);
    setExpandedId(null);
  }

  return (
    <div className="space-y-3">
      <section className="card-surface p-4">
        <h2 className="section-title">快速收件箱</h2>
        <p className="mt-1 text-xs text-ink/60">先记下来，整理动作放到后面做。</p>

        <form onSubmit={onSubmit} className="mt-3 space-y-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="输入你的想法或临时待办..."
            className="w-full resize-none rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
          />

          <div className="flex gap-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as IdeaCategory)}
              className="flex-1 rounded-xl border border-ink/15 px-3 py-2 text-sm"
            >
              {Object.entries(categoryMap).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <button type="submit" className="rounded-xl bg-ink px-5 py-2 text-sm font-medium text-white">
              记录
            </button>
          </div>
        </form>
      </section>

      <section className="card-surface p-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("unprocessed")}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              tab === "unprocessed" ? "bg-ink text-white" : "bg-white text-ink/70"
            }`}
          >
            未整理{unprocessed.length > 0 && <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">{unprocessed.length}</span>}
          </button>

          <button
            type="button"
            onClick={() => setTab("done")}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              tab === "done" ? "bg-ink text-white" : "bg-white text-ink/70"
            }`}
          >
            已整理
          </button>
        </div>
      </section>

      <section className="space-y-2">
        {list.map((idea) => (
          <article key={idea.id} className="card-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink/85">{idea.content}</p>
                <p className="mt-1 text-xs text-ink/45">
                  {categoryMap[idea.category]} · {formatIdeaDate(idea.createdAt)}
                  {idea.status !== "unprocessed" && ` · ${statusMap[idea.status]}`}
                </p>
              </div>

              {idea.status === "unprocessed" && (
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                  className="shrink-0 rounded-lg border border-ink/15 bg-white px-2.5 py-1 text-xs text-ink/60"
                >
                  {expandedId === idea.id ? "收起" : "更多操作"}
                </button>
              )}
            </div>

            {expandedId === idea.id && (
              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-ink/8 pt-2">
                <button
                  type="button"
                  onClick={() => convertToTask(idea.id, "today_other")}
                  className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs text-ink/75"
                >
                  转今日任务
                </button>
                <button
                  type="button"
                  onClick={() => convertToTask(idea.id, "weekly")}
                  className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs text-ink/75"
                >
                  转本周任务
                </button>
                <button
                  type="button"
                  onClick={() => {
                    actions.convertIdeaToKnowledge(idea.id, "cat_method");
                    setExpandedId(null);
                  }}
                  className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs text-ink/75"
                >
                  转知识库
                </button>
                <button
                  type="button"
                  onClick={() => {
                    actions.updateIdeaStatus(idea.id, "archived");
                    setExpandedId(null);
                  }}
                  className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs text-ink/75"
                >
                  归档
                </button>
              </div>
            )}
          </article>
        ))}

        {list.length === 0 && (
          <p className="py-6 text-center text-sm text-ink/50">{tab === "unprocessed" ? "收件箱已清空。" : "还没有已整理内容。"}</p>
        )}
      </section>
    </div>
  );
}
