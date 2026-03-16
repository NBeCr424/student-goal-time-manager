"use client";

import { FormEvent, useMemo, useState } from "react";
import { diffInDays, formatFullDate, todayKey } from "@/lib/date";
import { useAppStore } from "@/store/app-store";

const PLAN_ORDER = {
  today_top: 0,
  today_secondary: 1,
  today_other: 2,
  weekly: 3,
};

function priorityBadge(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return "border-red-200 bg-red-50 text-red-600";
  }
  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-sky-200 bg-sky-50 text-sky-700";
}

export function DashboardPage() {
  const { state, actions } = useAppStore();
  const today = todayKey();

  const [wins, setWins] = useState("");
  const [wasted, setWasted] = useState("");
  const [improve, setImprove] = useState("");

  const goalMap = useMemo(() => new Map(state.goals.map((goal) => [goal.id, goal])), [state.goals]);

  const todayTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.dueDate === today && task.planType !== "weekly")
        .sort((a, b) => {
          const p = PLAN_ORDER[a.planType] - PLAN_ORDER[b.planType];
          return p === 0 ? a.order - b.order : p;
        }),
    [state.tasks, today],
  );

  const keyThreeTasks = todayTasks.filter((task) => task.planType === "today_top" || task.planType === "today_secondary");

  const todaySessions = useMemo(
    () =>
      state.goalSessions
        .filter((session) => session.date === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [state.goalSessions, today],
  );

  const urgentGoals = useMemo(() => {
    const todayDate = new Date(`${today}T00:00:00`);

    return state.goals
      .filter((goal) => goal.status !== "completed")
      .map((goal) => ({
        ...goal,
        daysLeft: diffInDays(todayDate, new Date(`${goal.deadline}T00:00:00`)),
      }))
      .filter((goal) => goal.daysLeft >= 0 && goal.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [state.goals, today]);

  const scheduledGoalIdsToday = new Set(todaySessions.map((session) => session.goalId));
  const unscheduledUrgentGoals = urgentGoals.filter((goal) => !scheduledGoalIdsToday.has(goal.id));

  const unprocessedIdeas = state.ideas.filter((idea) => idea.status === "unprocessed").length;
  const importedUnsortedTasks = state.tasks.filter((task) => task.source === "imported" && !task.completed).length;

  const todayReview = state.reviews.find((entry) => entry.date === today);

  function onSubmitReview(event: FormEvent) {
    event.preventDefault();
    actions.addReview(wins, wasted, improve);
    setWins("");
    setWasted("");
    setImprove("");
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <article className="card-surface p-4 md:p-5">
          <p className="soft-label">今天</p>
          <h2 className="mt-1 text-lg font-semibold md:text-2xl">{formatFullDate(today)}</h2>
          <p className="mt-2 text-sm text-ink/70">打开 App 的第一件事：完成今天最重要的三件事。</p>

          <div className="mt-4 rounded-2xl border border-mint/40 bg-mint/15 p-3 text-sm text-ink/80">
            今日轻提醒：已排入日历目标任务 <strong>{todaySessions.length}</strong> 个；
            紧急截止目标 <strong>{urgentGoals.length}</strong> 个。
          </div>

          {unscheduledUrgentGoals.length > 0 && (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              注意：{unscheduledUrgentGoals[0].title} 距截止还有 {unscheduledUrgentGoals[0].daysLeft} 天，但今天还没安排执行时段。
            </div>
          )}
        </article>

        <article className="card-surface p-4 md:p-5">
          <p className="soft-label">天气与穿衣</p>
          <h3 className="mt-1 text-xl font-semibold">
            {state.weather.location} {state.weather.condition} {state.weather.temperatureC}°C
          </h3>
          <p className="mt-2 text-sm text-ink/75">湿度 {state.weather.humidity}%</p>
          <p className="mt-3 rounded-xl bg-white/80 p-2 text-sm text-ink/80">学习建议：{state.weather.suggestion}</p>
          <p className="mt-2 rounded-xl bg-white/80 p-2 text-sm text-ink/80">穿衣建议：{state.weather.outfitTip}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card-surface p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h3 className="section-title">今日三件事</h3>
            <span className="badge border-ink/15 bg-white text-ink/70">
              完成 {keyThreeTasks.filter((task) => task.completed).length}/{keyThreeTasks.length}
            </span>
          </div>

          <ul className="mt-3 space-y-2">
            {keyThreeTasks.map((task) => (
              <li
                key={task.id}
                className={`rounded-xl border p-3 transition ${task.completed ? "border-mint bg-mint/10" : "border-ink/10 bg-white"}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    checked={task.completed}
                    onChange={() => actions.toggleTask(task.id)}
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-ink/20 accent-mint"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.completed ? "line-through text-ink/50" : "text-ink"}`}>{task.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className={`badge ${priorityBadge(task.priority)}`}>{task.priority}</span>
                      {task.goalId && <span className="text-ink/60">目标：{goalMap.get(task.goalId)?.title}</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {keyThreeTasks.length === 0 && <p className="mt-3 text-sm text-ink/60">还没有设置今天关键三件事。</p>}
        </article>

        <article className="card-surface p-4 md:p-5">
          <h3 className="section-title">今日时间安排概览</h3>

          <ul className="mt-3 space-y-2">
            {todaySessions.slice(0, 6).map((session) => (
              <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-sm font-medium text-ink">{session.title}</p>
                <p className="mt-1 text-xs text-ink/65">
                  {session.startTime} - {session.endTime} · {goalMap.get(session.goalId)?.title}
                </p>
              </li>
            ))}
          </ul>

          {todaySessions.length === 0 && <p className="mt-3 text-sm text-ink/60">今天还没有排入目标执行时段。</p>}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card-surface p-4 md:p-5">
          <h3 className="section-title">提醒中心</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li className="rounded-xl bg-white p-3">收件箱待整理想法：{unprocessedIdeas} 条</li>
            <li className="rounded-xl bg-white p-3">新导入待处理任务：{importedUnsortedTasks} 条</li>
            <li className="rounded-xl bg-white p-3">今天可执行任务总数：{todayTasks.length} 条</li>
          </ul>

          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            如果某个目标临近截止但今天没安排时间，优先在计划页补一段 session。
          </div>
        </article>

        <article className="card-surface p-4 md:p-5">
          <h3 className="section-title">晚间复盘入口（每日三问）</h3>
          {todayReview && (
            <div className="mt-2 rounded-xl border border-mint/40 bg-mint/15 p-3 text-xs text-ink/80">
              今日已记录复盘，可重复编辑并保存。
            </div>
          )}

          <form className="mt-3 space-y-2" onSubmit={onSubmitReview}>
            <textarea
              value={wins}
              onChange={(event) => setWins(event.target.value)}
              rows={2}
              placeholder="1. 今天做成了什么？"
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
            />
            <textarea
              value={wasted}
              onChange={(event) => setWasted(event.target.value)}
              rows={2}
              placeholder="2. 哪里浪费时间了？"
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
            />
            <textarea
              value={improve}
              onChange={(event) => setImprove(event.target.value)}
              rows={2}
              placeholder="3. 明天只改一个点"
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
            />
            <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
              保存复盘
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
