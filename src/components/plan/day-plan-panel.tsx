"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { addDays, formatDateLabel, fromDateKey, toDateKey, todayKey } from "@/lib/date";
import { Task, TaskPlanType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { TodayPanel } from "@/components/plan/today-panel";

type DayTab = "today" | "tomorrow";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" aria-label="关闭抽屉" onClick={onClose} className="absolute inset-0 bg-black/35" />
      <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-ink">{title}</h4>
          <button type="button" onClick={onClose} className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70">
            关闭
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

const HOUR_START = 6;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_MIN = 1.6;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function snapToFive(mins: number): number {
  return Math.round(mins / 5) * 5;
}

const PLAN_COLOR: Record<TaskPlanType, string> = {
  today_top: "bg-mint/80 border-mint text-ink",
  today_secondary: "bg-sky/60 border-sky text-ink",
  today_other: "bg-ink/10 border-ink/20 text-ink",
  weekly: "bg-ink/10 border-ink/20 text-ink",
};

interface TimelineProps {
  tasks: Task[];
  onSlotClick: (startTime: string) => void;
  onTaskClick: (task: Task) => void;
}

function Timeline({ tasks, onSlotClick, onTaskClick }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalHeight = TOTAL_HOURS * 60 * PX_PER_MIN;

  const scheduledTasks = useMemo(
    () => tasks.filter((t) => t.isScheduled && t.startTime),
    [tasks],
  );

  // Current time indicator
  const [nowMins, setNowMins] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMins(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(id);
  }, []);
  const nowTop = (nowMins - HOUR_START * 60) * PX_PER_MIN;
  const showNow = nowMins >= HOUR_START * 60 && nowMins <= HOUR_END * 60;

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-task-block]")) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const y = e.clientY - rect.top + containerRef.current!.scrollTop;
    const mins = snapToFive(Math.floor(y / PX_PER_MIN) + HOUR_START * 60);
    const clamped = Math.max(HOUR_START * 60, Math.min(HOUR_END * 60 - 30, mins));
    onSlotClick(minutesToTime(clamped));
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto rounded-2xl border border-ink/10 bg-white"
      style={{ height: 340 }}
    >
      <div
        className="relative cursor-pointer select-none"
        style={{ height: totalHeight }}
        onClick={handleTrackClick}
      >
        {/* hour grid */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const hour = HOUR_START + i;
          const top = i * 60 * PX_PER_MIN;
          return (
            <div key={hour} className="pointer-events-none absolute left-0 right-0" style={{ top }}>
              <div className="flex items-center gap-1 pl-1">
                <span className="w-8 shrink-0 text-right text-[10px] leading-none text-ink/35">{String(hour).padStart(2, "0")}:00</span>
                <div className="flex-1 border-t border-ink/10" />
              </div>
            </div>
          );
        })}

        {/* half-hour dashes */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
          <div key={`h${i}`} className="pointer-events-none absolute left-9 right-0" style={{ top: (i * 60 + 30) * PX_PER_MIN }}>
            <div className="border-t border-dashed border-ink/6" />
          </div>
        ))}

        {/* now indicator */}
        {showNow && (
          <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top: nowTop }}>
            <div className="ml-9 h-0.5 flex-1 bg-red-400/70" />
            <span className="mr-1 text-[9px] text-red-400">NOW</span>
          </div>
        )}

        {/* task blocks */}
        {scheduledTasks.map((task) => {
          const startMins = timeToMinutes(task.startTime!) - HOUR_START * 60;
          const dur = task.durationMinutes ?? 45;
          const top = startMins * PX_PER_MIN;
          const height = Math.max(dur * PX_PER_MIN, 22);
          const colorClass = PLAN_COLOR[task.planType] ?? PLAN_COLOR.today_other;
          return (
            <div
              key={task.id}
              data-task-block
              onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
              className={`absolute left-10 right-2 cursor-pointer rounded-lg border px-2 py-0.5 text-xs font-medium shadow-sm transition hover:brightness-95 ${colorClass} ${task.completed ? "opacity-40 line-through" : ""}`}
              style={{ top, height, overflow: "hidden" }}
            >
              <span className="block truncate">{task.title}</span>
              {height > 30 && (
                <span className="block text-[10px] opacity-70">
                  {task.startTime} – {task.endTime ?? minutesToTime(timeToMinutes(task.startTime!) + dur)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compact task item ─────────────────────────────────────────────────────────

interface CompactTaskItemProps {
  task: Task;
  index: number;
  count: number;
  onToggle: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
  onSchedule: (task: Task) => void;
}

function CompactTaskItem({ task, index, count, onToggle, onReorder, onSchedule }: CompactTaskItemProps) {
  return (
    <li className="rounded-xl border border-ink/10 bg-white px-3 py-2">
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} className="mt-0.5 h-4 w-4 accent-mint" />
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${task.completed ? "line-through text-ink/45" : "text-ink"}`}>{task.title}</p>
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
          <button type="button" onClick={() => onReorder(task.id, "up")} disabled={index === 0} className="rounded border border-ink/15 px-2 py-0.5 text-[11px] text-ink/65 disabled:opacity-30">↑</button>
          <button type="button" onClick={() => onReorder(task.id, "down")} disabled={index === count - 1} className="rounded border border-ink/15 px-2 py-0.5 text-[11px] text-ink/65 disabled:opacity-30">↓</button>
        </div>
      </div>
    </li>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function DayPlanPanel() {
  const { state, actions } = useAppStore();
  const [activeDayTab, setActiveDayTab] = useState<DayTab>("today");
  const [showTimeline, setShowTimeline] = useState(true);
  const [hint, setHint] = useState("");
  const [showOtherTodos, setShowOtherTodos] = useState(false);

  // unified schedule sheet: either "new" (slot click) or "edit" (task click)
  const [scheduleSheet, setScheduleSheet] = useState<
    | { mode: "new"; startTime: string }
    | { mode: "edit"; task: Task }
    | null
  >(null);

  // new-task form state
  const [newTitle, setNewTitle] = useState("");
  const [newPlanType, setNewPlanType] = useState<TaskPlanType>("today_other");
  const [newDuration, setNewDuration] = useState(45);

  // edit form state (synced when sheet opens)
  const [editStart, setEditStart] = useState("09:00");
  const [editDuration, setEditDuration] = useState(45);

  const today = todayKey();
  const tomorrow = toDateKey(addDays(fromDateKey(today), 1));

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setActiveDayTab(search.get("day") === "tomorrow" ? "tomorrow" : "today");
  }, []);

  // sync edit state when sheet opens in edit mode
  useEffect(() => {
    if (scheduleSheet?.mode === "edit") {
      setEditStart(scheduleSheet.task.startTime ?? "09:00");
      setEditDuration(scheduleSheet.task.durationMinutes ?? 45);
    }
    if (scheduleSheet?.mode === "new") {
      setNewTitle("");
      setNewPlanType("today_other");
      setNewDuration(45);
    }
  }, [scheduleSheet]);

  const tomorrowTasks = useMemo(
    () => state.tasks.filter((t) => t.dueDate === tomorrow && t.planType !== "weekly").sort((a, b) => a.order - b.order),
    [state.tasks, tomorrow],
  );

  const topTasks = useMemo(() => tomorrowTasks.filter((t) => t.planType === "today_top"), [tomorrowTasks]);
  const secondaryTasks = useMemo(() => tomorrowTasks.filter((t) => t.planType === "today_secondary"), [tomorrowTasks]);
  const otherTasks = useMemo(() => tomorrowTasks.filter((t) => t.planType === "today_other"), [tomorrowTasks]);

  const todayIncompleteTasks = useMemo(
    () => state.tasks.filter((t) => t.dueDate === today && !t.completed && t.planType !== "weekly"),
    [state.tasks, today],
  );

  const todayReviewImprove = useMemo(
    () => state.reviews.find((r) => r.date === today)?.improveOneThing.trim() ?? "",
    [state.reviews, today],
  );

  const improveExistsInTomorrow = useMemo(
    () => !!todayReviewImprove && tomorrowTasks.some((t) => t.title.trim() === todayReviewImprove),
    [todayReviewImprove, tomorrowTasks],
  );

  const tomorrowTopTitle = topTasks[0]?.title ?? "未设置";
  const tomorrowDoneCount = tomorrowTasks.filter((t) => t.completed).length;

  // slot click → open sheet in "new" mode with pre-filled time
  function handleSlotClick(startTime: string) {
    setScheduleSheet({ mode: "new", startTime });
  }

  // task block click → open sheet in "edit" mode
  function handleTaskClick(task: Task) {
    setScheduleSheet({ mode: "edit", task });
  }

  // task list "排时间" click
  function handleScheduleFromList(task: Task) {
    setScheduleSheet({ mode: "edit", task });
  }

  function submitNewTask(e: FormEvent) {
    e.preventDefault();
    const clean = newTitle.trim();
    if (!clean || scheduleSheet?.mode !== "new") return;
    actions.addTaskOnDate(clean, newPlanType, tomorrow, {
      startTime: scheduleSheet.startTime,
      durationMinutes: newDuration,
    });
    setScheduleSheet(null);
    setHint(`已添加并安排在 ${scheduleSheet.startTime}。`);
  }

  function submitEditSchedule(e: FormEvent) {
    e.preventDefault();
    if (scheduleSheet?.mode !== "edit") return;
    actions.setTaskSchedule(scheduleSheet.task.id, editStart, undefined, editDuration);
    setScheduleSheet(null);
    setHint(`已更新时间：${editStart}，${editDuration} 分钟。`);
  }

  function clearSchedule() {
    if (scheduleSheet?.mode !== "edit") return;
    actions.clearTaskSchedule(scheduleSheet.task.id);
    setScheduleSheet(null);
    setHint("已清除时间安排。");
  }

  function moveIncompleteToTomorrow() {
    if (todayIncompleteTasks.length === 0) { setHint("今日没有未完成任务可迁移。"); return; }
    actions.moveIncompleteTodayTasksToTomorrow();
    setHint(`已迁移 ${todayIncompleteTasks.length} 项未完成任务到明日。`);
  }

  function applyReviewImproveToTomorrow() {
    if (!todayReviewImprove || improveExistsInTomorrow) return;
    actions.addTaskOnDate(todayReviewImprove, "today_top", tomorrow);
    setHint('已将"明天只改一个点"加入明日最重要任务。');
  }

  const sheetTitle = scheduleSheet?.mode === "new"
    ? `新建任务 · ${scheduleSheet.startTime}`
    : scheduleSheet?.mode === "edit"
      ? `编辑时间 · ${scheduleSheet.task.title}`
      : "";

  return (
    <div className="space-y-4 pb-2">
      {/* tab switcher */}
      <section className="card-surface p-2">
        <div className="flex gap-1">
          {(["today", "tomorrow"] as DayTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveDayTab(tab)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${activeDayTab === tab ? "bg-ink text-white" : "bg-white text-ink/70"}`}
            >
              {tab === "today" ? "今日" : "明日"}
            </button>
          ))}
        </div>
      </section>

      {activeDayTab === "today" ? (
        <TodayPanel />
      ) : (
        <div className="space-y-3">
          {/* summary */}
          <section className="card-surface border-mint/35 bg-mint/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="section-title">明日摘要</h3>
              <span className="badge border-ink/15 bg-white text-ink/70">{formatDateLabel(tomorrow)}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white/80 p-2">
                <p className="text-xs text-ink/55">最重要 1 件</p>
                <p className="mt-1 line-clamp-1 font-medium text-ink">{tomorrowTopTitle}</p>
              </div>
              <div className="rounded-xl bg-white/80 p-2">
                <p className="text-xs text-ink/55">次重要 / 其他</p>
                <p className="mt-1 font-medium text-ink">{secondaryTasks.length} / {otherTasks.length} 项</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink/65">明天只改一个点：{todayReviewImprove || "今晚复盘后自动带入"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={applyReviewImproveToTomorrow} disabled={!todayReviewImprove || improveExistsInTomorrow} className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-[11px] text-ink/70 disabled:opacity-40">
                加入最重要
              </button>
              <button type="button" onClick={moveIncompleteToTomorrow} className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-[11px] text-ink/70">
                迁移今日未完成
              </button>
            </div>
          </section>

          {/* timeline */}
          <section className="card-surface p-4">
            <button
              type="button"
              onClick={() => setShowTimeline((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <h4 className="text-sm font-semibold text-ink">时间轴</h4>
              <span className="text-xs text-ink/50">{showTimeline ? "收起" : "展开"}</span>
            </button>
            {showTimeline && (
              <div className="mt-3">
                <Timeline tasks={tomorrowTasks} onSlotClick={handleSlotClick} onTaskClick={handleTaskClick} />
                <p className="mt-1.5 text-center text-[11px] text-ink/40">点击空白处新建任务 · 点击任务块编辑时间</p>
              </div>
            )}
          </section>

          {/* task lists */}
          <section className="card-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-ink">明日任务</h4>
              <span className="badge border-ink/15 bg-white text-ink/70">完成 {tomorrowDoneCount}/{tomorrowTasks.length}</span>
            </div>
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl border border-mint/45 bg-mint/15 p-3">
                <p className="text-xs font-medium text-ink/75">最重要 1 件</p>
                <ul className="mt-2 space-y-2">
                  {topTasks.map((task, i) => (
                    <CompactTaskItem key={task.id} task={task} index={i} count={topTasks.length} onToggle={actions.toggleTask} onReorder={actions.reorderTask} onSchedule={handleScheduleFromList} />
                  ))}
                </ul>
                {topTasks.length === 0 && <p className="mt-2 text-xs text-ink/55">还未设置。</p>}
              </div>

              <div className="rounded-2xl border border-sky/40 bg-sky/10 p-3">
                <p className="text-xs font-medium text-ink/75">次重要 2 件</p>
                <ul className="mt-2 space-y-2">
                  {secondaryTasks.map((task, i) => (
                    <CompactTaskItem key={task.id} task={task} index={i} count={secondaryTasks.length} onToggle={actions.toggleTask} onReorder={actions.reorderTask} onSchedule={handleScheduleFromList} />
                  ))}
                </ul>
                {secondaryTasks.length === 0 && <p className="mt-2 text-xs text-ink/55">还未设置。</p>}
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-3">
                <button type="button" onClick={() => setShowOtherTodos((v) => !v)} className="flex w-full items-center justify-between text-left">
                  <span className="text-xs font-medium text-ink/75">其他待办（{otherTasks.length}）</span>
                  <span className="text-xs text-ink/50">{showOtherTodos ? "收起" : "展开"}</span>
                </button>
                {showOtherTodos && (
                  <ul className="mt-2 space-y-2">
                    {otherTasks.map((task, i) => (
                      <CompactTaskItem key={task.id} task={task} index={i} count={otherTasks.length} onToggle={actions.toggleTask} onReorder={actions.reorderTask} onSchedule={handleScheduleFromList} />
                    ))}
                  </ul>
                )}
                {otherTasks.length === 0 && <p className="mt-2 text-xs text-ink/50">暂无。</p>}
              </div>
            </div>
          </section>

          {hint && <p className="px-1 text-center text-xs text-ink/55">{hint}</p>}
        </div>
      )}

      {/* unified schedule sheet */}
      <BottomSheet open={Boolean(scheduleSheet)} title={sheetTitle} onClose={() => setScheduleSheet(null)}>
        {scheduleSheet?.mode === "new" && (
          <form onSubmit={submitNewTask} className="space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="任务名称"
              autoFocus
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={newPlanType} onChange={(e) => setNewPlanType(e.target.value as TaskPlanType)} className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm">
                <option value="today_top">最重要</option>
                <option value="today_secondary">次重要</option>
                <option value="today_other">其他待办</option>
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={15}
                  step={5}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value) || 45)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
                />
                <span className="shrink-0 text-xs text-ink/50">分钟</span>
              </div>
            </div>
            <p className="text-center text-xs text-ink/50">
              {scheduleSheet.startTime} – {minutesToTime(timeToMinutes(scheduleSheet.startTime) + newDuration)}
            </p>
            <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
              添加并安排
            </button>
          </form>
        )}

        {scheduleSheet?.mode === "edit" && (
          <form onSubmit={submitEditSchedule} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-ink/60">
                开始时间
                <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-ink/60">
                时长（分钟）
                <input type="number" min={15} step={5} value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value) || 45)} className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm" />
              </label>
            </div>
            <p className="text-center text-xs text-ink/50">
              {editStart} – {minutesToTime(timeToMinutes(editStart) + editDuration)}（{editDuration} 分钟）
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">确认</button>
              <button type="button" onClick={clearSchedule} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">清除时间</button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
