"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { todayKey } from "@/lib/date";
import { Task } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

interface FocusHomePanelProps {
  defaultTaskId?: string;
}

type TimerStatus = "idle" | "running" | "paused";
type FinishResult = "completed" | "not_completed";

interface TaskOption {
  task: Task;
  sourceLabel: string;
}

const PLAN_ORDER: Record<Task["planType"], number> = {
  today_top: 0,
  today_secondary: 1,
  today_other: 2,
  weekly: 3,
};

function formatMinutes(value: number): string {
  if (value <= 0) {
    return "0 分钟";
  }
  return `${Math.round(value)} 分钟`;
}

function formatTimer(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mm = `${Math.floor(safe / 60)}`.padStart(2, "0");
  const ss = `${safe % 60}`.padStart(2, "0");
  return `${mm}:${ss}`;
}

function toSafeDateMs(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRemainingSecondsFromStart(startedAt: string, plannedMinutes: number, nowMs = Date.now()): number {
  const startedAtMs = toSafeDateMs(startedAt);
  const totalSeconds = Math.max(1, Math.round(plannedMinutes)) * 60;
  if (startedAtMs === null) {
    return totalSeconds;
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  return Math.max(0, totalSeconds - elapsedSeconds);
}

function getElapsedMinutesFromStart(startedAt: string, plannedMinutes: number, nowMs = Date.now()): number {
  const safePlanned = Math.max(1, Math.round(plannedMinutes));
  const startedAtMs = toSafeDateMs(startedAt);
  if (startedAtMs === null) {
    return safePlanned;
  }

  const elapsedMinutes = Math.max(1, Math.floor((nowMs - startedAtMs) / 60000));
  return Math.min(safePlanned, elapsedMinutes);
}

function planSourceLabel(task: Task): string {
  if (task.planType === "today_top") {
    return "今日最重要";
  }
  if (task.planType === "today_secondary") {
    return "今日次重要";
  }
  if (task.planType === "weekly") {
    return "本周任务";
  }
  return task.isScheduled ? "日程安排" : "未安排任务";
}

function appendLine(origin: string, text: string): string {
  const clean = text.trim();
  if (!clean) {
    return origin;
  }
  if (!origin.trim()) {
    return clean;
  }
  if (origin.includes(clean)) {
    return origin;
  }
  return `${origin.trim()}\n- ${clean}`;
}

export function FocusHomePanel({ defaultTaskId }: FocusHomePanelProps) {
  const { state, actions } = useAppStore();
  const today = todayKey();

  const todayTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.dueDate === today)
        .sort((a, b) => {
          const planDiff = PLAN_ORDER[a.planType] - PLAN_ORDER[b.planType];
          if (planDiff !== 0) {
            return planDiff;
          }
          if (a.isScheduled !== b.isScheduled) {
            return a.isScheduled ? -1 : 1;
          }
          return a.order - b.order;
        }),
    [state.tasks, today],
  );

  const taskOptions = useMemo(() => {
    const optionMap = new Map<string, TaskOption>();
    todayTasks.forEach((task) => {
      optionMap.set(task.id, {
        task,
        sourceLabel: planSourceLabel(task),
      });
    });
    return Array.from(optionMap.values());
  }, [todayTasks]);

  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [focusGoal, setFocusGoal] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [customMinutesInput, setCustomMinutesInput] = useState("30");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const [endsAtMs, setEndsAtMs] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const restoredSessionRef = useRef<string | null>(null);

  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [finishResult, setFinishResult] = useState<FinishResult>("completed");
  const [markTaskProgress, setMarkTaskProgress] = useState(true);
  const [writeToReview, setWriteToReview] = useState(false);
  const [continueNextRound, setContinueNextRound] = useState(false);
  const [notCompletedReason, setNotCompletedReason] = useState("");

  const selectedTaskOption = taskOptions.find((option) => option.task.id === selectedTaskId);

  const todaySessions = useMemo(
    () =>
      state.focusSessions
        .filter((session) => session.createdAt === today || session.startedAt.startsWith(today))
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [state.focusSessions, today],
  );

  const elapsedCurrentRoundMinutes = Math.max(0, Math.round((timerMinutes * 60 - remainingSeconds) / 60));

  const todayFocusedMinutes = useMemo(() => {
    const finishedMinutes = todaySessions.reduce((total, session) => total + session.actualMinutes, 0);
    if (timerStatus === "idle") {
      return finishedMinutes;
    }
    return finishedMinutes + elapsedCurrentRoundMinutes;
  }, [elapsedCurrentRoundMinutes, timerStatus, todaySessions]);

  const todayPomodoroCount = useMemo(
    () => todaySessions.filter((session) => session.status === "completed").length,
    [todaySessions],
  );
  const focusSuggestion = useMemo(() => {
    if (todaySessions.length === 0) {
      return "先完成一轮 25 分钟专注，建立执行启动感。";
    }
    const completed = todaySessions.filter((session) => session.status === "completed").length;
    const completionRate = completed / todaySessions.length;
    if (completionRate < 0.5) {
      return "未完成轮次偏多，下一轮建议先缩短目标范围，再开始计时。";
    }
    if (completionRate < 0.8) {
      return "完成率稳定，建议下一轮优先处理最重要任务，避免切换任务。";
    }
    return "专注状态很好，可以继续保持当前节奏，完成后及时写一句复盘。";
  }, [todaySessions]);

  useEffect(() => {
    if (!defaultTaskId) {
      return;
    }
    if (taskOptions.some((option) => option.task.id === defaultTaskId)) {
      setSelectedTaskId(defaultTaskId);
    }
  }, [defaultTaskId, taskOptions]);

  useEffect(() => {
    if (timerStatus === "idle") {
      setRemainingSeconds(timerMinutes * 60);
    }
  }, [timerMinutes, timerStatus]);

  useEffect(() => {
    if (timerStatus !== "running" || endsAtMs === null) {
      return;
    }

    const syncRemaining = () => {
      const seconds = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds <= 0) {
        setTimerStatus("paused");
        setEndsAtMs(null);
        setFinishResult("completed");
        setShowFinishSheet(true);
      }
    };

    syncRemaining();

    const timer = window.setInterval(syncRemaining, 1000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncRemaining();
      }
    };

    window.addEventListener("focus", syncRemaining);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncRemaining);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [endsAtMs, timerStatus]);

  useEffect(() => {
    if (timerStatus !== "idle" || activeSessionId || showFinishSheet) {
      return;
    }

    const running = state.focusSessions.find((session) => session.status === "running");
    if (!running) {
      return;
    }

    const planned = Math.max(1, Math.round(running.plannedMinutes));
    const remaining = getRemainingSecondsFromStart(running.startedAt, planned);

    setActiveSessionId(running.id);
    setTimerMinutes(planned);
    setCustomMinutesInput(String(planned));
    setRemainingSeconds(remaining);

    if (remaining <= 0) {
      setEndsAtMs(null);
      setTimerStatus("paused");
      setFinishResult("completed");
      setShowFinishSheet(true);
      setHint("检测到你离开期间番茄钟已到时，请确认结束记录。");
    } else {
      setEndsAtMs(Date.now() + remaining * 1000);
      setTimerStatus("running");
      if (restoredSessionRef.current !== running.id) {
        setHint("已恢复进行中的番茄钟。");
      }
    }

    restoredSessionRef.current = running.id;
  }, [activeSessionId, showFinishSheet, state.focusSessions, timerStatus]);

  useEffect(() => {
    if (timerStatus === "idle" || activeSessionId) {
      return;
    }
    const running = state.focusSessions.find((session) => session.status === "running");
    if (running) {
      setActiveSessionId(running.id);
    }
  }, [activeSessionId, state.focusSessions, timerStatus]);

  function startFocus() {
    if (timerStatus === "running") {
      return;
    }

    if (timerStatus === "idle") {
      const running = state.focusSessions.find((session) => session.status === "running");
      if (running) {
        const actual = getElapsedMinutesFromStart(running.startedAt, running.plannedMinutes);
        actions.finishFocusSession(running.id, "cancelled", actual);
      }

      const task = selectedTaskOption?.task;
      actions.startFocusSession("pomodoro", timerMinutes, task?.id, task?.goalId);
      setActiveSessionId(null);
      setRemainingSeconds(timerMinutes * 60);
      setEndsAtMs(Date.now() + timerMinutes * 60 * 1000);
      setHint("已开始专注，保持单任务执行。");
    } else {
      setEndsAtMs(Date.now() + Math.max(1, remainingSeconds) * 1000);
      setHint("已恢复专注。");
    }

    setTimerStatus("running");
  }

  function pauseFocus() {
    if (timerStatus !== "running") {
      return;
    }
    setTimerStatus("paused");
    setEndsAtMs(null);
    setHint("已暂停，可随时继续。");
  }

  function openFinishSheet(result: FinishResult) {
    if (timerStatus === "idle") {
      return;
    }
    setFinishResult(result);
    setShowFinishSheet(true);
    setTimerStatus("paused");
    setEndsAtMs(null);
  }

  function closeCurrentSessionAsCancelled() {
    const runningId = activeSessionId ?? state.focusSessions.find((session) => session.status === "running")?.id;
    if (!runningId) {
      return;
    }
    const runningSession = state.focusSessions.find((session) => session.id === runningId);
    const elapsedMinutes = runningSession
      ? getElapsedMinutesFromStart(runningSession.startedAt, runningSession.plannedMinutes)
      : Math.max(1, elapsedCurrentRoundMinutes || timerMinutes);
    actions.finishFocusSession(runningId, "cancelled", elapsedMinutes);
  }

  function resetFocus() {
    if (timerStatus !== "idle") {
      closeCurrentSessionAsCancelled();
    }

    setShowFinishSheet(false);
    setRemainingSeconds(timerMinutes * 60);
    setTimerStatus("idle");
    setEndsAtMs(null);
    setActiveSessionId(null);
    setNotCompletedReason("");
    setHint("已重置本轮专注。");
  }

  function applyCustomMinutes() {
    const value = Number(customMinutesInput);
    if (!Number.isFinite(value) || value <= 0) {
      setHint("请输入大于 0 的分钟数。");
      return;
    }

    const safeMinutes = Math.min(240, Math.max(5, Math.round(value)));
    setTimerMinutes(safeMinutes);
    if (timerStatus === "idle") {
      setRemainingSeconds(safeMinutes * 60);
    }
    setHint(`已设置 ${safeMinutes} 分钟。`);
  }

  function confirmFinish() {
    const sessionId = activeSessionId ?? state.focusSessions.find((session) => session.status === "running")?.id;
    const runningSession = sessionId ? state.focusSessions.find((session) => session.id === sessionId) : undefined;
    const elapsedMinutes = runningSession
      ? getElapsedMinutesFromStart(runningSession.startedAt, runningSession.plannedMinutes)
      : Math.max(1, elapsedCurrentRoundMinutes || timerMinutes);

    if (sessionId) {
      actions.finishFocusSession(sessionId, finishResult === "completed" ? "completed" : "interrupted", elapsedMinutes);
    }

    const task = selectedTaskOption?.task;
    if (markTaskProgress && finishResult === "completed" && task && !task.completed) {
      actions.toggleTask(task.id);
    }

    if (writeToReview) {
      const existingReview = state.reviews.find((entry) => entry.date === today);
      const wins = existingReview?.wins ?? "";
      const wasted = existingReview?.wastedTime ?? "";
      const improve = existingReview?.improveOneThing ?? "";
      const taskTitle = task?.title || focusGoal.trim() || "一次专注";

      if (finishResult === "completed") {
        actions.addReview(appendLine(wins, `完成专注：${taskTitle}（${elapsedMinutes} 分钟）`), wasted, improve);
      } else {
        const reason = notCompletedReason.trim() || "中途分心";
        actions.addReview(wins, appendLine(wasted, `专注未完成：${taskTitle}（${reason}）`), improve);
      }
    }

    setShowFinishSheet(false);
    setNotCompletedReason("");
    setActiveSessionId(null);

    if (continueNextRound) {
      const currentTask = selectedTaskOption?.task;
      actions.startFocusSession("pomodoro", timerMinutes, currentTask?.id, currentTask?.goalId);
      setRemainingSeconds(timerMinutes * 60);
      setTimerStatus("running");
      setEndsAtMs(Date.now() + timerMinutes * 60 * 1000);
      setContinueNextRound(false);
      setHint("已开始下一轮番茄钟。");
      return;
    }

    setTimerStatus("idle");
    setEndsAtMs(null);
    setRemainingSeconds(timerMinutes * 60);
    setHint(finishResult === "completed" ? "本轮专注已完成。" : "本轮专注已结束。");
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <h3 className="section-title">专注摘要</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">今日已专注</p>
            <p className="mt-1 text-xl font-semibold text-ink">{formatMinutes(todayFocusedMinutes)}</p>
          </article>
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">今日完成番茄</p>
            <p className="mt-1 text-xl font-semibold text-ink">{todayPomodoroCount} 次</p>
          </article>
        </div>
        <p className="mt-3 rounded-xl border border-sky/35 bg-sky/10 px-3 py-2 text-xs text-ink/75">专注反馈：{focusSuggestion}</p>
      </section>

      <section className="card-surface p-4">
        <h3 className="section-title">番茄钟</h3>

        <div className="mt-3 rounded-2xl border border-ink/10 bg-white p-4 text-center">
          <p className="text-xs text-ink/55">
            当前状态：{timerStatus === "running" ? "专注中" : timerStatus === "paused" ? "已暂停" : "待开始"}
          </p>
          <p className="mt-2 text-5xl font-semibold tracking-wider text-ink tabular-nums break-all">{formatTimer(remainingSeconds)}</p>
          <p className="mt-2 text-xs text-ink/60">
            当前关联任务：{selectedTaskOption ? selectedTaskOption.task.title : "未关联任务"}
          </p>
          <p className="mt-1 text-xs text-ink/55">所属模块：{selectedTaskOption?.sourceLabel ?? "未设置"}</p>
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-xs text-ink/60">选择关联任务</label>
          <select
            value={selectedTaskId}
            onChange={(event) => setSelectedTaskId(event.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">不关联任务</option>
            {taskOptions.map((option) => (
              <option key={option.task.id} value={option.task.id}>
                {option.sourceLabel} · {option.task.title}
              </option>
            ))}
          </select>
          {taskOptions.length === 0 && (
            <p className="text-xs text-ink/55">
              今天还没有可选任务，先去
              <Link href="/plan?tab=day" className="mx-1 underline">
                日计划
              </Link>
              添加任务。
            </p>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-xs text-ink/60">本次专注目标</label>
          <input
            value={focusGoal}
            onChange={(event) => setFocusGoal(event.target.value)}
            placeholder="例如：完成高数错题第 3-8 题"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTimerMinutes(25)}
            className={`rounded-xl border px-3 py-3 text-sm ${
              timerMinutes === 25 ? "border-mint bg-mint/20 text-ink" : "border-ink/15 bg-white text-ink/70"
            }`}
          >
            25 分钟
          </button>
          <button
            type="button"
            onClick={() => setTimerMinutes(45)}
            className={`rounded-xl border px-3 py-3 text-sm ${
              timerMinutes === 45 ? "border-mint bg-mint/20 text-ink" : "border-ink/15 bg-white text-ink/70"
            }`}
          >
            45 分钟
          </button>
          <button type="button" onClick={applyCustomMinutes} className="rounded-xl border border-ink/15 bg-white px-3 py-3 text-sm text-ink/70">
            自定义
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          <input
            value={customMinutesInput}
            onChange={(event) => setCustomMinutesInput(event.target.value)}
            inputMode="numeric"
            placeholder="输入分钟"
            className="flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <span className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink/60">当前 {timerMinutes} 分钟</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={startFocus} className="rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white">
            开始
          </button>
          <button type="button" onClick={pauseFocus} className="rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink/75">
            暂停
          </button>
          <button
            type="button"
            onClick={() => openFinishSheet(remainingSeconds === 0 ? "completed" : "not_completed")}
            className="rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink/75"
          >
            结束
          </button>
          <button type="button" onClick={resetFocus} className="rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink/75">
            重置
          </button>
        </div>
      </section>

      <section className="card-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">今日专注记录</h3>
          <Link href="/profile?tab=overview" className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70">
            查看全部专注记录
          </Link>
        </div>

        <ul className="mt-3 space-y-2">
          {todaySessions.slice(0, 6).map((session) => {
            const taskTitle = session.taskId ? state.tasks.find((task) => task.id === session.taskId)?.title : "";
            return (
              <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-sm font-medium text-ink">{taskTitle || "未关联任务"}</p>
                <p className="mt-1 text-xs text-ink/60">
                  {session.status === "completed" ? "已完成" : session.status === "running" ? "进行中" : "未完成"} · 专注
                  {formatMinutes(session.actualMinutes || session.plannedMinutes)}
                </p>
              </li>
            );
          })}
        </ul>

        {todaySessions.length === 0 && <p className="mt-2 text-sm text-ink/60">今天还没有专注记录，先开始一轮番茄钟。</p>}
      </section>

      {hint && <p className="px-1 text-center text-xs text-ink/65">{hint}</p>}

      {showFinishSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <button type="button" onClick={() => setShowFinishSheet(false)} className="absolute inset-0 bg-black/35" />
          <section className="relative z-10 w-full rounded-t-3xl border border-ink/10 bg-paper p-4 shadow-card md:mx-auto md:max-w-xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
            <h4 className="text-base font-semibold text-ink">专注结束反馈</h4>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFinishResult("completed")}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  finishResult === "completed" ? "border-mint bg-mint/20 text-ink" : "border-ink/15 bg-white text-ink/70"
                }`}
              >
                已完成
              </button>
              <button
                type="button"
                onClick={() => setFinishResult("not_completed")}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  finishResult === "not_completed" ? "border-mint bg-mint/20 text-ink" : "border-ink/15 bg-white text-ink/70"
                }`}
              >
                未完成
              </button>
            </div>

            {finishResult === "not_completed" && (
              <input
                value={notCompletedReason}
                onChange={(event) => setNotCompletedReason(event.target.value)}
                placeholder="未完成原因（可选）"
                className="mt-3 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              />
            )}

            <div className="mt-3 space-y-2 text-sm text-ink/75">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={markTaskProgress}
                  onChange={(event) => setMarkTaskProgress(event.target.checked)}
                  className="h-4 w-4 accent-mint"
                />
                记录到任务推进
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={writeToReview}
                  onChange={(event) => setWriteToReview(event.target.checked)}
                  className="h-4 w-4 accent-mint"
                />
                写入今日复盘
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={continueNextRound}
                  onChange={(event) => setContinueNextRound(event.target.checked)}
                  className="h-4 w-4 accent-mint"
                />
                继续下一轮番茄钟
              </label>
            </div>

            <button type="button" onClick={confirmFinish} className="mt-4 w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
              确认并保存
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
