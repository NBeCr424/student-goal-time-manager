"use client";

import Link from "next/link";
import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { downloadIcsFile, exportToICS, mapGoalSessionsToCalendarEvents } from "@/lib/calendar-sync";
import { GoalDistributeSheet } from "@/components/plan/goal-distribute-sheet";
import { addDays, diffInDays, formatDateLabel, fromDateKey, startOfWeek, todayKey, toDateKey } from "@/lib/date";
import { calculateGoalProgress } from "@/lib/goal-progress";
import { getGoalScheduleStats } from "@/lib/scheduler";
import { GoalSession, PreferredTimeOfDay, SessionStatus, Task } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const preferredTimeLabel: Record<PreferredTimeOfDay, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚上",
  flexible: "灵活安排",
};

const goalStatusLabel = {
  not_started: "未开始",
  active: "进行中",
  paused: "暂停",
  completed: "已完成",
} as const;

const goalPriorityLabel = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
} as const;

const sessionStatusLabel: Record<SessionStatus, string> = {
  planned: "已计划",
  done: "已完成",
  missed: "未完成",
};

type GoalRisk = "safe" | "watch" | "warning" | "critical";

type UndoAction =
  | {
      type: "withdraw";
      task: Task;
      expireAt: number;
      message: string;
    }
  | {
      type: "reassign";
      taskId: string;
      taskTitle: string;
      previousPlanType: Task["planType"];
      previousDueDate: string;
      previousSchedule?: { startTime?: string; endTime?: string; durationMinutes?: number };
      expireAt: number;
      message: string;
    };

const riskLabel: Record<GoalRisk, string> = {
  safe: "节奏正常",
  watch: "建议关注",
  warning: "需要加速",
  critical: "高风险",
};

const riskTone: Record<GoalRisk, string> = {
  safe: "border-mint/45 bg-mint/15 text-ink/75",
  watch: "border-amber-300 bg-amber-50 text-amber-700",
  warning: "border-orange-300 bg-orange-50 text-orange-700",
  critical: "border-red-300 bg-red-50 text-red-700",
};

function toHourText(minutes: number): string {
  return `${(minutes / 60).toFixed(1)} 小时`;
}

