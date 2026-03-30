"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  diffInDays,
  formatDateLabel,
  fromDateKey,
  getMonthGrid,
  getWeekDates,
  isSameMonth,
  todayKey,
} from "@/lib/date";
import { getGoalScheduleStats } from "@/lib/scheduler";
import { CalendarDaySummary, CalendarViewMode } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type DeadlineRiskLevel = "none" | "watch" | "warning" | "critical";

interface EnhancedDaySummary extends CalendarDaySummary {
  deadlineRiskLevel: DeadlineRiskLevel;
  deadlineGoalIds: string[];
  deadlineCount: number;
  sessionMinutes: number;
}

const riskLevelOrder: Record<DeadlineRiskLevel, number> = {
  none: 0,
  watch: 1,
  warning: 2,
  critical: 3,
};

const riskLabel: Record<DeadlineRiskLevel, string> = {
  none: "安全",
  watch: "D-7 关注",
  warning: "D-3 警惕",
  critical: "D-1 紧急",
};

const riskTone: Record<DeadlineRiskLevel, string> = {
  none: "border-ink/15 bg-white text-ink/65",
  watch: "border-amber-300 bg-amber-50 text-amber-700",
  warning: "border-orange-300 bg-orange-50 text-orange-700",
  critical: "border-red-300 bg-red-50 text-red-700",
};

function riskByDaysLeft(daysLeft: number): DeadlineRiskLevel {
  if (daysLeft <= 1) {
    return "critical";
  }
  if (daysLeft <= 3) {
    return "warning";
  }
  if (daysLeft <= 7) {
    return "watch";
  }
  return "none";
}

function maxRisk(a: DeadlineRiskLevel, b: DeadlineRiskLevel): DeadlineRiskLevel {
  return riskLevelOrder[a] >= riskLevelOrder[b] ? a : b;
}

function daySummaryMap(
  state: ReturnType<typeof useAppStore>["state"],
  today: string,
): Map<string, EnhancedDaySummary> {
  const map = new Map<string, EnhancedDaySummary>();

  const ensure = (date: string) => {
    if (!map.has(date)) {
      map.set(date, {
        date,
        goalSessionCount: 0,
        taskCount: 0,
        dense: false,
        hasDeadline: false,
        urgentDeadlineGoalTitles: [],
        deadlineRiskLevel: "none",
        deadlineGoalIds: [],
        deadlineCount: 0,
        sessionMinutes: 0,
      });
    }
    return map.get(date)!;
  };

  state.goalSessions.forEach((session) => {
    const summary = ensure(session.date);
    summary.goalSessionCount += 1;
    summary.sessionMinutes += session.durationMinutes;
  });

  state.tasks.forEach((task) => {
    const summary = ensure(task.dueDate);
    summary.taskCount += 1;
  });

  const todayDate = fromDateKey(today);
  state.goals.forEach((goal) => {
    const summary = ensure(goal.deadline);
    summary.hasDeadline = true;
    summary.deadlineCount += 1;
    summary.deadlineGoalIds.push(goal.id);
    summary.urgentDeadlineGoalTitles.push(goal.title);

    if (goal.status !== "completed") {
      const daysLeft = diffInDays(todayDate, fromDateKey(goal.deadline));
      summary.deadlineRiskLevel = maxRisk(summary.deadlineRiskLevel, riskByDaysLeft(daysLeft));
    }
  });

  map.forEach((summary) => {
    summary.dense = summary.goalSessionCount + summary.taskCount >= 4;
  });

  return map;
}

function sessionColor(index: number) {
  const colors = ["bg-sky/30", "bg-mint/30", "bg-sunset/30", "bg-sand/60"];
  return colors[index % colors.length];
}

