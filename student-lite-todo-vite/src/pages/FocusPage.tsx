import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { clamp, todayKey } from "../lib/date";
import { FocusMode } from "../types";
import { useAppData } from "../store/useAppData";
import { useToast } from "../components/ToastProvider";

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hour = Math.floor(safe / 3600);
  const minute = Math.floor((safe % 3600) / 60);
  const second = safe % 60;
  if (hour > 0) {
    return `${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}:${`${second}`.padStart(2, "0")}`;
  }
  return `${`${minute}`.padStart(2, "0")}:${`${second}`.padStart(2, "0")}`;
}

export function FocusPage() {
  const { todos, activeFocus, focusSessions, startFocus, pauseFocus, resumeFocus, endFocus } = useAppData();
  const { pushToast } = useToast();
  const [search] = useSearchParams();

  const todayTodos = useMemo(() => todos.filter((todo) => todo.dueDate === todayKey()), [todos]);

  const [mode, setMode] = useState<FocusMode>("countdown");
  const [minutes, setMinutes] = useState(25);
  const [selectedTodoId, setSelectedTodoId] = useState(search.get("todo") ?? "");

  useEffect(() => {
    const todoId = search.get("todo") ?? "";
    setSelectedTodoId(todoId);
  }, [search]);

  useEffect(() => {
    if (!activeFocus || activeFocus.mode !== "countdown") {
      return;
    }

    if (activeFocus.elapsedSeconds < activeFocus.plannedSeconds) {
      return;
    }

    void endFocus("completed").then(() => {
      pushToast("专注完成，待办状态已同步");
    });
  }, [activeFocus, endFocus, pushToast]);

  const elapsed = activeFocus?.elapsedSeconds ?? 0;
  const remaining =
    activeFocus?.mode === "countdown"
      ? clamp((activeFocus?.plannedSeconds ?? 0) - elapsed, 0, Number.MAX_SAFE_INTEGER)
      : 0;

  const displayed = activeFocus?.mode === "countdown" ? formatTime(remaining) : formatTime(elapsed);

  const selectedTodoTitle = selectedTodoId ? todos.find((todo) => todo.id === selectedTodoId)?.title : undefined;

  async function handleStart() {
    await startFocus(mode, minutes, selectedTodoId || undefined);
    pushToast("计时已开始");
  }

  async function handlePause() {
    await pauseFocus();
    pushToast("已暂停");
  }

  async function handleResume() {
    await resumeFocus();
    pushToast("继续计时");
  }

  async function handleEnd() {
    await endFocus("completed");
    pushToast("计时结束，已同步待办状态");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-brand/20 bg-white p-4 text-center">
        <p className="text-xs font-semibold text-brand-dark">{activeFocus?.mode === "countdown" ? "倒计时" : "正计时"}</p>
        <p className="mt-3 text-5xl font-semibold tracking-wide text-brand-dark" aria-live="polite">
          {displayed}
        </p>
        <p className="mt-2 text-xs text-slate-600">当前关联待办：{selectedTodoTitle ?? "未关联"}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={Boolean(activeFocus)}
            className="min-h-12 rounded-xl bg-brand px-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            启动计时
          </button>
          <button
            type="button"
            onClick={activeFocus?.running ? handlePause : handleResume}
            disabled={!activeFocus}
            className="min-h-12 rounded-xl border border-brand/30 px-3 text-sm font-semibold text-brand-dark disabled:opacity-40"
          >
            {activeFocus?.running ? "暂停" : "继续"}
          </button>
          <button
            type="button"
            onClick={handleEnd}
            disabled={!activeFocus}
            className="min-h-12 rounded-xl border border-warn/50 px-3 text-sm font-semibold text-warn disabled:opacity-40"
          >
            结束
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-brand/20 bg-white p-3">
        <h2 className="text-sm font-semibold text-brand-dark">计时设置</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as FocusMode)}
            aria-label="计时模式"
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
            disabled={Boolean(activeFocus)}
          >
            <option value="countdown">倒计时</option>
            <option value="stopwatch">正计时</option>
          </select>

          <input
            type="number"
            min={5}
            max={180}
            value={minutes}
            onChange={(event) => setMinutes(clamp(Number(event.target.value) || 25, 5, 180))}
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
            disabled={mode !== "countdown" || Boolean(activeFocus)}
            aria-label="倒计时分钟"
          />

          <select
            value={selectedTodoId}
            onChange={(event) => setSelectedTodoId(event.target.value)}
            aria-label="关联待办"
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
            disabled={Boolean(activeFocus)}
          >
            <option value="">不关联待办</option>
            {todayTodos.map((todo) => (
              <option key={todo.id} value={todo.id}>
                {todo.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-brand/20 bg-white p-3">
        <h2 className="text-sm font-semibold text-brand-dark">最近专注记录</h2>
        <ul className="mt-2 space-y-2">
          {focusSessions.slice(0, 5).map((session) => (
            <li key={session.id} className="rounded-xl bg-brand-soft px-3 py-2 text-sm">
              {session.mode === "countdown" ? "倒计时" : "正计时"} · {formatTime(session.elapsedSeconds)} · {session.status}
            </li>
          ))}
        </ul>
        {focusSessions.length === 0 && <p className="mt-2 text-sm text-slate-600">还没有专注记录。</p>}
      </section>
    </div>
  );
}
