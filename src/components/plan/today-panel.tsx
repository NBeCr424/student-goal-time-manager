"use client";

import { DragEvent, FormEvent, useMemo, useState } from "react";
import {
  buildGoalDeadlineReminderEvents,
  downloadIcsFile,
  exportToICS,
  mapGoalSessionsToCalendarEvents,
  mapTasksToCalendarEvents,
} from "@/lib/calendar-sync";
import { todayKey } from "@/lib/date";
import { Task, TaskPlanType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const GROUPS: Array<{ title: string; planType: TaskPlanType; subtitle: string }> = [
  { title: "今天最重要 1 件", planType: "today_top", subtitle: "必须完成" },
  { title: "次重要 2 件", planType: "today_secondary", subtitle: "优先推进" },
  { title: "其他待办", planType: "today_other", subtitle: "加分项" },
];

const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 30;

function toMinuteOfDay(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function taskDuration(task: Task): number {
  if (task.durationMinutes && task.durationMinutes > 0) {
    return task.durationMinutes;
  }
  if (task.startTime && task.endTime) {
    return Math.max(15, toMinuteOfDay(task.endTime) - toMinuteOfDay(task.startTime));
  }
  return 60;
}

function timelineSlots(): string[] {
  const slots: string[] = [];
  for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      if (hour === TIMELINE_END_HOUR && minute > 0) {
        continue;
      }
      slots.push(`${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`);
    }
  }
  return slots;
}

function labelForTaskType(type: TaskPlanType): string {
  if (type === "today_top") {
    return "最重要";
  }
  if (type === "today_secondary") {
    return "次重要";
  }
  if (type === "today_other") {
    return "其他";
  }
  return "本周";
}

interface TaskGroupProps {
  title: string;
  subtitle: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onEditSchedule: (task: Task) => void;
  onClearSchedule: (taskId: string) => void;
}

