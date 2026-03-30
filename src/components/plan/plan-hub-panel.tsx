"use client";

import { useMemo } from "react";
import { todayKey } from "@/lib/date";
import { useAppStore } from "@/store/app-store";

type PlanHubTarget = "day" | "weekly" | "goals";

interface PlanHubPanelProps {
  onNavigate: (target: PlanHubTarget) => void;
}

function iconForTarget(target: PlanHubTarget) {
  if (target === "day") {
    return "日";
  }
  if (target === "weekly") {
    return "周";
  }
  return "目";
}

export function PlanHubPanel({ onNavigate }: PlanHubPanelProps) {
  const { state } = useAppStore();
  const today = todayKey();

  const todayTasks = useMemo(
    () => state.tasks.filter((task) => task.dueDate === today && task.planType !== "weekly"),
    [state.tasks, today],
  );

  const keyTasks = todayTasks.filter((task) => task.planType === "today_top" || task.planType === "today_secondary");
  const doneCount = keyTasks.filter((task) => task.completed).length;
  const totalCount = keyTasks.length;

  const topTask =
    keyTasks.find((task) => task.planType === "today_top" && !task.completed) ??
    keyTasks.find((task) => !task.completed) ??
    keyTasks[0];

  const entries: Array<{ id: PlanHubTarget; label: string; description: string }> = [
    { id: "day", label: "日计划", description: "安排今日与明日" },
    { id: "weekly", label: "本周计划", description: "查看周目标与执行" },
    { id: "goals", label: "长期目标", description: "推进长期目标" },
  ];

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <p className="soft-label">今日目标提醒</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">今日三件事进度</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {doneCount}/{totalCount || 3}
            </p>
            <p className="mt-1 text-xs text-ink/60">完成这三件，今天就算成功</p>
          </article>

          <article className="rounded-2xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">当前最重要任务</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium text-ink">{topTask?.title ?? "还没有设置最重要任务"}</p>
            <button
              type="button"
              onClick={() => onNavigate("day")}
              className="mt-3 rounded-xl bg-ink px-3 py-2 text-xs font-medium text-white"
            >
              进入日计划（今日）
            </button>
          </article>
        </div>
      </section>

      <section className="card-surface p-4 md:p-5">
        <p className="soft-label">计划入口</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onNavigate(entry.id)}
              className="rounded-2xl border border-ink/10 bg-white p-3 text-left transition hover:border-ink/20"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint/30 text-base font-semibold text-ink">
                {iconForTarget(entry.id)}
              </span>
              <p className="mt-2 text-sm font-medium text-ink">{entry.label}</p>
              <p className="mt-1 text-[11px] text-ink/60">{entry.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