function sortSessions(a: GoalSession, b: GoalSession): number {
  return `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
}

function sortTasks(a: Task, b: Task): number {
  return `${a.dueDate}-${a.order}`.localeCompare(`${b.dueDate}-${b.order}`);
}

function planTypeLabel(task: Task): string {
  return task.planType === "weekly" ? "本周计划" : "日计划";
}

function goalRisk(daysLeft: number, unscheduledMinutes: number, completed: boolean): GoalRisk {
  if (completed) {
    return "safe";
  }
  if (daysLeft < 0) {
    return "critical";
  }
  if (unscheduledMinutes <= 0) {
    return daysLeft <= 3 ? "watch" : "safe";
  }
  if (daysLeft <= 1) {
    return "critical";
  }
  if (daysLeft <= 3) {
    return "warning";
  }
  if (daysLeft <= 7) {
    return "watch";
  }
  return "safe";
}

export function GoalDetailPage({ goalId }: { goalId: string }) {
  const { state, actions } = useAppStore();
  const goal = state.goals.find((item) => item.id === goalId);

  const [showDistributeSheet, setShowDistributeSheet] = useState(false);
  const [distributeItemId, setDistributeItemId] = useState<string | null>(null);
  const [batchDistributeIds, setBatchDistributeIds] = useState<string[]>([]);
  const [reassignTaskId, setReassignTaskId] = useState<string | null>(null);
  const [quickDistributeItemId, setQuickDistributeItemId] = useState<string | null>(null);
  const [newBreakdownTitle, setNewBreakdownTitle] = useState("");
  const [hint, setHint] = useState("");
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [draggingBreakdownItemId, setDraggingBreakdownItemId] = useState<string | null>(null);
  const [dragOverBreakdownItemId, setDragOverBreakdownItemId] = useState<string | null>(null);

  const longPressTimerRef = useRef<number | null>(null);
  const dragOverBreakdownItemIdRef = useRef<string | null>(null);
  const lastVibrateAtRef = useRef(0);

  function triggerHapticFeedback(duration = 10) {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
      return;
    }
    const now = Date.now();
    if (now - lastVibrateAtRef.current < 50) {
      return;
    }
    navigator.vibrate(duration);
    lastVibrateAtRef.current = now;
  }

  useEffect(() => {
    if (!undoAction) {
      return;
    }
    const remainMs = undoAction.expireAt - Date.now();
    if (remainMs <= 0) {
      setUndoAction(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setUndoAction((prev) => (prev?.expireAt === undoAction.expireAt ? null : prev));
    }, remainMs);
    return () => window.clearTimeout(timer);
  }, [undoAction]);

  useEffect(() => {
    if (!draggingBreakdownItemId) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const carrier = target.closest<HTMLElement>("[data-breakdown-item-id]");
      const targetItemId = carrier?.dataset.breakdownItemId ?? null;
      if (!targetItemId || targetItemId === dragOverBreakdownItemIdRef.current) {
        return;
      }
      dragOverBreakdownItemIdRef.current = targetItemId;
      setDragOverBreakdownItemId(targetItemId);
      if (event.pointerType === "touch") {
        triggerHapticFeedback(8);
      }
    };

    const handlePointerEnd = () => {
      const targetItemId = dragOverBreakdownItemIdRef.current;
      if (targetItemId && targetItemId !== draggingBreakdownItemId) {
        actions.moveGoalBreakdownItem(goalId, draggingBreakdownItemId, targetItemId);
        setHint("已调整拆解项顺序。");
      }
      setDraggingBreakdownItemId(null);
      dragOverBreakdownItemIdRef.current = null;
      setDragOverBreakdownItemId(null);
      lastVibrateAtRef.current = 0;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [actions, draggingBreakdownItemId, goalId]);

  useEffect(
    () => () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    },
    [],
  );

  if (!goal) {
    return (
      <section className="card-surface p-6 text-center">
        <h2 className="text-lg font-semibold text-ink">目标不存在</h2>
        <p className="mt-2 text-sm text-ink/70">可能已被删除，或当前链接已失效。</p>
        <Link href="/plan" className="mt-4 inline-flex rounded-xl bg-ink px-4 py-2 text-sm text-white">
          返回计划页
        </Link>
      </section>
    );
  }

  const today = todayKey();
  const tomorrow = toDateKey(addDays(fromDateKey(today), 1));
  const weekEnd = toDateKey(addDays(startOfWeek(fromDateKey(today)), 6));

  const currentGoal = goal;
  const progressMetrics = calculateGoalProgress(currentGoal, state.tasks);
  const distributeItem = currentGoal.breakdownItems.find((item) => item.id === distributeItemId) ?? null;
  const reassignTask = state.tasks.find((task) => task.id === reassignTaskId && task.goalId === currentGoal.id) ?? null;

  const selectedBatchItems = currentGoal.breakdownItems
    .filter((item) => batchDistributeIds.includes(item.id))
    .map((item) => ({ id: item.id, title: item.title }));

  const breakdownTaskMap = new Map<string, Task[]>();
  currentGoal.breakdownItems.forEach((item) => {
    breakdownTaskMap.set(item.id, []);
  });
  state.tasks
    .filter((task) => task.goalId === currentGoal.id && task.goalBreakdownItemId)
    .sort(sortTasks)
    .forEach((task) => {
      const key = task.goalBreakdownItemId;
      if (!key) {
        return;
      }
      const list = breakdownTaskMap.get(key);
      if (list) {
        list.push(task);
      }
    });

  const quickDistributeItem =
    currentGoal.breakdownItems.find((item) => item.id === quickDistributeItemId) ?? null;

  const sessions = state.goalSessions.filter((session) => session.goalId === currentGoal.id).sort(sortSessions);
  const stats = getGoalScheduleStats(currentGoal, sessions);
  const goalTitleById = new Map(state.goals.map((item) => [item.id, item.title]));
  const syncedCount = sessions.filter((session) => session.syncedToCalendar).length;
  const daysLeft = diffInDays(fromDateKey(today), fromDateKey(currentGoal.deadline));
  const coverage = stats.totalMinutes > 0 ? Math.round((stats.scheduledMinutes / stats.totalMinutes) * 100) : 0;
  const risk = goalRisk(daysLeft, stats.unscheduledMinutes, currentGoal.status === "completed");

  function exportGoalSchedule() {
    if (sessions.length === 0) {
      return;
    }
    const events = mapGoalSessionsToCalendarEvents(sessions, goalTitleById);
    const ics = exportToICS(events, `${currentGoal.title} 执行计划`);
    downloadIcsFile(`goal-${currentGoal.id}-sessions.ics`, ics);
    actions.markGoalSessionsSyncedToCalendar(
      events.map((eventItem) => eventItem.sourceId),
      true,
    );
  }

  function submitBreakdownItem(event: FormEvent) {
    event.preventDefault();
    const clean = newBreakdownTitle.trim();
    if (!clean) {
      return;
    }
    actions.addGoalBreakdownItem(currentGoal.id, clean);
    setNewBreakdownTitle("");
    setHint("已添加拆解项。");
  }

  function openGoalDistribute() {
    setDistributeItemId(null);
    setBatchDistributeIds([]);
    setReassignTaskId(null);
    setShowDistributeSheet(true);
  }

  function openItemDistribute(itemId: string) {
    setDistributeItemId(itemId);
    setBatchDistributeIds([]);
    setReassignTaskId(null);
    setShowDistributeSheet(true);
  }

  function openBatchDistribute() {
    if (selectedBatchItems.length === 0) {
      return;
    }
    setDistributeItemId(null);
    setReassignTaskId(null);
    setShowDistributeSheet(true);
  }

  function openTaskReassign(taskId: string) {
    setReassignTaskId(taskId);
    setDistributeItemId(null);
    setBatchDistributeIds([]);
    setShowDistributeSheet(true);
  }

  function toggleBatchSelect(itemId: string) {
    setBatchDistributeIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  }

  function startBreakdownDrag(event: ReactPointerEvent<HTMLButtonElement>, itemId: string) {
    event.preventDefault();
    event.stopPropagation();
    clearLongPressTimer();
    setQuickDistributeItemId(null);
    setDraggingBreakdownItemId(itemId);
    dragOverBreakdownItemIdRef.current = itemId;
    setDragOverBreakdownItemId(itemId);
    if (event.pointerType === "touch") {
      triggerHapticFeedback(12);
    }
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function startLongPress(itemId: string) {
    if (draggingBreakdownItemId) {
      return;
    }
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      setQuickDistributeItemId(itemId);
    }, 450);
  }

  function taskScheduleSnapshot(task: Task): { startTime?: string; endTime?: string; durationMinutes?: number } {
    return {
      startTime: task.startTime,
      endTime: task.endTime,
      durationMinutes: task.durationMinutes,
    };
  }

  function withdrawDistributedTask(task: Task) {
    const snapshot: Task = {
      ...task,
      knowledgeItemIds: [...task.knowledgeItemIds],
    };
    actions.deleteTask(task.id);
    setUndoAction({
      type: "withdraw",
      task: snapshot,
      expireAt: Date.now() + 12000,
      message: `已撤回任务「${task.title}」到拆解池。`,
    });
    setHint(`已撤回任务「${task.title}」到拆解池。`);
  }

  function undoLatestAction() {
    if (!undoAction) {
      return;
    }

    if (undoAction.type === "withdraw") {
      actions.restoreDeletedGoalTask(undoAction.task);
      setHint(`已撤销：任务「${undoAction.task.title}」已恢复。`);
    } else {
      actions.reassignGoalDistributedTask(
        undoAction.taskId,
        undoAction.previousPlanType,
        undoAction.previousDueDate,
        undoAction.previousSchedule,
      );
      setHint(`已撤销改派：任务「${undoAction.taskTitle}」已恢复原安排。`);
    }
    setUndoAction(null);
  }

  function quickDistribute(target: "today" | "tomorrow" | "weekly") {
    if (!quickDistributeItem) {
      return;
    }

    const dueDate = target === "today" ? today : target === "tomorrow" ? tomorrow : weekEnd;
    const planType = target === "weekly" ? "weekly" : "today_other";

    actions.distributeGoalTaskToPlan(
      currentGoal.id,
      quickDistributeItem.title,
      planType,
      dueDate,
      { durationMinutes: 45 },
      quickDistributeItem.id,
    );

    setQuickDistributeItemId(null);
    setHint(`已快捷分发「${quickDistributeItem.title}」。`);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="soft-label">目标详情</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{currentGoal.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink/75">{currentGoal.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge border-ink/15 bg-white text-ink/70">{goalPriorityLabel[currentGoal.priority]}</span>
            <span className="badge border-mint/45 bg-mint/15 text-ink/70">{goalStatusLabel[currentGoal.status]}</span>
            <span className={`badge ${riskTone[risk]}`}>{riskLabel[risk]}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs text-ink/65">
              <span>目标进度</span>
              <span>{progressMetrics.percent}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-ink/10">
              <div className="h-2 rounded-full bg-mint" style={{ width: `${progressMetrics.percent}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-ink/65">
              <span>分配覆盖率</span>
              <span>{coverage}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-ink/10">
              <div className="h-2 rounded-full bg-sky" style={{ width: `${coverage}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-xs text-ink/75 sm:grid-cols-2 lg:grid-cols-3">
          <p className="rounded-lg bg-white p-3">截止日期：{currentGoal.deadline}</p>
          <p className="rounded-lg bg-white p-3">剩余天数：{daysLeft} 天</p>
          <p className="rounded-lg bg-white p-3">预计总时长：{currentGoal.estimatedTotalHours} 小时</p>
          <p className="rounded-lg bg-white p-3">建议单次投入：{currentGoal.suggestedSessionMinutes} 分钟</p>
          <p className="rounded-lg bg-white p-3">偏好时段：{preferredTimeLabel[currentGoal.preferredTimeOfDay]}</p>
          <p className="rounded-lg bg-white p-3">日历同步：{syncedCount}/{sessions.length}</p>
          <p className="rounded-lg bg-white p-3">拆解完成：{progressMetrics.breakdownDone}/{progressMetrics.breakdownTotal}</p>
          <p className="rounded-lg bg-white p-3">分发任务完成：{progressMetrics.distributedDone}/{progressMetrics.distributedTotal}</p>
          <p className="rounded-lg bg-white p-3">已安排：{toHourText(stats.scheduledMinutes)}</p>
          <p className="rounded-lg bg-white p-3">待安排：{toHourText(stats.unscheduledMinutes)}</p>
        </div>

        {risk !== "safe" && stats.unscheduledMinutes > 0 && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            当前还有 {toHourText(stats.unscheduledMinutes)} 待安排，建议先分发到本周或日计划，再继续细化。
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={openGoalDistribute} className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            分发到计划
          </button>
          <Link href="/plan?tab=calendar" className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink/80">
            在日历中查看
          </Link>
          <button
            type="button"
            onClick={exportGoalSchedule}
            disabled={sessions.length === 0}
            className="rounded-xl bg-sky px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            同步到日历 (.ics)
          </button>
        </div>
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title">目标拆解项</h3>
          <div className="flex items-center gap-2">
            <span className="badge border-ink/15 bg-white text-ink/65">{currentGoal.breakdownItems.length} 项</span>
            <button
              type="button"
              onClick={openBatchDistribute}
              disabled={selectedBatchItems.length === 0}
              className="rounded-lg border border-ink/15 bg-white px-2 py-1 text-[11px] text-ink/70 disabled:opacity-40"
            >
              批量分发{selectedBatchItems.length > 0 ? `（${selectedBatchItems.length}）` : ""}
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-ink/60">
          先拆解成可执行动作，再手动分发到本周或日计划。长按拆解项可快捷分发，按住“拖拽”可调整顺序。
        </p>

        <form onSubmit={submitBreakdownItem} className="mt-3 flex gap-2">
          <input
            value={newBreakdownTitle}
            onChange={(event) => setNewBreakdownTitle(event.target.value)}
            placeholder="新增拆解项，例如：整理第 2 章错题"
            className="flex-1 rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-xs font-medium text-white">
            添加
          </button>
        </form>

        {currentGoal.breakdownItems.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {currentGoal.breakdownItems.map((item) => {
              const linkedTasks = breakdownTaskMap.get(item.id) ?? [];
              const isDragging = draggingBreakdownItemId === item.id;
              const isDropTarget =
                !!draggingBreakdownItemId && dragOverBreakdownItemId === item.id && draggingBreakdownItemId !== item.id;
              return (
                <li
                  key={item.id}
                  data-breakdown-item-id={item.id}
                  className={`relative rounded-xl border bg-white p-3 transition ${
                    isDragging
                      ? "border-ink/40 opacity-75"
                      : isDropTarget
                        ? "border-mint/50 shadow-[0_0_0_2px_rgba(88,204,161,0.18)]"
                        : "border-ink/10"
                  }`}
                  onTouchStart={() => startLongPress(item.id)}
                  onTouchEnd={clearLongPressTimer}
                  onTouchMove={clearLongPressTimer}
                  onTouchCancel={clearLongPressTimer}
                >
                  {isDropTarget && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-3 right-3 top-0 h-1 -translate-y-1/2 rounded-full bg-mint"
                    />
                  )}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => actions.toggleGoalBreakdownItem(currentGoal.id, item.id)}
                      className="mt-0.5 h-4 w-4 accent-mint"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${item.completed ? "line-through text-ink/45" : "text-ink"}`}>{item.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                        <span className="badge border-ink/15 bg-white text-ink/60">{item.completed ? "已完成" : "待执行"}</span>
                        <span className="badge border-ink/15 bg-white text-ink/60">已分发 {item.distributedCount} 次</span>
                        <span className="badge border-ink/15 bg-white text-ink/60">当前关联 {linkedTasks.length} 条</span>
                      </div>
                    </div>
                    <label className="flex items-center gap-1 text-[11px] text-ink/60">
                      <input
                        type="checkbox"
                        checked={batchDistributeIds.includes(item.id)}
                        onChange={() => toggleBatchSelect(item.id)}
                        className="h-3.5 w-3.5 accent-ink"
                      />
                      批量
                    </label>
                    <button
                      type="button"
                      onPointerDown={(event) => startBreakdownDrag(event, item.id)}
                      onTouchStart={(event) => event.stopPropagation()}
                      className="touch-none rounded-md border border-ink/15 bg-white px-2 py-1 text-[11px] text-ink/70"
                    >
                      拖拽
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openItemDistribute(item.id)}
                      className="rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/75"
                    >
                      分发到计划
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        actions.deleteGoalBreakdownItem(currentGoal.id, item.id);
                        setHint("已删除拆解项。");
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700"
                    >
                      删除
                    </button>
                  </div>

                  {linkedTasks.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {linkedTasks.map((task) => (
                        <li key={task.id} className="rounded-lg border border-ink/10 bg-paper p-2">
                          <p className="text-xs font-medium text-ink">{task.title}</p>
                          <p className="mt-1 text-[11px] text-ink/60">
                            {formatDateLabel(task.dueDate)} · {planTypeLabel(task)} · {task.completed ? "已完成" : "未完成"}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => withdrawDistributedTask(task)}
                              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700"
                            >
                              撤回到拆解池
                            </button>
                            <button
                              type="button"
                              onClick={() => openTaskReassign(task.id)}
                              className="rounded border border-ink/15 bg-white px-2 py-1 text-[11px] text-ink/70"
                            >
                              改派
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink/60">还没有拆解项，先添加 1 项可执行动作。</p>
        )}

        {undoAction && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-800">{undoAction.message} 12 秒内可撤销。</p>
            <button
              type="button"
              onClick={undoLatestAction}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs text-amber-800"
            >
              撤销
            </button>
          </div>
        )}

        {hint && <p className="mt-3 text-xs text-ink/60">{hint}</p>}
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title">时间安排</h3>
          <span className="badge border-ink/15 bg-white text-ink/65">{sessions.length} 条 session</span>
        </div>

        {sessions.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {sessions.map((session) => (
              <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{session.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="badge border-ink/15 bg-white text-ink/65">{sessionStatusLabel[session.status]}</span>
                    <span
                      className={`badge ${
                        session.syncedToCalendar ? "border-sky/40 bg-sky/15 text-ink/75" : "border-ink/15 bg-white text-ink/60"
                      }`}
                    >
                      {session.syncedToCalendar ? "已同步日历" : "未同步日历"}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink/70">
                  {formatDateLabel(session.date)} · {session.startTime} - {session.endTime} · {session.durationMinutes} 分钟
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink/60">暂无分发记录，点击“分发到计划”把目标拆解到本周或具体日期。</p>
        )}
      </section>

      <section className="card-surface p-4 md:p-5">
        <h3 className="section-title">SMART 内容</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80"><strong>S:</strong> {currentGoal.smart.specific || "未填写"}</p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80"><strong>M:</strong> {currentGoal.smart.measurable || "未填写"}</p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80"><strong>A:</strong> {currentGoal.smart.achievable || "未填写"}</p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80"><strong>R:</strong> {currentGoal.smart.relevant || "未填写"}</p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80 md:col-span-2"><strong>T:</strong> {currentGoal.smart.timeBound || "未填写"}</p>
        </div>
      </section>

      <GoalDistributeSheet
        open={showDistributeSheet}
        goal={currentGoal}
        initialTitle={reassignTask ? reassignTask.title : distributeItem?.title}
        batchItems={selectedBatchItems.length > 0 ? selectedBatchItems : undefined}
        confirmLabel={reassignTask ? "确认改派" : selectedBatchItems.length > 0 ? "确认批量分发" : "确认分发"}
        onSubmitPlan={
          reassignTask
            ? (payload) => {
                setUndoAction({
                  type: "reassign",
                  taskId: reassignTask.id,
                  taskTitle: reassignTask.title,
                  previousPlanType: reassignTask.planType,
                  previousDueDate: reassignTask.dueDate,
                  previousSchedule: taskScheduleSnapshot(reassignTask),
                  expireAt: Date.now() + 12000,
                  message: `已改派任务「${reassignTask.title}」。`,
                });
                actions.reassignGoalDistributedTask(reassignTask.id, payload.planType, payload.dueDate, payload.schedule);
              }
            : distributeItem
              ? (payload) => {
                  actions.distributeGoalTaskToPlan(
                    currentGoal.id,
                    payload.title,
                    payload.planType,
                    payload.dueDate,
                    payload.schedule,
                    distributeItem.id,
                  );
                }
              : undefined
        }
        onClose={() => {
          setShowDistributeSheet(false);
          setDistributeItemId(null);
          setReassignTaskId(null);
        }}
        onDistributed={(message) => {
          if (reassignTask) {
            setHint(`已改派任务「${reassignTask.title}」。可在下方一键撤销。`);
          } else if (selectedBatchItems.length > 0) {
            setHint(`已批量分发 ${selectedBatchItems.length} 项。`);
            setBatchDistributeIds([]);
          } else if (distributeItem) {
            setHint(`拆解项「${distributeItem.title}」${message}`);
          } else {
            setHint(message);
          }
          setDistributeItemId(null);
          setReassignTaskId(null);
        }}
      />

      {quickDistributeItem && (
        <div className="fixed inset-0 z-50 flex items-end">
          <button
            type="button"
            aria-label="关闭快捷分发"
            onClick={() => setQuickDistributeItemId(null)}
            className="absolute inset-0 bg-black/35"
          />
          <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
            <p className="text-sm font-semibold text-ink">快捷分发：{quickDistributeItem.title}</p>
            <p className="mt-1 text-xs text-ink/60">长按触发后可一键分发到常用目标日期。</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickDistribute("today")}
                className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75"
              >
                分发到今日
              </button>
              <button
                type="button"
                onClick={() => quickDistribute("tomorrow")}
                className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75"
              >
                分发到明日
              </button>
              <button
                type="button"
                onClick={() => quickDistribute("weekly")}
                className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75"
              >
                分发到本周
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