export function CalendarPanel() {
  const { state } = useAppStore();
  const today = todayKey();

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const summary = useMemo(() => daySummaryMap(state, today), [state, today]);
  const monthGrid = useMemo(() => getMonthGrid(baseDate), [baseDate]);
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const goalsById = useMemo(() => new Map(state.goals.map((goal) => [goal.id, goal])), [state.goals]);

  const daySessions = useMemo(
    () =>
      state.goalSessions
        .filter((session) => session.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [selectedDate, state.goalSessions],
  );

  const dayTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.dueDate === selectedDate)
        .sort((a, b) => `${a.startTime ?? "99:99"} ${a.order}`.localeCompare(`${b.startTime ?? "99:99"} ${b.order}`)),
    [selectedDate, state.tasks],
  );

  const selectedDeadlineGoals = useMemo(
    () => state.goals.filter((goal) => goal.deadline === selectedDate && goal.status !== "completed"),
    [selectedDate, state.goals],
  );

  const selectedGoalFocus = useMemo(() => {
    const minutesMap = new Map<string, number>();
    daySessions.forEach((session) => {
      minutesMap.set(session.goalId, (minutesMap.get(session.goalId) ?? 0) + session.durationMinutes);
    });

    return Array.from(minutesMap.entries())
      .map(([goalId, minutes]) => {
        const goal = goalsById.get(goalId);
        if (!goal) {
          return null;
        }

        const stats = getGoalScheduleStats(goal, state.goalSessions.filter((session) => session.goalId === goalId));
        const todayRatio = Math.min(100, Math.round((minutes / Math.max(1, stats.totalMinutes)) * 100));
        return { goal, minutes, todayRatio, stats };
      })
      .filter(Boolean)
      .sort((a, b) => b!.minutes - a!.minutes) as Array<{
      goal: NonNullable<ReturnType<typeof goalsById.get>>;
      minutes: number;
      todayRatio: number;
      stats: ReturnType<typeof getGoalScheduleStats>;
    }>;
  }, [daySessions, goalsById, state.goalSessions]);

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="soft-label">目标驱动日历</p>
            <h3 className="text-lg font-semibold">
              {baseDate.getFullYear()} 年 {baseDate.getMonth() + 1} 月
            </h3>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setBaseDate((prev) => (viewMode === "month" ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1) : addDays(prev, -7)))} className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs">上一段</button>
            <button type="button" onClick={() => setBaseDate(new Date())} className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs">回到今天</button>
            <button type="button" onClick={() => setBaseDate((prev) => (viewMode === "month" ? new Date(prev.getFullYear(), prev.getMonth() + 1, 1) : addDays(prev, 7)))} className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs">下一段</button>
          </div>
        </div>

        <div className="mt-3 inline-flex rounded-full bg-white p-1">
          <button type="button" onClick={() => setViewMode("month")} className={`rounded-full px-3 py-1 text-sm ${viewMode === "month" ? "bg-ink text-white" : "text-ink/70"}`}>月视图</button>
          <button type="button" onClick={() => setViewMode("week")} className={`rounded-full px-3 py-1 text-sm ${viewMode === "week" ? "bg-ink text-white" : "text-ink/70"}`}>周视图</button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {(["watch", "warning", "critical"] as DeadlineRiskLevel[]).map((level) => (
            <span key={level} className={`rounded-full border px-2 py-0.5 ${riskTone[level]}`}>{riskLabel[level]}</span>
          ))}
        </div>
      </section>

      {viewMode === "month" ? (
        <section className="card-surface p-3 md:p-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-ink/60">{["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((label) => <div key={label} className="font-semibold">{label}</div>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {monthGrid.map((date) => {
              const item = summary.get(date);
              const inMonth = isSameMonth(date, baseDate);
              const isToday = date === today;
              const risk = item?.deadlineRiskLevel ?? "none";
              return (
                <button key={date} type="button" onClick={() => setSelectedDate(date)} className={`rounded-xl border p-2 text-left transition ${selectedDate === date ? "border-ink bg-ink/5" : "border-ink/10 bg-white"} ${inMonth ? "opacity-100" : "opacity-35"}`}>
                  <p className={`text-xs font-medium ${isToday ? "text-sunset" : "text-ink/70"}`}>{date.slice(-2)}</p>
                  <p className="mt-1 text-[11px] text-ink/70">目标 {item?.goalSessionCount ?? 0}</p>
                  <p className="text-[11px] text-ink/60">任务 {item?.taskCount ?? 0}</p>
                  {item?.hasDeadline && <p className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] ${riskTone[risk]}`}>{riskLabel[risk]}</p>}
                  {item?.dense && <p className="text-[10px] text-sunset">任务密集</p>}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {weekDates.map((date) => {
            const sessions = state.goalSessions.filter((session) => session.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
            const tasks = state.tasks.filter((task) => task.dueDate === date);
            const scheduledTasks = tasks.filter((task) => task.isScheduled && task.startTime && task.endTime).sort((a, b) => `${a.startTime} ${a.order}`.localeCompare(`${b.startTime} ${b.order}`));
            const deadlineGoals = state.goals.filter((goal) => goal.deadline === date && goal.status !== "completed");
            return (
              <article key={date} className="card-surface p-3">
                <button type="button" className="w-full text-left" onClick={() => setSelectedDate(date)}>
                  <p className="text-xs text-ink/60">{formatDateLabel(date)}</p>
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  {deadlineGoals.slice(0, 2).map((goal) => {
                    const level = riskByDaysLeft(diffInDays(fromDateKey(today), fromDateKey(goal.deadline)));
                    return <span key={goal.id} className={`rounded-full border px-2 py-0.5 text-[10px] ${riskTone[level]}`}>{riskLabel[level]}</span>;
                  })}
                </div>
                <div className="mt-2 space-y-2">
                  {sessions.map((session, index) => <div key={session.id} className={`rounded-lg p-2 text-xs text-ink ${sessionColor(index)}`}><p className="font-medium">{session.startTime} {session.title}</p><p className="text-[11px] text-ink/70">目标：{goalsById.get(session.goalId)?.title}</p></div>)}
                  {scheduledTasks.map((task) => <div key={task.id} className="rounded-lg border border-ink/10 bg-white p-2 text-xs text-ink"><p className="font-medium">{task.startTime} {task.title}</p><p className="text-[11px] text-ink/65">{task.endTime ? `${task.startTime} - ${task.endTime}` : "已安排"} · {task.syncedToCalendar ? "已同步日历" : "未同步日历"}</p></div>)}
                </div>
                <p className="mt-2 text-[11px] text-ink/60">任务 {tasks.length} 条</p>
              </article>
            );
          })}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card-surface p-4">
          <h4 className="section-title">{formatDateLabel(selectedDate)} 的风险与推进</h4>
          <div className="mt-3 space-y-2">
            {selectedDeadlineGoals.map((goal) => {
              const daysLeft = diffInDays(fromDateKey(today), fromDateKey(goal.deadline));
              const level = riskByDaysLeft(daysLeft);
              return (
                <div key={goal.id} className="rounded-xl border border-ink/10 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{goal.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${riskTone[level]}`}>{riskLabel[level]}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/60">剩余 {daysLeft} 天 · 当前进度 {goal.progress}%</p>
                </div>
              );
            })}
            {selectedDeadlineGoals.length === 0 && <p className="text-sm text-ink/60">该日没有目标截止风险。</p>}
          </div>

          <div className="mt-4 space-y-2">
            {selectedGoalFocus.map(({ goal, minutes, todayRatio, stats }) => (
              <div key={goal.id} className="rounded-xl border border-ink/10 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{goal.title}</p>
                  <p className="text-xs text-ink/60">今日投入 {Math.round((minutes / 60) * 10) / 10}h</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-ink/10"><div className="h-2 rounded-full bg-mint" style={{ width: `${todayRatio}%` }} /></div>
                <p className="mt-1 text-[11px] text-ink/60">总排程 {Math.round((stats.scheduledMinutes / 60) * 10) / 10}h / {(stats.totalMinutes / 60).toFixed(1)}h</p>
              </div>
            ))}
            {selectedGoalFocus.length === 0 && <p className="text-sm text-ink/60">该日还没有目标推进时段。</p>}
          </div>
        </article>

        <article className="card-surface p-4">
          <h4 className="section-title">{formatDateLabel(selectedDate)} 的全部安排</h4>
          <ul className="mt-3 space-y-2">
            {daySessions.map((session) => (
              <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-3 text-sm">
                <p className="font-medium text-ink">{session.title}</p>
                <p className="text-xs text-ink/60">{session.startTime} - {session.endTime} · {goalsById.get(session.goalId)?.title}</p>
              </li>
            ))}
            {dayTasks.map((task) => (
              <li key={task.id} className="rounded-xl border border-ink/10 bg-white p-3 text-sm">
                <p className="font-medium text-ink">{task.title}</p>
                <p className="text-xs text-ink/60">{task.isScheduled && task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : "未设定具体时间"} · {task.planType}</p>
              </li>
            ))}
          </ul>
          {daySessions.length === 0 && dayTasks.length === 0 && <p className="mt-2 text-sm text-ink/60">该日暂无安排，可在今日任务页或目标详情页补充。</p>}
        </article>
      </section>
    </div>
  );
}