function TaskGroup({ title, subtitle, tasks, onToggle, onReorder, onEditSchedule, onClearSchedule }: TaskGroupProps) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        <span className="text-xs text-ink/60">{subtitle}</span>
      </div>

      <ul className="mt-3 space-y-2">
        {tasks.map((task, index) => (
          <li key={task.id} className="rounded-xl border border-ink/10 px-2 py-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
                className="h-4 w-4 accent-mint"
              />
              <p className={`flex-1 text-sm ${task.completed ? "text-ink/50 line-through" : "text-ink"}`}>{task.title}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onReorder(task.id, "up")}
                  disabled={index === 0}
                  className="rounded border border-ink/15 px-2 text-xs text-ink/70 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onReorder(task.id, "down")}
                  disabled={index === tasks.length - 1}
                  className="rounded border border-ink/15 px-2 text-xs text-ink/70 disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink/65">
              {task.isScheduled && task.startTime && task.endTime ? (
                <span className="rounded-full border border-mint/50 bg-mint/15 px-2 py-0.5">
                  {task.startTime} - {task.endTime}
                </span>
              ) : (
                <span className="rounded-full border border-ink/20 bg-white px-2 py-0.5">未安排时间</span>
              )}

              {task.isScheduled && (
                <span
                  className={`rounded-full border px-2 py-0.5 ${
                    task.syncedToCalendar ? "border-sky/50 bg-sky/20 text-ink" : "border-ink/20 bg-white"
                  }`}
                >
                  {task.syncedToCalendar ? "已同步日历" : "未同步日历"}
                </span>
              )}

              <button
                type="button"
                onClick={() => onEditSchedule(task)}
                className="rounded-full border border-ink/20 bg-white px-2 py-0.5"
              >
                {task.isScheduled ? "编辑时间" : "安排时间"}
              </button>

              {task.isScheduled && (
                <button
                  type="button"
                  onClick={() => onClearSchedule(task.id)}
                  className="rounded-full border border-ink/20 bg-white px-2 py-0.5"
                >
                  清除时间
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && <p className="mt-2 text-xs text-ink/55">暂无任务</p>}
      <p className="mt-3 text-[11px] text-ink/50">MVP 先用上下排序按钮，拖动排序可后续补强。</p>
    </article>
  );
}

export function TodayPanel() {
  const { state, actions } = useAppStore();
  const today = todayKey();

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<TaskPlanType>("today_other");
  const [newStartTime, setNewStartTime] = useState("");
  const [newDuration, setNewDuration] = useState(60);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState("18:00");
  const [editDuration, setEditDuration] = useState(60);

  const [slotTime, setSlotTime] = useState("18:00");
  const [slotTaskId, setSlotTaskId] = useState("");
  const [slotDuration, setSlotDuration] = useState(45);

  const [syncHint, setSyncHint] = useState("");

  const todayTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.dueDate === today && task.planType !== "weekly")
        .sort((a, b) => a.order - b.order),
    [state.tasks, today],
  );

  const scheduledTasks = useMemo(
    () => todayTasks.filter((task) => task.isScheduled && task.startTime && task.endTime),
    [todayTasks],
  );

  const unscheduledTasks = useMemo(() => todayTasks.filter((task) => !task.isScheduled), [todayTasks]);

  const doneCount = todayTasks.filter((task) => task.completed).length;

  const slots = useMemo(() => timelineSlots(), []);

  const goalTitleById = useMemo(() => new Map(state.goals.map((goal) => [goal.id, goal.title])), [state.goals]);

  function submitTask(event: FormEvent) {
    event.preventDefault();
    actions.addTask(
      newTitle,
      newType,
      newStartTime
        ? {
            startTime: newStartTime,
            durationMinutes: newDuration,
          }
        : undefined,
    );
    setNewTitle("");
    setNewStartTime("");
    setNewDuration(60);
  }

  function openScheduleEditor(task: Task) {
    setEditingTaskId(task.id);
    setEditStartTime(task.startTime ?? "18:00");
    setEditDuration(taskDuration(task));
  }

  function saveScheduleEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingTaskId) {
      return;
    }
    actions.setTaskSchedule(editingTaskId, editStartTime, undefined, editDuration);
    setEditingTaskId(null);
  }

  function assignSlotTask(event: FormEvent) {
    event.preventDefault();
    if (!slotTaskId) {
      return;
    }
    actions.setTaskSchedule(slotTaskId, slotTime, undefined, slotDuration);
    setSlotTaskId("");
    setSyncHint("已把任务放入时间轴。拖动任务块可以继续微调开始时间。");
  }

  function onDragStart(event: DragEvent<HTMLButtonElement>, taskId: string) {
    event.dataTransfer.setData("text/task-id", taskId);
  }

  function onDropToSlot(event: DragEvent<HTMLDivElement>, time: string) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    if (!taskId) {
      return;
    }

    const task = todayTasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    actions.setTaskSchedule(task.id, time, undefined, taskDuration(task));
    setSyncHint(`已调整开始时间到 ${time}。`);
  }

  function exportTodayTasksToCalendar() {
    const events = mapTasksToCalendarEvents(scheduledTasks);
    if (events.length === 0) {
      setSyncHint("今天还没有已安排时间的任务，先给任务设定时间再导出。");
      return;
    }

    const ics = exportToICS(events, "Today Tasks");
    downloadIcsFile(`today-tasks-${today}.ics`, ics);
    actions.markTasksSyncedToCalendar(events.map((eventItem) => eventItem.sourceId), true);
    setSyncHint(`已导出 ${events.length} 条今日任务到 .ics，可导入 Apple/Google/Outlook 日历。`);
  }

  function exportAllScheduledToCalendar() {
    const taskEvents = mapTasksToCalendarEvents(state.tasks);
    const sessionEvents = mapGoalSessionsToCalendarEvents(state.goalSessions, goalTitleById);
    const reminderEvents = buildGoalDeadlineReminderEvents(state.goals);
    const allEvents = [...taskEvents, ...sessionEvents, ...reminderEvents];

    if (allEvents.length === 0) {
      setSyncHint("没有可导出的安排。请先创建任务或目标 session。");
      return;
    }

    const ics = exportToICS(allEvents, "Goal Driven Planner");
    downloadIcsFile(`goal-driven-all-${today}.ics`, ics);
    actions.markTasksSyncedToCalendar(taskEvents.map((eventItem) => eventItem.sourceId), true);
    actions.markGoalSessionsSyncedToCalendar(sessionEvents.map((eventItem) => eventItem.sourceId), true);
    setSyncHint(`已导出全部安排，共 ${allEvents.length} 条事件。`);
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title">今日任务（三件事法则 + 时间安排）</h3>
          <span className="badge border-mint/50 bg-mint/20 text-ink">完成 {doneCount}/{todayTasks.length}</span>
        </div>

        <p className="mt-2 text-sm text-ink/70">先完成最重要三件事，再用时间轴把任务落到具体时段。</p>

        <form className="mt-3 grid gap-2 md:grid-cols-[1fr_140px_120px_110px_110px]" onSubmit={submitTask}>
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="新增今日任务"
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />

          <select
            value={newType}
            onChange={(event) => setNewType(event.target.value as TaskPlanType)}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="today_top">最重要 1 件</option>
            <option value="today_secondary">次重要 2 件</option>
            <option value="today_other">其他待办</option>
          </select>

          <input
            value={newStartTime}
            onChange={(event) => setNewStartTime(event.target.value)}
            type="time"
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />

          <input
            value={newDuration}
            onChange={(event) => setNewDuration(Number(event.target.value) || 60)}
            type="number"
            min={15}
            step={5}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          />

          <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            添加
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportTodayTasksToCalendar}
            className="rounded-xl bg-sky px-4 py-2 text-sm font-medium text-ink"
          >
            同步今日任务到日历 (.ics)
          </button>
          <button
            type="button"
            onClick={exportAllScheduledToCalendar}
            className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink/80"
          >
            导出全部已安排任务
          </button>
        </div>

        {syncHint && <p className="mt-2 text-xs text-ink/65">{syncHint}</p>}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <TaskGroup
            key={group.planType}
            title={group.title}
            subtitle={group.subtitle}
            tasks={todayTasks.filter((task) => task.planType === group.planType)}
            onToggle={actions.toggleTask}
            onReorder={actions.reorderTask}
            onEditSchedule={openScheduleEditor}
            onClearSchedule={actions.clearTaskSchedule}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.3fr]">
        <article className="card-surface p-4 md:p-5">
          <h4 className="section-title">时间设置</h4>

          {editingTaskId ? (
            <form onSubmit={saveScheduleEdit} className="mt-3 space-y-2">
              <p className="text-sm text-ink/75">编辑任务时间：{todayTasks.find((task) => task.id === editingTaskId)?.title}</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(event) => setEditStartTime(event.target.value)}
                  className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={15}
                  step={5}
                  value={editDuration}
                  onChange={(event) => setEditDuration(Number(event.target.value) || 60)}
                  className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
                  保存时间
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTaskId(null)}
                  className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-3 text-sm text-ink/65">点击任务“安排时间/编辑时间”或时间轴中的任务块可快速编辑。</p>
          )}

          <form onSubmit={assignSlotTask} className="mt-4 space-y-2 rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-sm font-medium text-ink">点击空白时段后快速安排</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="time"
                value={slotTime}
                onChange={(event) => setSlotTime(event.target.value)}
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
              <select
                value={slotTaskId}
                onChange={(event) => setSlotTaskId(event.target.value)}
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              >
                <option value="">选择未排程任务</option>
                {unscheduledTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {labelForTaskType(task.planType)} · {task.title}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={15}
                step={5}
                value={slotDuration}
                onChange={(event) => setSlotDuration(Number(event.target.value) || 45)}
                className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="rounded-xl bg-mint px-4 py-2 text-sm font-medium text-ink">
              安排到时间轴
            </button>
          </form>
        </article>

        <article className="card-surface p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h4 className="section-title">今日时间轴（08:00 - 22:00）</h4>
            <span className="text-xs text-ink/60">拖动任务块可调整开始时间</span>
          </div>

          <div className="mt-3 grid grid-cols-[72px_1fr] gap-2">
            <div className="space-y-0">
              {slots.map((slot) => (
                <div key={`label_${slot}`} className="h-[30px] text-[11px] text-ink/55">
                  {slot.endsWith(":00") ? slot : ""}
                </div>
              ))}
            </div>

            <div className="relative rounded-xl border border-ink/10 bg-white">
              {slots.map((slot, index) => (
                <div
                  key={`slot_${slot}`}
                  onClick={() => setSlotTime(slot)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDropToSlot(event, slot)}
                  className={`h-[30px] border-b border-dashed border-ink/10 px-2 text-[10px] text-ink/30 ${
                    slotTime === slot ? "bg-mint/10" : ""
                  }`}
                >
                  {index % 2 === 1 ? "" : ""}
                </div>
              ))}

              {scheduledTasks.map((task) => {
                if (!task.startTime) {
                  return null;
                }

                const startMinutes = toMinuteOfDay(task.startTime) - TIMELINE_START_HOUR * 60;
                const duration = taskDuration(task);
                const top = (startMinutes / SLOT_MINUTES) * SLOT_HEIGHT;
                const height = Math.max(SLOT_HEIGHT, (duration / SLOT_MINUTES) * SLOT_HEIGHT);

                return (
                  <button
                    key={task.id}
                    type="button"
                    draggable
                    onDragStart={(event) => onDragStart(event, task.id)}
                    onClick={() => openScheduleEditor(task)}
                    className={`absolute left-2 right-2 rounded-lg border p-2 text-left text-xs shadow-sm ${
                      task.syncedToCalendar
                        ? "border-sky/40 bg-sky/20 text-ink"
                        : "border-mint/40 bg-mint/20 text-ink"
                    }`}
                    style={{ top, height }}
                  >
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-[11px] text-ink/65">
                      {task.startTime} - {task.endTime}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-xs text-ink/55">
            说明：MVP 已支持基础拖动（改变开始时间）。后续可扩展为完整拖拽改期、冲突检测和自动让位。
          </p>
        </article>
      </section>
    </div>
  );
}
