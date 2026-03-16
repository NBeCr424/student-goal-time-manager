"use client";

import { FormEvent, useMemo, useState } from "react";
import { todayKey } from "@/lib/date";
import { Task, TaskPlanType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const GROUPS: Array<{ title: string; planType: TaskPlanType; subtitle: string }> = [
  { title: "今天最重要 1 件", planType: "today_top", subtitle: "必须完成" },
  { title: "次重要 2 件", planType: "today_secondary", subtitle: "优先推进" },
  { title: "其他待办", planType: "today_other", subtitle: "加分项" },
];

function TaskGroup({ title, subtitle, tasks, onToggle, onReorder }: { title: string; subtitle: string; tasks: Task[]; onToggle: (id: string) => void; onReorder: (id: string, direction: "up" | "down") => void }) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        <span className="text-xs text-ink/60">{subtitle}</span>
      </div>

      <ul className="mt-3 space-y-2">
        {tasks.map((task, index) => (
          <li key={task.id} className="rounded-xl border border-ink/10 px-2 py-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
                className="h-4 w-4 accent-mint"
              />
              <p className={`flex-1 text-sm ${task.completed ? "text-ink/50 line-through" : "text-ink"}`}>{task.title}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onReorder(task.id, "up")}
                  disabled={index === 0}
                  className="rounded border border-ink/15 px-2 text-xs text-ink/70 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onReorder(task.id, "down")}
                  disabled={index === tasks.length - 1}
                  className="rounded border border-ink/15 px-2 text-xs text-ink/70 disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && <p className="mt-2 text-xs text-ink/55">暂无任务</p>}
      <p className="mt-3 text-[11px] text-ink/50">已预留拖动排序扩展位（MVP 先用上下按钮）。</p>
    </article>
  );
}

export function TodayPanel() {
  const { state, actions } = useAppStore();
  const today = todayKey();

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<TaskPlanType>("today_other");

  const todayTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.dueDate === today && task.planType !== "weekly")
        .sort((a, b) => a.order - b.order),
    [state.tasks, today],
  );

  const doneCount = todayTasks.filter((task) => task.completed).length;

  function submitTask(event: FormEvent) {
    event.preventDefault();
    actions.addTask(newTitle, newType);
    setNewTitle("");
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <div className="flex items-center justify-between">
          <h3 className="section-title">今日任务（三件事法则）</h3>
          <span className="badge border-mint/50 bg-mint/20 text-ink">完成 {doneCount}/{todayTasks.length}</span>
        </div>

        <form className="mt-3 grid gap-2 md:grid-cols-[1fr_170px_110px]" onSubmit={submitTask}>
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="新增今日任务"
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />

          <select
            value={newType}
            onChange={(event) => setNewType(event.target.value as TaskPlanType)}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="today_top">最重要 1 件</option>
            <option value="today_secondary">次重要 2 件</option>
            <option value="today_other">其他待办</option>
          </select>

          <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            添加
          </button>
        </form>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <TaskGroup
            key={group.planType}
            title={group.title}
            subtitle={group.subtitle}
            tasks={todayTasks.filter((task) => task.planType === group.planType)}
            onToggle={actions.toggleTask}
            onReorder={actions.reorderTask}
          />
        ))}
      </section>
    </div>
  );
}
