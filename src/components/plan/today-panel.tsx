"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildGoalDeadlineReminderEvents,
  downloadIcsFile,
  exportToICS,
  mapGoalSessionsToCalendarEvents,
  mapTasksToCalendarEvents,
} from "@/lib/calendar-sync";
import { diffInDays, fromDateKey, todayKey } from "@/lib/date";
import { Task, TaskPlanType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const HOUR_START = 6;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_MIN = 1.6;
const QUICK_DURATION_OPTIONS = [30, 60, 90, 120] as const;

type TodaySubTab = "three_things" | "full_schedule";

function toMinuteOfDay(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
const timeToMinutes = toMinuteOfDay;

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function snapToFive(mins: number): number {
  return Math.round(mins / 5) * 5;
}

function taskDuration(task: Task): number {
  if (task.durationMinutes && task.durationMinutes > 0) return task.durationMinutes;
  if (task.startTime && task.endTime) return Math.max(15, toMinuteOfDay(task.endTime) - toMinuteOfDay(task.startTime));
  return 60;
}

const PLAN_COLOR: Record<TaskPlanType, string> = {
  today_top: "bg-mint/80 border-mint text-ink",
  today_secondary: "bg-sky/60 border-sky text-ink",
  today_other: "bg-ink/10 border-ink/20 text-ink",
  weekly: "bg-ink/10 border-ink/20 text-ink",
};

interface TodayTimelineProps {
  tasks: Task[];
  onSlotClick: (startTime: string) => void;
  onTaskClick: (task: Task) => void;
}

function TodayTimeline({ tasks, onSlotClick, onTaskClick }: TodayTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalHeight = TOTAL_HOURS * 60 * PX_PER_MIN;
  const scheduledTasks = useMemo(() => tasks.filter((t) => t.isScheduled && t.startTime), [tasks]);

  const [nowMins, setNowMins] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setNowMins(d.getHours() * 60 + d.getMinutes()); }, 60000);
    return () => clearInterval(id);
  }, []);
  const nowTop = (nowMins - HOUR_START * 60) * PX_PER_MIN;
  const showNow = nowMins >= HOUR_START * 60 && nowMins <= HOUR_END * 60;

  useEffect(() => {
    if (!showNow || !containerRef.current) return;
    const scrollTo = Math.max(0, nowTop - 80);
    containerRef.current.scrollTop = scrollTo;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-task-block]")) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const y = e.clientY - rect.top + containerRef.current!.scrollTop;
    const mins = snapToFive(Math.floor(y / PX_PER_MIN) + HOUR_START * 60);
    onSlotClick(minutesToTime(Math.max(HOUR_START * 60, Math.min(HOUR_END * 60 - 30, mins))));
  }

  return (
    <div ref={containerRef} className="relative overflow-y-auto rounded-2xl border border-ink/10 bg-white" style={{ height: 340 }}>
      <div className="relative cursor-pointer select-none" style={{ height: totalHeight }} onClick={handleTrackClick}>
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
          <div key={i} className="pointer-events-none absolute left-0 right-0" style={{ top: i * 60 * PX_PER_MIN }}>
            <div className="flex items-center gap-1 pl-1">
              <span className="w-8 shrink-0 text-right text-[10px] leading-none text-ink/35">{String(HOUR_START + i).padStart(2, "0")}:00</span>
              <div className="flex-1 border-t border-ink/10" />
            </div>
          </div>
        ))}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
          <div key={`h${i}`} className="pointer-events-none absolute left-9 right-0" style={{ top: (i * 60 + 30) * PX_PER_MIN }}>
            <div className="border-t border-dashed border-ink/6" />
          </div>
        ))}
        {showNow && (
          <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top: nowTop }}>
            <div className="ml-9 h-0.5 flex-1 bg-red-400/70" />
            <span className="mr-1 text-[9px] text-red-400">NOW</span>
          </div>
        )}
        {scheduledTasks.map((task) => {
          const top = (timeToMinutes(task.startTime!) - HOUR_START * 60) * PX_PER_MIN;
          const dur = taskDuration(task);
          const height = Math.max(dur * PX_PER_MIN, 22);
          return (
            <div
              key={task.id}
              data-task-block
              onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
              className={`absolute left-10 right-2 cursor-pointer rounded-lg border px-2 py-0.5 text-xs font-medium shadow-sm transition hover:brightness-95 ${PLAN_COLOR[task.planType] ?? PLAN_COLOR.today_other} ${task.completed ? "opacity-40 line-through" : ""}`}
              style={{ top, height, overflow: "hidden" }}
            >
              <span className="block truncate">{task.title}</span>
              {height > 30 && <span className="block text-[10px] opacity-70">{task.startTime} – {task.endTime ?? minutesToTime(timeToMinutes(task.startTime!) + dur)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onSchedule: (task: Task) => void;
}

function TaskList({ tasks, onToggle, onReorder, onSchedule }: TaskListProps) {
  return (
    <ul className="mt-3 space-y-2">
      {tasks.map((task, index) => (
        <li key={task.id} className="rounded-xl border border-ink/10 bg-white px-3 py-2">
          <div className="flex items-start gap-2">
            <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} className="mt-0.5 h-4 w-4 accent-mint" />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${task.completed ? "text-ink/50 line-through" : "text-ink"}`}>{task.title}</p>
              <button
                type="button"
                onClick={() => onSchedule(task)}
                className={`mt-0.5 text-[11px] ${task.isScheduled && task.startTime ? "text-mint" : "text-ink/45 hover:text-ink/70"}`}
              >
                {task.isScheduled && task.startTime
                  ? `${task.startTime}${task.endTime ? ` – ${task.endTime}` : ""} · 点击修改`
                  : "点击排时间"}
              </button>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => onReorder(task.id, "up")} disabled={index === 0} className="rounded border border-ink/15 px-2 text-xs text-ink/70 disabled:opacity-30">↑</button>
              <button type="button" onClick={() => onReorder(task.id, "down")} disabled={index === tasks.length - 1} className="rounded border border-ink/15 px-2 text-xs text-ink/70 disabled:opacity-30">↓</button>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2 pl-6 text-[11px]">
            <Link href={`/?home=focus&taskId=${task.id}`} className="rounded-full border border-ink/15 bg-white px-2 py-0.5 text-ink/60">去专注</Link>
            <Link href={`/knowledge/items?taskId=${task.id}`} className="rounded-full border border-ink/15 bg-white px-2 py-0.5 text-ink/60">关联资料</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface PrioritizedGroupProps {
  title: string;
  subtitle: string;
  tone: "high" | "mid";
  tasks: Task[];
  onToggle: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onSchedule: (task: Task) => void;
}

function PrioritizedGroup({ title, subtitle, tone, tasks, onToggle, onReorder, onSchedule }: PrioritizedGroupProps) {
  return (
    <article className={tone === "high" ? "rounded-2xl border border-mint/55 bg-mint/20 p-3" : "rounded-2xl border border-sky/35 bg-sky/10 p-3"}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        <span className={tone === "high" ? "badge border-mint/50 bg-white text-ink" : "badge border-sky/45 bg-white text-ink/80"}>{subtitle}</span>
      </div>
      <TaskList tasks={tasks} onToggle={onToggle} onReorder={onReorder} onSchedule={onSchedule} />
      {tasks.length === 0 && <p className="mt-2 text-xs text-ink/60">暂未添加</p>}
    </article>
  );
}

// Bottom sheet for schedule editing (shared between timeline click and list click)
interface ScheduleSheetProps {
  sheet: { mode: "new"; startTime: string } | { mode: "edit"; task: Task } | null;
  onClose: () => void;
  onNewSubmit: (e: FormEvent) => void;
  onEditSubmit: (e: FormEvent) => void;
  onClear: () => void;
  newTitle: string; setNewTitle: (v: string) => void;
  newPlanType: TaskPlanType; setNewPlanType: (v: TaskPlanType) => void;
  newDuration: number; setNewDuration: (v: number) => void;
  editStart: string; setEditStart: (v: string) => void;
  editDuration: number; setEditDuration: (v: number) => void;
}

function ScheduleSheet({ sheet, onClose, onNewSubmit, onEditSubmit, onClear, newTitle, setNewTitle, newPlanType, setNewPlanType, newDuration, setNewDuration, editStart, setEditStart, editDuration, setEditDuration }: ScheduleSheetProps) {
  if (!sheet) return null;
  const title = sheet.mode === "new" ? `新建任务 · ${sheet.startTime}` : `编辑时间 · ${sheet.task.title}`;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" aria-label="关闭" onClick={onClose} className="absolute inset-0 bg-black/35" />
      <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-ink">{title}</h4>
          <button type="button" onClick={onClose} className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70">关闭</button>
        </div>
        {sheet.mode === "new" && (
          <form onSubmit={onNewSubmit} className="space-y-3">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="任务名称" autoFocus className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={newPlanType} onChange={(e) => setNewPlanType(e.target.value as TaskPlanType)} className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm">
                <option value="today_top">最重要</option>
                <option value="today_secondary">次重要</option>
                <option value="today_other">其他待办</option>
              </select>
              <div className="flex items-center gap-1">
                <input type="number" min={15} step={5} value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value) || 45)} className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm" />
                <span className="shrink-0 text-xs text-ink/50">分钟</span>
              </div>
            </div>
            <p className="text-center text-xs text-ink/50">{sheet.startTime} – {minutesToTime(toMinuteOfDay(sheet.startTime) + newDuration)}</p>
            <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">添加并安排</button>
          </form>
        )}
        {sheet.mode === "edit" && (
          <form onSubmit={onEditSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-ink/60">开始时间<input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm" /></label>
              <label className="text-xs text-ink/60">时长（分钟）<input type="number" min={15} step={5} value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value) || 45)} className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm" /></label>
            </div>
            <p className="text-center text-xs text-ink/50">{editStart} – {minutesToTime(toMinuteOfDay(editStart) + editDuration)}（{editDuration} 分钟）</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">确认</button>
              <button type="button" onClick={onClear} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">清除时间</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export function TodayPanel() {
  const { state, actions } = useAppStore();
  const today = todayKey();

  const [subTab, setSubTab] = useState<TodaySubTab>("three_things");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showOtherTodos, setShowOtherTodos] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<TaskPlanType>("today_other");
  const [newDuration, setNewDuration] = useState(60);
  const quickAddCardRef = useRef<HTMLDivElement | null>(null);

  // unified schedule sheet
  const [scheduleSheet, setScheduleSheet] = useState<
    | { mode: "new"; startTime: string }
    | { mode: "edit"; task: Task }
    | null
  >(null);
  const [sheetNewTitle, setSheetNewTitle] = useState("");
  const [sheetNewPlanType, setSheetNewPlanType] = useState<TaskPlanType>("today_other");
  const [sheetNewDuration, setSheetNewDuration] = useState(45);
  const [sheetEditStart, setSheetEditStart] = useState("09:00");
  const [sheetEditDuration, setSheetEditDuration] = useState(45);

  const [syncHint, setSyncHint] = useState("");
  const syncHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showSyncHint(msg: string) {
    setSyncHint(msg);
    if (syncHintTimer.current) clearTimeout(syncHintTimer.current);
    syncHintTimer.current = setTimeout(() => setSyncHint(""), 4000);
  }

  const todayTasks = useMemo(
    () => state.tasks.filter((task) => task.dueDate === today && task.planType !== "weekly").sort((a, b) => a.order - b.order),
    [state.tasks, today],
  );

  const topTasks = useMemo(() => todayTasks.filter((task) => task.planType === "today_top"), [todayTasks]);
  const secondaryTasks = useMemo(() => todayTasks.filter((task) => task.planType === "today_secondary"), [todayTasks]);
  const otherTasks = useMemo(() => todayTasks.filter((task) => task.planType === "today_other"), [todayTasks]);

  const scheduledTasks = useMemo(
    () => todayTasks.filter((task) => task.isScheduled && task.startTime && task.endTime),
    [todayTasks],
  );

  const todayGoalSessions = useMemo(
    () => state.goalSessions.filter((session) => session.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [state.goalSessions, today],
  );

  const scheduledGoalIds = useMemo(() => new Set(todayGoalSessions.map((session) => session.goalId)), [todayGoalSessions]);

  const urgentGoals = useMemo(
    () =>
      state.goals
        .filter((goal) => goal.status !== "completed")
        .map((goal) => ({
          ...goal,
          daysLeft: diffInDays(fromDateKey(today), fromDateKey(goal.deadline)),
        }))
        .filter((goal) => goal.daysLeft >= 0 && goal.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [state.goals, today],
  );

  const unscheduledUrgentGoals = useMemo(
    () => urgentGoals.filter((goal) => !scheduledGoalIds.has(goal.id)),
    [scheduledGoalIds, urgentGoals],
  );

  const doneCount = todayTasks.filter((task) => task.completed).length;
  const goalTitleById = useMemo(() => new Map(state.goals.map((goal) => [goal.id, goal.title])), [state.goals]);

  const ensureQuickAddVisible = useCallback(() => {
    window.setTimeout(() => {
      quickAddCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

  useEffect(() => {
    if (showQuickAdd) {
      ensureQuickAddVisible();
    }
  }, [ensureQuickAddVisible, showQuickAdd]);

  function submitTask(event: FormEvent) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    actions.addTask(newTitle, newType, { durationMinutes: newDuration });
    setNewTitle("");
    setNewDuration(60);
    setShowQuickAdd(false);
  }

  function openScheduleSheet(task: Task) {
    setSheetEditStart(task.startTime ?? "09:00");
    setSheetEditDuration(taskDuration(task));
    setScheduleSheet({ mode: "edit", task });
  }

  function handleSlotClick(startTime: string) {
    setSheetNewTitle("");
    setSheetNewPlanType("today_other");
    setSheetNewDuration(45);
    setScheduleSheet({ mode: "new", startTime });
  }

  function submitNewFromSheet(e: FormEvent) {
    e.preventDefault();
    const clean = sheetNewTitle.trim();
    if (!clean || scheduleSheet?.mode !== "new") return;
    actions.addTask(clean, sheetNewPlanType, { startTime: scheduleSheet.startTime, durationMinutes: sheetNewDuration });
    setScheduleSheet(null);
    showSyncHint(`已添加并安排在 ${scheduleSheet.startTime}。`);
  }

  function submitEditFromSheet(e: FormEvent) {
    e.preventDefault();
    if (scheduleSheet?.mode !== "edit") return;
    actions.setTaskSchedule(scheduleSheet.task.id, sheetEditStart, undefined, sheetEditDuration);
    setScheduleSheet(null);
    showSyncHint(`已更新时间：${sheetEditStart}，${sheetEditDuration} 分钟。`);
  }

  function clearScheduleFromSheet() {
    if (scheduleSheet?.mode !== "edit") return;
    actions.clearTaskSchedule(scheduleSheet.task.id);
    setScheduleSheet(null);
    showSyncHint("已清除时间安排。");
  }

  function exportTodayTasksToCalendar() {
    const events = mapTasksToCalendarEvents(scheduledTasks);
    if (events.length === 0) {
      showSyncHint("今天还没有已安排时间的任务，先给任务设定时间再导出。");
      return;
    }

    const ics = exportToICS(events, "Today Tasks");
    downloadIcsFile(`today-tasks-${today}.ics`, ics);
    actions.markTasksSyncedToCalendar(
      events
        .map((eventItem) => eventItem.sourceId)
        .filter((id, index, array) => array.indexOf(id) === index),
      true,
    );
    showSyncHint(`已导出 ${events.length} 条今日任务到 .ics，可导入 Apple/Google/Outlook 日历。`);
  }

  function exportAllScheduledToCalendar() {
    const taskEvents = mapTasksToCalendarEvents(state.tasks);
    const sessionEvents = mapGoalSessionsToCalendarEvents(state.goalSessions, goalTitleById);
    const reminderEvents = buildGoalDeadlineReminderEvents(state.goals);
    const allEvents = [...taskEvents, ...sessionEvents, ...reminderEvents];

    if (allEvents.length === 0) {
      showSyncHint("没有可导出的安排。请先创建任务或目标时段。");
      return;
    }

    const ics = exportToICS(allEvents, "Goal Driven Planner");
    downloadIcsFile(`goal-driven-all-${today}.ics`, ics);
    actions.markTasksSyncedToCalendar(
      taskEvents
        .map((eventItem) => eventItem.sourceId)
        .filter((id, index, array) => array.indexOf(id) === index),
      true,
    );
    actions.markGoalSessionsSyncedToCalendar(
      sessionEvents
        .map((eventItem) => eventItem.sourceId)
        .filter((id, index, array) => array.indexOf(id) === index),
      true,
    );
    showSyncHint(`已导出全部安排，共 ${allEvents.length} 条事件。`);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setSubTab("three_things")}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              subTab === "three_things" ? "bg-ink text-white" : "bg-white text-ink/70"
            }`}
          >
            三件事原则
          </button>
          <button
            type="button"
            onClick={() => setSubTab("full_schedule")}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              subTab === "full_schedule" ? "bg-ink text-white" : "bg-white text-ink/70"
            }`}
          >
            整日日程规划
          </button>
        </div>
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title">{subTab === "three_things" ? "今日任务（三件事原则）" : "日程安排"}</h3>
          {subTab === "three_things" ? (
            <span className="badge border-mint/50 bg-mint/20 text-ink">
              完成 {doneCount}/{todayTasks.length}
            </span>
          ) : (
            <span className="text-xs text-ink/55">
              完成 {doneCount}/{todayTasks.length}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-ink/70">
          {subTab === "three_things" ? "先抓住最重要的一件，再推进次重要事项。" : "先安排，再看时间轴。"}
        </p>

        {subTab === "three_things" && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="badge border-ink/15 bg-white text-ink/70">已安排目标时段 {todayGoalSessions.length} 条</span>
            <span className="badge border-ink/15 bg-white text-ink/70">临近截止未安排 {unscheduledUrgentGoals.length} 个</span>
            {unscheduledUrgentGoals.length > 0 && (
              <span className="text-red-700">
                提醒：{unscheduledUrgentGoals[0].title} 还剩 {unscheduledUrgentGoals[0].daysLeft} 天
              </span>
            )}
          </div>
        )}

        {subTab === "three_things" && (
          <>
            <section ref={quickAddCardRef} className="mt-3 rounded-2xl border border-ink/12 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-ink">快速新增任务</h4>
                  <p className="mt-0.5 text-[11px] text-ink/60">任务名称 · 分类选择 · 预计时长</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd((prev) => !prev)}
                  className="rounded-lg border border-ink/15 bg-paper px-2.5 py-1.5 text-xs text-ink/70"
                >
                  {showQuickAdd ? "收起" : "展开"}
                </button>
              </div>

              {showQuickAdd ? (
                <form className="mt-3 space-y-3" onSubmit={submitTask}>
                  <label className="block text-xs font-medium text-ink/70">
                    任务名称
                    <input
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      onFocus={ensureQuickAddVisible}
                      placeholder="例如：完成英语阅读 1 篇"
                      className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none ring-mint/50 focus:ring"
                    />
                  </label>

                  <label className="block text-xs font-medium text-ink/70">
                    分类选择
                    <select
                      value={newType}
                      onChange={(event) => setNewType(event.target.value as TaskPlanType)}
                      onFocus={ensureQuickAddVisible}
                      className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none ring-mint/50 focus:ring"
                    >
                      <option value="today_top">今日最重要 1 件</option>
                      <option value="today_secondary">次重要 2 件</option>
                      <option value="today_other">其他待办</option>
                    </select>
                  </label>

                  <fieldset>
                    <legend className="text-xs font-medium text-ink/70">预计时长（分钟）</legend>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {QUICK_DURATION_OPTIONS.map((minutes) => {
                        const selected = newDuration === minutes;
                        return (
                          <button
                            key={minutes}
                            type="button"
                            onClick={() => setNewDuration(minutes)}
                            className={`rounded-xl border px-2 py-2 text-sm transition ${
                              selected ? "border-mint bg-mint/15 text-ink" : "border-ink/15 bg-white text-ink/70"
                            }`}
                          >
                            {minutes}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <button
                    type="submit"
                    onFocus={ensureQuickAddVisible}
                    className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white"
                  >
                    添加任务
                  </button>
                </form>
              ) : (
                <p className="mt-2 text-xs text-ink/60">点击右上角“展开”即可快速添加一条任务。</p>
              )}
            </section>
          </>
        )}
      </section>

      {subTab === "three_things" && (
        <div className="space-y-3">
          <PrioritizedGroup
            title="今日最重要 1 件"
            subtitle="必须完成"
            tone="high"
            tasks={topTasks}
            onToggle={actions.toggleTask}
            onReorder={actions.reorderTask}
            onSchedule={openScheduleSheet}
          />

          <PrioritizedGroup
            title="次重要 2 件"
            subtitle="优先推进"
            tone="mid"
            tasks={secondaryTasks}
            onToggle={actions.toggleTask}
            onReorder={actions.reorderTask}
            onSchedule={openScheduleSheet}
          />

          {otherTasks.length === 0 ? (
            <section className="rounded-2xl border border-ink/10 bg-white p-3">
              <h4 className="text-sm font-semibold text-ink">其他待办</h4>
              <p className="mt-1 text-xs text-ink/55">暂无其他待办。</p>
            </section>
          ) : (
            <section className="rounded-2xl border border-ink/10 bg-white p-3">
              <button
                type="button"
                onClick={() => setShowOtherTodos((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
              >
                <h4 className="text-sm font-semibold text-ink">其他待办</h4>
                <span className="text-xs text-ink/60">{showOtherTodos ? "收起" : `展开（${otherTasks.length}）`}</span>
              </button>

              {showOtherTodos && (
                <TaskList
                  tasks={otherTasks}
                  onToggle={actions.toggleTask}
                  onReorder={actions.reorderTask}
                  onSchedule={openScheduleSheet}
                />
              )}
            </section>
          )}
        </div>
      )}

      {subTab === "full_schedule" && (
        <div className="space-y-3">
          <section className="card-surface p-4">
            <h4 className="text-sm font-semibold text-ink">今日时间轴</h4>
            <p className="mt-1 text-xs text-ink/50">点击空白处新建任务 · 点击任务块编辑时间</p>
            <div className="mt-3">
              <TodayTimeline tasks={todayTasks} onSlotClick={handleSlotClick} onTaskClick={openScheduleSheet} />
            </div>
          </section>

          <section className="card-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-ink">导出日历</h4>
              <span className="text-xs text-ink/50">完成 {doneCount}/{todayTasks.length}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={exportTodayTasksToCalendar} className="rounded-xl bg-sky px-4 py-2 text-sm font-medium text-ink">
                同步今日任务 (.ics)
              </button>
              <button
                type="button"
                onClick={exportAllScheduledToCalendar}
                className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink/80"
              >
                导出全部安排
              </button>
            </div>
            {syncHint && <p className="mt-2 text-xs text-ink/65">{syncHint}</p>}
          </section>
        </div>
      )}

      <ScheduleSheet
        sheet={scheduleSheet}
        onClose={() => setScheduleSheet(null)}
        onNewSubmit={submitNewFromSheet}
        onEditSubmit={submitEditFromSheet}
        onClear={clearScheduleFromSheet}
        newTitle={sheetNewTitle} setNewTitle={setSheetNewTitle}
        newPlanType={sheetNewPlanType} setNewPlanType={setSheetNewPlanType}
        newDuration={sheetNewDuration} setNewDuration={setSheetNewDuration}
        editStart={sheetEditStart} setEditStart={setSheetEditStart}
        editDuration={sheetEditDuration} setEditDuration={setSheetEditDuration}
      />
    </div>
  );
}
