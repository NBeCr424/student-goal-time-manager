"use client";

import Link from "next/link";
import { GoalForm } from "@/components/plan/goal-form";
import { diffInDays, fromDateKey, todayKey } from "@/lib/date";
import { getGoalScheduleStats } from "@/lib/scheduler";
import { useAppStore } from "@/store/app-store";

function formatHours(minutes: number) {
  return (minutes / 60).toFixed(1);
}

export function GoalsPanel() {
  const { state, actions } = useAppStore();
  const today = todayKey();
  const todayDate = fromDateKey(today);

  return (
    <div className="space-y-4">
      <GoalForm />

      <section className="grid gap-3 md:grid-cols-2">
        {state.goals.map((goal) => {
          const stats = getGoalScheduleStats(goal, state.goalSessions);
          const daysLeft = diffInDays(todayDate, fromDateKey(goal.deadline));

          return (
            <article key={goal.id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="soft-label">长期目标</p>
                  <h3 className="text-base font-semibold">{goal.title}</h3>
                </div>
                <span className="badge border-ink/20 bg-white text-ink/70">{goal.priority}</span>
              </div>

              <p className="mt-2 text-sm text-ink/75">{goal.description}</p>

              <div className="mt-3 h-2 rounded-full bg-ink/10">
                <div className="h-2 rounded-full bg-mint" style={{ width: `${goal.progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink/60">进度 {goal.progress}%</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink/75">
                <p className="rounded-lg bg-white p-2">截止：{goal.deadline}</p>
                <p className="rounded-lg bg-white p-2">剩余：{daysLeft} 天</p>
                <p className="rounded-lg bg-white p-2">已安排：{formatHours(stats.scheduledMinutes)}h</p>
                <p className="rounded-lg bg-white p-2">未安排：{formatHours(stats.unscheduledMinutes)}h</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => actions.regenerateGoalSessions(goal.id)}
                  className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink/80"
                >
                  为我安排时间
                </button>
                <Link
                  href={`/goals/${goal.id}`}
                  className="rounded-xl bg-ink px-3 py-2 text-center text-xs font-medium text-white"
                >
                  进入目标详情
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
