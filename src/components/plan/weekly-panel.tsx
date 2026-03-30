"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { downloadIcsFile, exportToICS, mapTasksToCalendarEvents } from "@/lib/calendar-sync";
import { addDays, fromDateKey, startOfWeek, toDateKey, todayKey } from "@/lib/date";
import { useAppStore } from "@/store/app-store";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUS_PREFIX = "【本周重点】";

function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" aria-label="关闭抽屉" onClick={onClose} className="absolute inset-0 bg-black/35" />
      <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-ink">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70"
          >
            关闭
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function isFocusedWeeklyTask(title: string): boolean {
  return title.startsWith(FOCUS_PREFIX);
}

function stripWeeklyPrefix(title: string): string {
  return isFocusedWeeklyTask(title) ? title.replace(FOCUS_PREFIX, "") : title;
}

function inferTaskMinutes(startTime?: string, endTime?: string, durationMinutes?: number): number {
  if (durationMinutes && durationMinutes > 0) {
    return durationMinutes;
  }
  if (startTime && endTime) {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return Math.max(15, end - start);
  }
  return 60;
}

export function WeeklyPanel() {
  const { state, actions } = useAppStore();
  const today = todayKey();

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showAddWeeklySheet, setShowAddWeeklySheet] = useState(false);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);

  const weeklyPlan = useMemo(() => {
    if (state.weeklyPlans.length === 0) {
      return null;
    }
    return [...state.weeklyPlans].sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))[0];
  }, [state.weeklyPlans]);

  const weeklyTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.planType === "weekly")
        .sort((a, b) => `${a.dueDate}-${a.order}`.localeCompare(`${b.dueDate}-${b.order}`)),
    [state.tasks],
  );

  const defaultDeadline = useMemo(() => {
    if (weeklyPlan) {
      return toDateKey(addDays(fromDateKey(weeklyPlan.weekStartDate), 6));
    }
    return toDateKey(addDays(fromDateKey(today), 3));
  }, [today, weeklyPlan]);

  const goalTitles = useMemo(
    () =>
      (weeklyPlan?.weekGoalIds ?? [])
        .map((id) => state.goals.find((goal) => goal.id === id)?.title)
        .filter((value): value is string => Boolean(value)),
    [state.goals, weeklyPlan],
  );

  const [executionInput, setExecutionInput] = useState("");
  const [checkSummary, setCheckSummary] = useState("");
  const [oneImprovement, setOneImprovement] = useState("");
  const [hint, setHint] = useState("");

  const [newWeeklyTitle, setNewWeeklyTitle] = useState("");
  const [newWeeklyDeadline, setNewWeeklyDeadline] = useState(defaultDeadline);
  const [newWeeklyIsFocus, setNewWeeklyIsFocus] = useState(false);
  const [newWeeklyNote, setNewWeeklyNote] = useState("");

  const pendingDeleteTask = useMemo(
    () => weeklyTasks.find((task) => task.id === pendingDeleteTaskId) ?? null,
    [pendingDeleteTaskId, weeklyTasks],
  );

  const hasLinkedDayPlan = useMemo(() => {
    if (!pendingDeleteTask) {
      return false;
    }

    return state.tasks.some(
      (task) =>
        task.id !== pendingDeleteTask.id &&
        task.planType !== "weekly" &&
        task.title.trim() === stripWeeklyPrefix(pendingDeleteTask.title).trim(),
    );
  }, [pendingDeleteTask, state.tasks]);

  useEffect(() => {
    setCheckSummary(weeklyPlan?.checkSummary ?? "");
    setOneImprovement(weeklyPlan?.nextWeekOneImprovement ?? "");
  }, [weeklyPlan]);

  useEffect(() => {
    setNewWeeklyDeadline(defaultDeadline);
  }, [defaultDeadline]);

  const reflectionFilled = Boolean((weeklyPlan?.checkSummary ?? "").trim() || (weeklyPlan?.nextWeekOneImprovement ?? "").trim());
  const reviewSummary = reflectionFilled
    ? `已填写复盘${weeklyPlan?.nextWeekOneImprovement ? `，下周改进：${weeklyPlan.nextWeekOneImprovement}` : ""}`
    : "本周只改一个问题，建议周末完成复盘";

  const weeklyBreakdownInsight = useMemo(() => {
    const weekStart = weeklyPlan?.weekStartDate ?? toDateKey(startOfWeek(fromDateKey(today)));
    const weekEnd = toDateKey(addDays(fromDateKey(weekStart), 6));
    const tasks = state.tasks.filter(
      (task) => task.goalBreakdownItemId && task.dueDate >= weekStart && task.dueDate <= weekEnd,
    );
    const distributedCount = tasks.length;
    const completedCount = tasks.filter((task) => task.completed).length;
    const overdueCount = tasks.filter((task) => !task.completed && task.dueDate < today).length;
    const totalHours = (tasks.reduce((sum, task) => sum + inferTaskMinutes(task.startTime, task.endTime, task.durationMinutes), 0) / 60).toFixed(1);
    const draft = `拆解项周复盘草稿：本周分发 ${distributedCount} 项，完成 ${completedCount} 项，延期 ${overdueCount} 项，总投入约 ${totalHours} 小时。`;

    return {
      distributedCount,
      completedCount,
      overdueCount,
      totalHours,
      draft,
    };
  }, [state.tasks, today, weeklyPlan?.weekStartDate]);

  function exportWeeklyTasksToCalendar() {
    if (weeklyTasks.length === 0) {
      setHint("当前没有本周任务可以导出。");
      return;
    }

    const events = mapTasksToCalendarEvents(weeklyTasks, {
      includeUnscheduled: true,
      titlePrefix: "本周",
    });

    const ics = exportToICS(events, "本周任务");
    const weekStartForName = weeklyPlan?.weekStartDate ?? today;
    downloadIcsFile(`weekly-tasks-${weekStartForName}.ics`, ics);
    actions.markTasksSyncedToCalendar(weeklyTasks.map((task) => task.id), true);
    setHint(`已导出本周任务 ${events.length} 条。`);
  }

  function onAddExecution(event: FormEvent) {
    event.preventDefault();
    const clean = executionInput.trim();
    if (!clean) {
      return;
    }
    actions.addWeeklyExecution(clean);
    setExecutionInput("");
    setHint("已添加执行记录。");
  }

  function onSaveReflection(event: FormEvent) {
    event.preventDefault();
    actions.updateWeeklyReflection(checkSummary, oneImprovement);
    setHint("已保存本周复盘。");
  }

  function appendBreakdownInsightToExecution() {
    actions.addWeeklyExecution(weeklyBreakdownInsight.draft);
    setHint("已将拆解项周复盘草稿写入执行记录。");
  }

  function onSubmitAddWeeklyTask(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = newWeeklyTitle.trim();
    if (!cleanTitle) {
      return;
    }

    const taskTitle = newWeeklyIsFocus ? `${FOCUS_PREFIX}${cleanTitle}` : cleanTitle;
    actions.addTaskOnDate(taskTitle, "weekly", newWeeklyDeadline || defaultDeadline);

    const cleanNote = newWeeklyNote.trim();
    if (cleanNote) {
      actions.addWeeklyExecution(`周任务备注：${cleanTitle} - ${cleanNote}`);
    }

    setNewWeeklyTitle("");
    setNewWeeklyDeadline(defaultDeadline);
    setNewWeeklyIsFocus(false);
    setNewWeeklyNote("");
    setShowAddWeeklySheet(false);
    setHint("已添加周计划。");
  }

  function requestDeleteTask(taskId: string) {
    setMenuTaskId(null);
    setPendingDeleteTaskId(taskId);
  }

  function confirmDeleteTask() {
    if (!pendingDeleteTask) {
      return;
    }
    actions.deleteTask(pendingDeleteTask.id);
    setHint("周计划已删除。");
    setPendingDeleteTaskId(null);
  }

  return (
    <div className="space-y-4 pb-2">
      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="soft-label">本周任务</p>
            <h3 className="mt-1 text-lg font-semibold">
              {weeklyPlan ? `从 ${weeklyPlan.weekStartDate} 开始` : "本周任务清单"}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAddWeeklySheet(true)}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink"
            >
              + 添加周计划
            </button>
            <button
              type="button"
              onClick={exportWeeklyTasksToCalendar}
              className="rounded-xl bg-sky px-3 py-2 text-sm font-medium text-ink"
            >
              同步到日历 (.ics)
            </button>
          </div>
        </div>

        <ul className="mt-3 space-y-2">
          {weeklyTasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-ink/10 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-ink">{stripWeeklyPrefix(task.title)}</p>
                  {isFocusedWeeklyTask(task.title) && (
                    <span className="mt-1 inline-flex rounded-full border border-mint/45 bg-mint/15 px-2 py-0.5 text-[11px] text-ink/75">
                      本周重点
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="rounded-full border border-ink/20 bg-white px-2 py-0.5">截止 {task.dueDate}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 ${
                      task.syncedToCalendar ? "border-sky/50 bg-sky/20" : "border-ink/20 bg-white"
                    }`}
                  >
                    {task.syncedToCalendar ? "已同步" : "未同步"}
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuTaskId((prev) => (prev === task.id ? null : task.id))}
                      className="rounded-full border border-ink/20 bg-white px-2 py-0.5 text-xs text-ink/70"
                      aria-label="更多操作"
                    >
                      ···
                    </button>
                    {menuTaskId === task.id && (
                      <div className="absolute right-0 top-7 z-10 min-w-24 rounded-xl border border-ink/15 bg-white p-1 shadow-card">
                        <button
                          type="button"
                          onClick={() => requestDeleteTask(task.id)}
                          className="w-full rounded-lg px-2 py-1 text-left text-xs text-red-700 hover:bg-red-50"
                        >
                          删除周计划
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-1 text-xs text-ink/65">
                {task.isScheduled && task.startTime && task.endTime
                  ? `时间 ${task.startTime} - ${task.endTime}`
                  : "未设定具体时间，导出时会使用默认时段"}
              </p>
            </li>
          ))}
        </ul>

        {weeklyTasks.length === 0 && <p className="mt-2 text-sm text-ink/60">还没有本周任务，先添加一项周计划。</p>}
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">拆解项周复盘草稿</h3>
          <button
            type="button"
            onClick={appendBreakdownInsightToExecution}
            className="rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70"
          >
            写入执行记录
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink/75 md:grid-cols-4">
          <p className="rounded-lg bg-white p-2">本周分发：{weeklyBreakdownInsight.distributedCount} 项</p>
          <p className="rounded-lg bg-white p-2">本周完成：{weeklyBreakdownInsight.completedCount} 项</p>
          <p className="rounded-lg bg-white p-2">延期：{weeklyBreakdownInsight.overdueCount} 项</p>
          <p className="rounded-lg bg-white p-2">投入：{weeklyBreakdownInsight.totalHours} 小时</p>
        </div>
        <p className="mt-3 rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink/75">{weeklyBreakdownInsight.draft}</p>
      </section>

      <section className="card-surface p-4 md:p-5">
        <button
          type="button"
          onClick={() => setIsReviewOpen((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="soft-label">PDCA 循环</p>
            <h3 className="mt-1 text-lg font-semibold">本周计划复盘</h3>
            <p className="mt-1 text-xs text-ink/65">{reviewSummary}</p>
          </div>
          <span className="text-lg text-ink/60">{isReviewOpen ? "▾" : "▸"}</span>
        </button>

        {isReviewOpen && (
          <div className="mt-4 space-y-3">
            <article className="rounded-xl border border-ink/10 bg-white p-3">
              <p className="text-xs font-semibold text-ink/60">P - 计划</p>
              {goalTitles.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-ink/85">
                  {goalTitles.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink/60">本周尚未关联目标，可先从计划页添加目标后自动显示。</p>
              )}
            </article>

            <article className="rounded-xl border border-ink/10 bg-white p-3">
              <p className="text-xs font-semibold text-ink/60">D - 执行记录</p>
              <ul className="mt-2 space-y-2 text-sm text-ink/85">
                {(weeklyPlan?.executionLog ?? []).slice(0, 6).map((item) => (
                  <li key={item} className="rounded-lg bg-paper px-2 py-1">
                    {item}
                  </li>
                ))}
              </ul>
              {(weeklyPlan?.executionLog ?? []).length === 0 && <p className="mt-2 text-sm text-ink/60">还没有执行记录。</p>}

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

            <form className="rounded-xl border border-ink/10 bg-white p-3" onSubmit={onSaveReflection}>
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
          </div>
        )}
      </section>

      {hint && <p className="px-1 text-center text-xs text-ink/60">{hint}</p>}

      <BottomSheet open={showAddWeeklySheet} title="添加周计划" onClose={() => setShowAddWeeklySheet(false)}>
        <form onSubmit={onSubmitAddWeeklyTask} className="space-y-3">
          <input
            value={newWeeklyTitle}
            onChange={(event) => setNewWeeklyTitle(event.target.value)}
            placeholder="周任务标题"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={newWeeklyDeadline}
            onChange={(event) => setNewWeeklyDeadline(event.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />

          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={newWeeklyIsFocus}
              onChange={(event) => setNewWeeklyIsFocus(event.target.checked)}
              className="h-4 w-4 accent-mint"
            />
            设为本周重点
          </label>

          <textarea
            value={newWeeklyNote}
            onChange={(event) => setNewWeeklyNote(event.target.value)}
            rows={3}
            placeholder="备注（可选）"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />

          <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存
          </button>
        </form>
      </BottomSheet>

      <BottomSheet open={Boolean(pendingDeleteTask)} title="确认删除" onClose={() => setPendingDeleteTaskId(null)}>
        {pendingDeleteTask && (
          <div className="space-y-3">
            <p className="text-sm text-ink/80">
              确认删除这条周计划吗？
              <br />
              <span className="font-medium text-ink">{stripWeeklyPrefix(pendingDeleteTask.title)}</span>
            </p>

            {(pendingDeleteTask.isScheduled || hasLinkedDayPlan) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                这条周任务已有关联安排（{pendingDeleteTask.isScheduled ? "已设置时间" : "已关联到日计划"}），删除后将从本周列表中移除，是否继续？
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteTaskId(null)}
                className="flex-1 rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
