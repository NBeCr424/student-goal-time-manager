"use client";

import Link from "next/link";
import { formatDateLabel } from "@/lib/date";
import { getGoalScheduleStats } from "@/lib/scheduler";
import { useAppStore } from "@/store/app-store";

function toHourText(minutes: number): string {
  return `${(minutes / 60).toFixed(1)} 小时`;
}

export function GoalDetailPage({ goalId }: { goalId: string }) {
  const { state, actions } = useAppStore();

  const goal = state.goals.find((item) => item.id === goalId);

  if (!goal) {
    return (
      <section className="card-surface p-6 text-center">
        <h2 className="text-lg font-semibold">目标不存在</h2>
        <p className="mt-2 text-sm text-ink/70">可能已被删除，或链接失效。</p>
        <Link href="/plan" className="mt-4 inline-flex rounded-xl bg-ink px-4 py-2 text-sm text-white">
          返回计划页
        </Link>
      </section>
    );
  }

  const sessions = state.goalSessions
    .filter((session) => session.goalId === goal.id)
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  const stats = getGoalScheduleStats(goal, sessions);

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <p className="soft-label">目标详情</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">{goal.title}</h2>
        <p className="mt-2 text-sm text-ink/75">{goal.description}</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs text-ink/75">
          <p className="rounded-lg bg-white p-2">截止日期：{goal.deadline}</p>
          <p className="rounded-lg bg-white p-2">预计总时长：{goal.estimatedTotalHours} 小时</p>
          <p className="rounded-lg bg-white p-2">建议单次：{goal.suggestedSessionMinutes} 分钟</p>
          <p className="rounded-lg bg-white p-2">偏好时段：{goal.preferredTimeOfDay}</p>
          <p className="rounded-lg bg-white p-2">已安排：{toHourText(stats.scheduledMinutes)}</p>
          <p className="rounded-lg bg-white p-2">未安排：{toHourText(stats.unscheduledMinutes)}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => actions.regenerateGoalSessions(goal.id)}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white"
          >
            为我安排时间
          </button>
          <Link href="/plan?tab=calendar" className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink/80">
            在日历中查看
          </Link>
        </div>

        <p className="mt-3 rounded-xl border border-sky/40 bg-sky/15 p-3 text-xs text-ink/75">
          黄金时段入口预留：后续可根据你的高效时段自动优先安排高价值任务。
        </p>
      </section>

      <section className="card-surface p-4 md:p-5">
        <h3 className="section-title">执行时间块（Goal Sessions）</h3>
        <ul className="mt-3 space-y-2">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-ink">{session.title}</p>
                <span className="badge border-ink/15 bg-white text-ink/65">{session.status}</span>
              </div>
              <p className="mt-1 text-xs text-ink/70">
                {formatDateLabel(session.date)} · {session.startTime} - {session.endTime} · {session.durationMinutes} 分钟
              </p>
            </li>
          ))}
        </ul>

        {sessions.length === 0 && <p className="mt-2 text-sm text-ink/60">还没有 session，点击“为我安排时间”自动拆分并生成。</p>}
      </section>

      <section className="card-surface p-4 md:p-5">
        <h3 className="section-title">SMART 内容</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80"><strong>S：</strong>{goal.smart.specific || "未填写"}</p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80"><strong>M：</strong>{goal.smart.measurable || "未填写"}</p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80"><strong>A：</strong>{goal.smart.achievable || "未填写"}</p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80"><strong>R：</strong>{goal.smart.relevant || "未填写"}</p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80 md:col-span-2"><strong>T：</strong>{goal.smart.timeBound || "未填写"}</p>
        </div>
      </section>
    </div>
  );
}
