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
  const [statusFilter, setStatusFilter] = useState<"all" | IdeaStatus>("all");

  const filteredIdeas = useMemo(() => {
    return state.ideas.filter((idea) => (statusFilter === "all" ? true : idea.status === statusFilter));
  }, [state.ideas, statusFilter]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    actions.addIdea(content, category);
    setContent("");
  }

  function convertToTask(ideaId: string, planType: TaskPlanType) {
    actions.convertIdeaToTask(ideaId, planType);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <p className="soft-label">脑内收件箱</p>
        <h2 className="mt-1 text-lg font-semibold">先记下来，再整理</h2>

        <form onSubmit={onSubmit} className="mt-3 space-y-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="快速记录一段想法..."
            className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />

          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as IdeaCategory)}
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
            >
              {Object.entries(categoryMap).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
              记录想法
            </button>
          </div>
        </form>
      </section>

      <section className="card-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title">想法列表</h3>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | IdeaStatus)}
            className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs"
          >
            <option value="all">全部状态</option>
            <option value="unprocessed">未整理</option>
            <option value="archived">已归档</option>
            <option value="converted_task">已转任务</option>
            <option value="converted_knowledge">已转知识库</option>
          </select>
        </div>

        <ul className="mt-3 space-y-3">
          {filteredIdeas.map((idea) => (
            <li key={idea.id} className="rounded-2xl border border-ink/10 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge border-ink/15 bg-paper text-ink/70">{categoryMap[idea.category]}</span>
                <span className="badge border-ink/15 bg-white text-ink/70">{statusMap[idea.status]}</span>
              </div>

              <p className="mt-2 text-sm text-ink/85">{idea.content}</p>
              <p className="mt-2 text-xs text-ink/50">记录于 {idea.createdAt}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {idea.status === "unprocessed" && (
                  <>
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
                      onClick={() => actions.convertIdeaToKnowledge(idea.id, "method_library")}
                      className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs text-ink/75"
                    >
                      转知识库
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.updateIdeaStatus(idea.id, "archived")}
                      className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs text-ink/75"
                    >
                      归档
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>

        {filteredIdeas.length === 0 && <p className="mt-3 text-sm text-ink/60">当前筛选下没有想法记录。</p>}
      </section>
    </div>
  );
}
