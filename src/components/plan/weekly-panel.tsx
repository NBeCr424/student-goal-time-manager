"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";

export function WeeklyPanel() {
  const { state, actions } = useAppStore();

  const weeklyPlan = useMemo(() => {
    if (state.weeklyPlans.length === 0) {
      return null;
    }
    return [...state.weeklyPlans].sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))[0];
  }, [state.weeklyPlans]);

  const [executionInput, setExecutionInput] = useState("");
  const [checkSummary, setCheckSummary] = useState(weeklyPlan?.checkSummary ?? "");
  const [oneImprovement, setOneImprovement] = useState(weeklyPlan?.nextWeekOneImprovement ?? "");

  if (!weeklyPlan) {
    return <section className="card-surface p-4 text-sm text-ink/70">还没有本周计划数据。</section>;
  }

  const goalTitles = weeklyPlan.weekGoalIds
    .map((id) => state.goals.find((goal) => goal.id === id)?.title)
    .filter((value): value is string => Boolean(value));

  function onAddExecution(event: FormEvent) {
    event.preventDefault();
    actions.addWeeklyExecution(executionInput);
    setExecutionInput("");
  }

  function onSaveReflection(event: FormEvent) {
    event.preventDefault();
    actions.updateWeeklyReflection(checkSummary, oneImprovement);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <p className="soft-label">PDCA 循环</p>
        <h3 className="mt-1 text-lg font-semibold">本周计划（从 {weeklyPlan.weekStartDate} 开始）</h3>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs font-semibold text-ink/60">P - 计划</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink/85">
              {goalTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs font-semibold text-ink/60">D - 执行记录</p>
            <ul className="mt-2 space-y-2 text-sm text-ink/85">
              {weeklyPlan.executionLog.slice(0, 5).map((item) => (
                <li key={item} className="rounded-lg bg-paper px-2 py-1">
                  {item}
                </li>
              ))}
            </ul>

            <form className="mt-3 flex gap-2" onSubmit={onAddExecution}>
              <input
                value={executionInput}
                onChange={(event) => setExecutionInput(event.target.value)}
                placeholder="新增执行记录"
                className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white">
                添加
              </button>
            </form>
          </article>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form className="card-surface p-4" onSubmit={onSaveReflection}>
          <p className="text-xs font-semibold text-ink/60">C - 周检查</p>
          <textarea
            value={checkSummary}
            onChange={(event) => setCheckSummary(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />

          <p className="mt-3 text-xs font-semibold text-ink/60">A - 下周只改一个点</p>
          <textarea
            value={oneImprovement}
            onChange={(event) => setOneImprovement(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />

          <button type="submit" className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存周复盘
          </button>
        </form>

        <article className="card-surface border-2 border-sunset/40 p-4">
          <p className="soft-label">重点提示</p>
          <h4 className="mt-1 text-lg font-semibold text-ink">每周只改一个问题</h4>
          <p className="mt-2 rounded-xl bg-sunset/15 p-3 text-sm text-ink/85">{weeklyPlan.nextWeekOneImprovement}</p>
          <p className="mt-2 text-xs text-ink/65">避免同时改很多习惯，先把一个关键问题稳定下来。</p>
        </article>
      </section>
    </div>
  );
}
