"use client";

import { useMemo, useState } from "react";
import { addDays, formatDateLabel, getMonthGrid, getWeekDates, isSameMonth, todayKey } from "@/lib/date";
import { CalendarDaySummary, CalendarViewMode } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function daySummaryMap(state: ReturnType<typeof useAppStore>["state"]): Map<string, CalendarDaySummary> {
  const map = new Map<string, CalendarDaySummary>();

  const ensure = (date: string) => {
    if (!map.has(date)) {
      map.set(date, {
        date,
        goalSessionCount: 0,
        taskCount: 0,
        dense: false,
        hasDeadline: false,
        urgentDeadlineGoalTitles: [],
      });
    }
    return map.get(date)!;
  };

  state.goalSessions.forEach((session) => {
    const summary = ensure(session.date);
    summary.goalSessionCount += 1;
  });

  state.tasks.forEach((task) => {
    const summary = ensure(task.dueDate);
    summary.taskCount += 1;
  });

  state.goals.forEach((goal) => {
    const summary = ensure(goal.deadline);
    summary.hasDeadline = true;
    summary.urgentDeadlineGoalTitles.push(goal.title);
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

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const summary = useMemo(() => daySummaryMap(state), [state]);
  const monthGrid = useMemo(() => getMonthGrid(baseDate), [baseDate]);
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  const daySessions = useMemo(
    () =>
      state.goalSessions
        .filter((session) => session.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [selectedDate, state.goalSessions],
  );

  const goalsById = useMemo(() => new Map(state.goals.map((goal) => [goal.id, goal])), [state.goals]);

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
            <button
              type="button"
              onClick={() => setBaseDate((prev) => (viewMode === "month" ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1) : addDays(prev, -7)))}
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs"
            >
              上一段
            </button>
            <button
              type="button"
              onClick={() => setBaseDate(new Date())}
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs"
            >
              回到今天
            </button>
            <button
              type="button"
              onClick={() => setBaseDate((prev) => (viewMode === "month" ? new Date(prev.getFullYear(), prev.getMonth() + 1, 1) : addDays(prev, 7)))}
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs"
            >
              下一段
            </button>
          </div>
        </div>

        <div className="mt-3 inline-flex rounded-full bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={`rounded-full px-3 py-1 text-sm ${viewMode === "month" ? "bg-ink text-white" : "text-ink/70"}`}
          >
            月视图
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`rounded-full px-3 py-1 text-sm ${viewMode === "week" ? "bg-ink text-white" : "text-ink/70"}`}
          >
            周视图
          </button>
        </div>
      </section>

      {viewMode === "month" ? (
        <section className="card-surface p-3 md:p-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-ink/60">
            {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((label) => (
              <div key={label} className="font-semibold">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {monthGrid.map((date) => {
              const item = summary.get(date);
              const inMonth = isSameMonth(date, baseDate);
              const isToday = date === todayKey();
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-xl border p-2 text-left transition ${
                    selectedDate === date ? "border-ink bg-ink/5" : "border-ink/10 bg-white"
                  } ${inMonth ? "opacity-100" : "opacity-35"}`}
                >
                  <p className={`text-xs font-medium ${isToday ? "text-sunset" : "text-ink/70"}`}>{date.slice(-2)}</p>
                  <p className="mt-1 text-[11px] text-ink/70">目标 {item?.goalSessionCount ?? 0}</p>
                  <p className="text-[11px] text-ink/60">任务 {item?.taskCount ?? 0}</p>
                  {item?.hasDeadline && <p className="mt-1 text-[10px] text-red-600">截止日</p>}
                  {item?.dense && <p className="text-[10px] text-sunset">任务密集</p>}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {weekDates.map((date) => {
            const sessions = state.goalSessions
              .filter((session) => session.date === date)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const tasks = state.tasks.filter((task) => task.dueDate === date);

            return (
              <article key={date} className="card-surface p-3">
                <button type="button" className="w-full text-left" onClick={() => setSelectedDate(date)}>
                  <p className="text-xs text-ink/60">{formatDateLabel(date)}</p>
                </button>

                <div className="mt-2 space-y-2">
                  {sessions.map((session, index) => (
                    <div key={session.id} className={`rounded-lg p-2 text-xs text-ink ${sessionColor(index)}`}>
                      <p className="font-medium">{session.startTime} {session.title}</p>
                      <p className="text-[11px] text-ink/70">目标：{goalsById.get(session.goalId)?.title}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[11px] text-ink/60">任务 {tasks.length} 条</p>
                {/* TODO: future drag-and-drop reschedule entry */}
              </article>
            );
          })}
        </section>
      )}

      <section className="card-surface p-4">
        <h4 className="section-title">{formatDateLabel(selectedDate)} 的全部安排</h4>
        <ul className="mt-3 space-y-2">
          {daySessions.map((session) => (
            <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-3 text-sm">
              <p className="font-medium text-ink">{session.title}</p>
              <p className="text-xs text-ink/60">
                {session.startTime} - {session.endTime} · {goalsById.get(session.goalId)?.title}
              </p>
            </li>
          ))}
        </ul>

        {daySessions.length === 0 && <p className="mt-2 text-sm text-ink/60">该日暂无目标 session，可在目标详情页一键生成。</p>}
      </section>
    </div>
  );
}
