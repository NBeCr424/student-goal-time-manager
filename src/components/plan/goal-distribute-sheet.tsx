"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, fromDateKey, startOfWeek, todayKey, toDateKey } from "@/lib/date";
import { Goal, TaskPlanType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type PlanLevel = "weekly" | "daily";
type DailyTarget = "today" | "tomorrow" | "custom";
type DurationChoice = 30 | 45 | 60 | "custom";

export interface GoalDistributeSourceItem {
  id?: string;
  title: string;
}

export interface GoalDistributeSubmitPayload {
  title: string;
  planType: TaskPlanType;
  dueDate: string;
  schedule?: { startTime?: string; endTime?: string; durationMinutes?: number };
  sourceItemId?: string;
}

interface GoalDistributeSheetProps {
  open: boolean;
  goal: Goal | null;
  initialTitle?: string;
  batchItems?: GoalDistributeSourceItem[];
  confirmLabel?: string;
  onClose: () => void;
  onDistributed?: (message: string) => void;
  onSubmitPlan?: (payload: GoalDistributeSubmitPayload) => void;
}

const DURATION_OPTIONS: Array<Exclude<DurationChoice, "custom">> = [30, 45, 60];

function toMinuteOfDay(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function inferTaskDuration(startTime?: string, endTime?: string, durationMinutes?: number): number {
  if (durationMinutes && durationMinutes > 0) {
    return durationMinutes;
  }
  if (startTime && endTime) {
    return Math.max(15, toMinuteOfDay(endTime) - toMinuteOfDay(startTime));
  }
  return 60;
}

export function GoalDistributeSheet({
  open,
  goal,
  initialTitle,
  batchItems,
  confirmLabel,
  onClose,
  onDistributed,
  onSubmitPlan,
}: GoalDistributeSheetProps) {
  const { state, actions } = useAppStore();

  const today = todayKey();
  const tomorrow = toDateKey(addDays(fromDateKey(today), 1));
  const currentWeekEnd = toDateKey(addDays(startOfWeek(fromDateKey(today)), 6));

  const [title, setTitle] = useState("");
  const [planLevel, setPlanLevel] = useState<PlanLevel | null>(null);
  const [dailyTarget, setDailyTarget] = useState<DailyTarget>("today");
  const [customDate, setCustomDate] = useState(today);
  const [weeklyDate, setWeeklyDate] = useState(currentWeekEnd);
  const [durationChoice, setDurationChoice] = useState<DurationChoice>(45);
  const [customDuration, setCustomDuration] = useState(60);
  const [includeTimeline, setIncludeTimeline] = useState(false);
  const [includeTimeSlot, setIncludeTimeSlot] = useState(false);
  const [timeSlot, setTimeSlot] = useState("");
  const [error, setError] = useState("");

  const sourceItems = useMemo(
    () => (batchItems ?? []).filter((item) => item.title.trim().length > 0),
    [batchItems],
  );

  const durationMinutes = useMemo(() => {
    if (durationChoice === "custom") {
      return Math.max(15, Number(customDuration) || 15);
    }
    return durationChoice;
  }, [customDuration, durationChoice]);

  const distributeCountPreview = useMemo(() => {
    if (sourceItems.length > 1) {
      return sourceItems.length;
    }
    if (sourceItems.length === 1) {
      const singleTitle = title.trim();
      return singleTitle || sourceItems[0].title.trim() ? 1 : 0;
    }
    return title.trim() ? 1 : 0;
  }, [sourceItems, title]);

  const selectedDueDate = useMemo(() => {
    if (planLevel === "weekly") {
      return weeklyDate.trim() || currentWeekEnd;
    }
    if (planLevel === "daily") {
      if (dailyTarget === "today") {
        return today;
      }
      if (dailyTarget === "tomorrow") {
        return tomorrow;
      }
      return customDate.trim();
    }
    return "";
  }, [customDate, currentWeekEnd, dailyTarget, planLevel, today, tomorrow, weeklyDate]);

  const loadReminder = useMemo(() => {
    if (!selectedDueDate || !planLevel) {
      return null;
    }

    const matchedTasks =
      planLevel === "weekly"
        ? state.tasks.filter((task) => task.planType === "weekly" && task.dueDate === selectedDueDate)
        : state.tasks.filter((task) => task.planType !== "weekly" && task.dueDate === selectedDueDate);

    const currentMinutes = matchedTasks.reduce(
      (sum, task) => sum + inferTaskDuration(task.startTime, task.endTime, task.durationMinutes),
      0,
    );
    const incomingMinutes = distributeCountPreview * durationMinutes;
    const projectedMinutes = currentMinutes + incomingMinutes;

    return {
      taskCount: matchedTasks.length,
      currentHours: (currentMinutes / 60).toFixed(1),
      incomingHours: (incomingMinutes / 60).toFixed(1),
      projectedHours: (projectedMinutes / 60).toFixed(1),
      distributeCount: distributeCountPreview,
      tone:
        projectedMinutes >= 8 * 60
          ? "border-red-200 bg-red-50 text-red-700"
          : projectedMinutes >= 5 * 60
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-mint/45 bg-mint/15 text-ink/75",
      hint:
        projectedMinutes >= 8 * 60
          ? "分发后负载偏高，建议减少本次分发项或改到其他日期。"
          : projectedMinutes >= 5 * 60
            ? "分发后负载中高，建议确认优先级后再提交。"
            : "分发后负载可控，可继续执行。",
    };
  }, [distributeCountPreview, durationMinutes, planLevel, selectedDueDate, state.tasks]);

  useEffect(() => {
    if (!open || !goal) {
      return;
    }

    const preferredTitle = sourceItems.length > 0 ? sourceItems[0].title : initialTitle?.trim() || goal.title;
    setTitle(preferredTitle);
    setPlanLevel(null);
    setDailyTarget("today");
    setCustomDate(today);
    setWeeklyDate(currentWeekEnd);
    setDurationChoice(45);
    setCustomDuration(60);
    setIncludeTimeline(false);
    setIncludeTimeSlot(false);
    setTimeSlot("");
    setError("");
  }, [currentWeekEnd, goal, initialTitle, open, sourceItems, today]);

  if (!open || !goal) {
    return null;
  }
  const currentGoal = goal;

  function handleDistribute() {
    const singleTitle = title.trim();
    const preparedItems =
      sourceItems.length > 1
        ? sourceItems
            .map((item) => ({ id: item.id, title: item.title.trim() }))
            .filter((item) => item.title.length > 0)
        : sourceItems.length === 1
          ? [
              {
                id: sourceItems[0].id,
                title: singleTitle || sourceItems[0].title.trim(),
              },
            ].filter((item) => item.title.length > 0)
          : singleTitle
            ? [{ id: undefined, title: singleTitle }]
            : [];

    if (preparedItems.length === 0) {
      setError("请先填写要分发的内容。");
      return;
    }
    if (!planLevel) {
      setError("请先选择分发层级。");
      return;
    }

    if (planLevel === "daily" && includeTimeline) {
      if (!includeTimeSlot) {
        setError("勾选加入时间轴后，请同时勾选“加入具体时段”。");
        return;
      }
      if (!timeSlot.trim()) {
        setError("请选择具体时段。");
        return;
      }
    }

    if (!selectedDueDate) {
      setError("请选择具体日期。");
      return;
    }

    const schedule =
      planLevel === "daily" && includeTimeline && includeTimeSlot
        ? { startTime: timeSlot, durationMinutes }
        : { durationMinutes };

    preparedItems.forEach((item) => {
      const payload: GoalDistributeSubmitPayload = {
        title: item.title,
        planType: planLevel === "weekly" ? "weekly" : "today_other",
        dueDate: selectedDueDate,
        schedule,
        sourceItemId: item.id,
      };

      if (onSubmitPlan) {
        onSubmitPlan(payload);
      } else {
        actions.distributeGoalTaskToPlan(
          currentGoal.id,
          payload.title,
          payload.planType,
          payload.dueDate,
          payload.schedule,
          payload.sourceItemId,
        );
      }
    });

    const destinationLabel =
      planLevel === "weekly"
        ? `本周计划（${selectedDueDate}）`
        : dailyTarget === "today"
          ? "日计划（今日）"
          : dailyTarget === "tomorrow"
            ? "日计划（明日）"
            : `日计划（${selectedDueDate}）`;

    const message =
      preparedItems.length > 1
        ? `已批量分发 ${preparedItems.length} 项到${destinationLabel}。`
        : `已分发到${destinationLabel}。`;

    onDistributed?.(message);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" aria-label="关闭分发抽屉" onClick={onClose} className="absolute inset-0 bg-black/35" />
      <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-ink">分发到计划</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70"
          >
            关闭
          </button>
        </div>

        <div className="space-y-3">
          {sourceItems.length > 1 ? (
            <div className="rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink/70">
              <p className="font-semibold text-ink">批量分发 {sourceItems.length} 项</p>
              <p className="mt-1">将按拆解项原名称逐项分发，保持你手动选择的层级与日期。</p>
            </div>
          ) : (
            <label className="block text-xs text-ink/65">
              分发内容
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (error) {
                    setError("");
                  }
                }}
                placeholder="例如：完成第 3 章题目练习"
                className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
            </label>
          )}

          <div className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs font-semibold text-ink">第一步：选择分发层级</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlanLevel("weekly");
                  setIncludeTimeline(false);
                  setIncludeTimeSlot(false);
                  setTimeSlot("");
                  setError("");
                }}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  planLevel === "weekly" ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/75"
                }`}
              >
                分发到本周计划
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanLevel("daily");
                  setError("");
                }}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  planLevel === "daily" ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/75"
                }`}
              >
                分发到日计划
              </button>
            </div>
          </div>

          {planLevel === "daily" && (
            <div className="rounded-xl border border-ink/10 bg-white p-3">
              <p className="text-xs font-semibold text-ink">第二步：选择日计划日期</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDailyTarget("today")}
                  className={`rounded-xl border px-2 py-2 text-xs ${
                    dailyTarget === "today" ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/75"
                  }`}
                >
                  今日
                </button>
                <button
                  type="button"
                  onClick={() => setDailyTarget("tomorrow")}
                  className={`rounded-xl border px-2 py-2 text-xs ${
                    dailyTarget === "tomorrow" ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/75"
                  }`}
                >
                  明日
                </button>
                <button
                  type="button"
                  onClick={() => setDailyTarget("custom")}
                  className={`rounded-xl border px-2 py-2 text-xs ${
                    dailyTarget === "custom" ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/75"
                  }`}
                >
                  选择日期
                </button>
              </div>
              {dailyTarget === "custom" && (
                <label className="mt-2 block text-xs text-ink/65">
                  具体日期
                  <input
                    type="date"
                    value={customDate}
                    onChange={(event) => setCustomDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                  />
                </label>
              )}
            </div>
          )}

          {planLevel === "weekly" && (
            <label className="block rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink/65">
              分发到本周的日期
              <input
                type="date"
                value={weeklyDate}
                onChange={(event) => setWeeklyDate(event.target.value)}
                className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
            </label>
          )}

          {loadReminder && (
            <div className={`rounded-xl border p-3 text-xs ${loadReminder.tone}`}>
              <p>
                当前已安排 {loadReminder.taskCount} 项，约 {loadReminder.currentHours} 小时；本次预计新增{" "}
                {loadReminder.distributeCount} 项，约 {loadReminder.incomingHours} 小时。
              </p>
              <p className="mt-1">分发后预计约 {loadReminder.projectedHours} 小时。{loadReminder.hint}</p>
            </div>
          )}

          <div className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs font-semibold text-ink">第三步：可选设置</p>
            <p className="mt-1 text-[11px] text-ink/60">分发时长</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDurationChoice(item)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    durationChoice === item ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/70"
                  }`}
                >
                  {item} 分钟
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDurationChoice("custom")}
                className={`rounded-full border px-3 py-1 text-xs ${
                  durationChoice === "custom" ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/70"
                }`}
              >
                自定义
              </button>
            </div>
            {durationChoice === "custom" && (
              <label className="mt-2 block text-xs text-ink/65">
                自定义时长（分钟）
                <input
                  type="number"
                  min={15}
                  step={5}
                  value={customDuration}
                  onChange={(event) => setCustomDuration(Number(event.target.value) || 15)}
                  className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                />
              </label>
            )}

            {planLevel === "daily" ? (
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-xs text-ink/70">
                  <input
                    type="checkbox"
                    checked={includeTimeline}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setIncludeTimeline(checked);
                      if (!checked) {
                        setIncludeTimeSlot(false);
                        setTimeSlot("");
                      }
                    }}
                    className="h-4 w-4 accent-mint"
                  />
                  加入时间轴
                </label>
                {includeTimeline && (
                  <>
                    <label className="flex items-center gap-2 text-xs text-ink/70">
                      <input
                        type="checkbox"
                        checked={includeTimeSlot}
                        onChange={(event) => {
                          setIncludeTimeSlot(event.target.checked);
                          if (!event.target.checked) {
                            setTimeSlot("");
                          }
                        }}
                        className="h-4 w-4 accent-mint"
                      />
                      加入具体时段
                    </label>
                    {includeTimeSlot && (
                      <label className="block text-xs text-ink/65">
                        具体时段
                        <input
                          type="time"
                          value={timeSlot}
                          onChange={(event) => setTimeSlot(event.target.value)}
                          className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                        />
                      </label>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-ink/55">本周计划暂不加入时间轴，可在日计划里继续细化。</p>
            )}
          </div>

          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <p className="text-[11px] text-ink/55">系统不会自动分配，只会按你当前选择进行分发。</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleDistribute}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white"
            >
              {confirmLabel ?? "确认分发"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
