"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addMinutes, diffInDays, formatFullDate, todayKey } from "@/lib/date";
import { Task, TimelineItem } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type HomeTab = "life" | "work";

type TimelineRow =
  | {
      kind: "item";
      item: TimelineItem;
    }
  | {
      kind: "free";
      id: string;
      startTime: string;
      endTime: string;
    };

const PLAN_ORDER = {
  today_top: 0,
  today_secondary: 1,
  today_other: 2,
  weekly: 3,
};

const TAB_LABEL: Record<HomeTab, string> = {
  life: "生活页",
  work: "工作页",
};

const TIMELINE_TYPE_LABEL: Record<TimelineItem["type"], string> = {
  goal_session: "目标时段",
  task: "任务",
  manual_schedule: "手动日程",
  review_reminder: "复盘提醒",
};

function priorityBadge(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return "border-red-200 bg-red-50 text-red-600";
  }
  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function fromMinutes(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

function sortByStartTime<T extends { startTime: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function buildTaskTimeline(todayTasks: Task[]): TimelineItem[] {
  const topTasks = todayTasks.filter((task) => task.planType === "today_top");
  const secondaryTasks = todayTasks.filter((task) => task.planType === "today_secondary");
  const otherTasks = todayTasks.filter((task) => task.planType === "today_other");

  const timedTasks = [
    ...topTasks.map((task, index) => ({ task, startTime: addMinutes("09:00", index * 90) })),
    ...secondaryTasks.map((task, index) => ({ task, startTime: addMinutes("14:00", index * 80) })),
    ...otherTasks.map((task, index) => ({ task, startTime: addMinutes("20:00", index * 55) })),
  ];

  return timedTasks.map(({ task, startTime }, index) => ({
    id: `timeline_task_${task.id}_${index}`,
    type: "task",
    title: task.title,
    date: task.dueDate,
    startTime,
    endTime: addMinutes(startTime, 40),
    sourceTaskId: task.id,
    status: task.completed ? "done" : "planned",
    notes: "MVP: 任务时段为 mock 规则分配，后续可接真实排程。",
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));
}

function fillTimelineGaps(items: TimelineItem[]): TimelineRow[] {
  if (items.length === 0) {
    return [];
  }

  const sorted = sortByStartTime(items);
  const rows: TimelineRow[] = [];
  let cursor = toMinutes("07:00");

  sorted.forEach((item, index) => {
    const start = toMinutes(item.startTime);
    const end = item.endTime ? toMinutes(item.endTime) : start + 40;

    if (start - cursor >= 60) {
      rows.push({
        kind: "free",
        id: `gap_${index}`,
        startTime: fromMinutes(cursor),
        endTime: fromMinutes(start),
      });
    }

    rows.push({ kind: "item", item });
    cursor = Math.max(cursor, end);
  });

  const dayEnd = toMinutes("23:00");
  if (dayEnd - cursor >= 90) {
    rows.push({
      kind: "free",
      id: "gap_end",
      startTime: fromMinutes(cursor),
      endTime: fromMinutes(dayEnd),
    });
  }

  return rows;
}

export function DashboardPage() {
  const { state, actions } = useAppStore();
  const today = todayKey();

  const [activeTab, setActiveTab] = useState<HomeTab>("work");
  const [cityInput, setCityInput] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualStart, setManualStart] = useState("12:30");
  const [manualEnd, setManualEnd] = useState("13:00");

  const [wins, setWins] = useState("");
  const [wasted, setWasted] = useState("");
  const [improve, setImprove] = useState("");

  const goalMap = useMemo(() => new Map(state.goals.map((goal) => [goal.id, goal])), [state.goals]);

  const todayTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => task.dueDate === today && task.planType !== "weekly")
        .sort((a, b) => {
          const planDiff = PLAN_ORDER[a.planType] - PLAN_ORDER[b.planType];
          return planDiff === 0 ? a.order - b.order : planDiff;
        }),
    [state.tasks, today],
  );

  const keyThreeTasks = useMemo(
    () => todayTasks.filter((task) => task.planType === "today_top" || task.planType === "today_secondary").slice(0, 3),
    [todayTasks],
  );

  const todaySessions = useMemo(
    () =>
      state.goalSessions
        .filter((session) => session.date === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [state.goalSessions, today],
  );

  const urgentGoals = useMemo(() => {
    const todayDate = new Date(`${today}T00:00:00`);

    return state.goals
      .filter((goal) => goal.status !== "completed")
      .map((goal) => ({
        ...goal,
        daysLeft: diffInDays(todayDate, new Date(`${goal.deadline}T00:00:00`)),
      }))
      .filter((goal) => goal.daysLeft >= 0 && goal.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [state.goals, today]);

  const scheduledGoalIdsToday = useMemo(() => new Set(todaySessions.map((session) => session.goalId)), [todaySessions]);

  const unscheduledUrgentGoals = useMemo(
    () => urgentGoals.filter((goal) => !scheduledGoalIdsToday.has(goal.id)),
    [urgentGoals, scheduledGoalIdsToday],
  );

  const selectedWeatherLocation =
    state.weatherLocations.find((location) => location.id === state.selectedWeatherLocationId) ?? state.weatherLocations[0];

  const manualTimelineItems = useMemo(
    () =>
      state.timelineItems
        .filter((item) => item.date === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [state.timelineItems, today],
  );

  const taskTimeline = useMemo(() => buildTaskTimeline(todayTasks), [todayTasks]);

  const timelineRows = useMemo(() => {
    const sessionTimeline: TimelineItem[] = todaySessions.map((session) => ({
      id: `timeline_goal_${session.id}`,
      type: "goal_session",
      title: session.title,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      sourceGoalId: session.goalId,
      status: session.status === "done" ? "done" : "planned",
      notes: "来自目标自动拆分 session。",
      createdAt: today,
      updatedAt: today,
    }));

    const reviewReminder: TimelineItem = {
      id: `timeline_review_${today}`,
      type: "review_reminder",
      title: "晚间 1 分钟复盘",
      date: today,
      startTime: "22:30",
      endTime: "22:40",
      status: state.reviews.some((entry) => entry.date === today) ? "done" : "planned",
      notes: "每日三问：做成了什么 / 浪费了什么 / 明天只改一点。",
      createdAt: today,
      updatedAt: today,
    };

    return fillTimelineGaps([...manualTimelineItems, ...sessionTimeline, ...taskTimeline, reviewReminder]);
  }, [manualTimelineItems, state.reviews, taskTimeline, today, todaySessions]);

  const unprocessedIdeas = state.ideas.filter((idea) => idea.status === "unprocessed").length;
  const importedUnsortedTasks = state.tasks.filter((task) => task.source === "imported" && !task.completed).length;
  const inboxParsedCount = state.parsedImportTasks.length;

  const todayReview = state.reviews.find((entry) => entry.date === today);

  const reviewHistory = useMemo(
    () => [...state.reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [state.reviews],
  );

  useEffect(() => {
    if (todayReview) {
      setWins(todayReview.wins);
      setWasted(todayReview.wastedTime);
      setImprove(todayReview.improveOneThing);
      return;
    }

    setWins("");
    setWasted("");
    setImprove("");
  }, [todayReview]);

  function handleAddCity(event: FormEvent) {
    event.preventDefault();
    actions.addWeatherLocation(cityInput);
    setCityInput("");
  }

  function handleAddManualTimeline(event: FormEvent) {
    event.preventDefault();
    actions.addManualTimelineItem(manualTitle, manualStart, manualEnd || undefined);
    setManualTitle("");
  }

  function onSubmitReview(event: FormEvent) {
    event.preventDefault();
    actions.addReview(wins, wasted, improve);
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="soft-label">今日主页</p>
            <h2 className="mt-1 text-lg font-semibold md:text-2xl">{formatFullDate(today)}</h2>
            <p className="mt-1 text-sm text-ink/70">
              {activeTab === "life" ? "生活页：节奏、信息和状态管理" : "工作页：目标执行、任务推进与复盘"}
            </p>
          </div>

          <div className="inline-flex rounded-full border border-ink/15 bg-white p-1">
            {(["life", "work"] as HomeTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  activeTab === tab ? "bg-mint text-ink" : "text-ink/65 hover:bg-ink/5"
                }`}
              >
                {TAB_LABEL[tab]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTab === "life" ? (
        <div className="space-y-4 md:space-y-5">
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="card-surface p-4 md:p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="section-title">天气与穿衣</h3>
                <span className="badge border-mint/45 bg-mint/10 text-ink/70">MVP Mock</span>
              </div>

              <p className="mt-2 text-sm text-ink/75">当前城市：{selectedWeatherLocation?.label ?? state.weather.location}</p>
              <h4 className="mt-2 text-xl font-semibold text-ink">
                {state.weather.condition} · {state.weather.temperatureC}°C
              </h4>
              <p className="mt-1 text-sm text-ink/70">湿度 {state.weather.humidity}%</p>

              <div className="mt-3 space-y-2 rounded-2xl bg-white/85 p-3 text-sm text-ink/80">
                <p>学习建议：{state.weather.suggestion}</p>
                <p>穿衣建议：{state.weather.outfitTip}</p>
              </div>

              <form onSubmit={handleAddCity} className="mt-3 flex gap-2">
                <input
                  value={cityInput}
                  onChange={(event) => setCityInput(event.target.value)}
                  placeholder="输入城市并保存"
                  className="flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
                />
                <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-white">
                  保存
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                {state.weatherLocations.map((location) => {
                  const selected = location.id === state.selectedWeatherLocationId;
                  return (
                    <div key={location.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => actions.selectWeatherLocation(location.id)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          selected ? "border-mint bg-mint/20 text-ink" : "border-ink/20 bg-white text-ink/70"
                        }`}
                      >
                        {location.city}
                      </button>
                      {location.isDefault ? (
                        <span className="badge border-ink/20 bg-white text-ink/60">默认</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => actions.setDefaultWeatherLocation(location.id)}
                          className="rounded-full border border-ink/15 bg-white px-2 py-1 text-xs text-ink/60"
                        >
                          设默认
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-ink/55">预留：后续接入真实天气 API（按城市经纬度拉取实时天气）。</p>
            </article>

            <article className="card-surface p-4 md:p-5">
              <div className="flex items-center justify-between">
                <h3 className="section-title">每日新闻</h3>
                <span className="badge border-ink/15 bg-white text-ink/65">3-5 条轻量资讯</span>
              </div>

              <ul className="mt-3 space-y-2">
                {state.newsItems.slice(0, 5).map((news) => (
                  <li key={news.id} className="rounded-xl border border-ink/10 bg-white p-3">
                    <p className="text-sm font-medium text-ink">{news.title}</p>
                    <p className="mt-1 text-xs text-ink/70">{news.summary}</p>
                    <p className="mt-2 text-[11px] text-ink/55">
                      {news.source} · {news.publishedAt}
                    </p>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-xs text-ink/55">预留：后续可接新闻 API，按城市/学校/学习主题个性化。</p>
            </article>
          </section>

          <section className="card-surface p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="section-title">今日时间轴</h3>
              <span className="badge border-ink/15 bg-white text-ink/65">纵向时间轴 · 手机优先</span>
            </div>

            <form onSubmit={handleAddManualTimeline} className="mt-3 grid gap-2 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
              <input
                value={manualTitle}
                onChange={(event) => setManualTitle(event.target.value)}
                placeholder="新增手动日程，例如：社团会议"
                className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
              />
              <input
                value={manualStart}
                onChange={(event) => setManualStart(event.target.value)}
                type="time"
                className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
              />
              <input
                value={manualEnd}
                onChange={(event) => setManualEnd(event.target.value)}
                type="time"
                className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
              />
              <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-white">
                加入
              </button>
            </form>

            <ul className="mt-4 space-y-2">
              {timelineRows.map((row) => {
                if (row.kind === "free") {
                  return (
                    <li key={row.id} className="rounded-xl border border-dashed border-ink/20 bg-white/70 p-3 text-sm text-ink/60">
                      <p>
                        {row.startTime} - {row.endTime}
                      </p>
                      <p className="mt-1">空档时间，可安排轻任务或休息。</p>
                    </li>
                  );
                }

                const isManual = row.item.type === "manual_schedule";
                const sourceGoal = row.item.sourceGoalId ? goalMap.get(row.item.sourceGoalId)?.title : undefined;
                const sourceTask = row.item.sourceTaskId
                  ? todayTasks.find((task) => task.id === row.item.sourceTaskId)?.title
                  : undefined;

                return (
                  <li
                    key={row.item.id}
                    className={`rounded-xl border p-3 ${
                      row.item.status === "done" ? "border-mint/50 bg-mint/10" : "border-ink/10 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-ink/55">
                          {row.item.startTime}
                          {row.item.endTime ? ` - ${row.item.endTime}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">{row.item.title}</p>
                        <p className="mt-1 text-xs text-ink/60">{TIMELINE_TYPE_LABEL[row.item.type]}</p>
                        {sourceGoal && <p className="mt-1 text-xs text-ink/60">目标：{sourceGoal}</p>}
                        {sourceTask && <p className="mt-1 text-xs text-ink/60">任务：{sourceTask}</p>}
                      </div>

                      {isManual && (
                        <button
                          type="button"
                          onClick={() => actions.removeManualTimelineItem(row.item.id)}
                          className="rounded-lg border border-ink/15 bg-white px-2 py-1 text-xs text-ink/65"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {timelineRows.length === 0 && <p className="mt-3 text-sm text-ink/60">今天暂无安排，可先添加一个手动日程。</p>}
          </section>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="card-surface p-4 md:p-5">
              <div className="flex items-center justify-between">
                <h3 className="section-title">今日三件事</h3>
                <span className="badge border-ink/15 bg-white text-ink/70">
                  {keyThreeTasks.filter((task) => task.completed).length}/{keyThreeTasks.length}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {keyThreeTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`rounded-xl border p-3 ${task.completed ? "border-mint/50 bg-mint/10" : "border-ink/10 bg-white"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        checked={task.completed}
                        onChange={() => actions.toggleTask(task.id)}
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-ink/20 accent-mint"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.completed ? "line-through text-ink/50" : "text-ink"}`}>
                          {task.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className={`badge ${priorityBadge(task.priority)}`}>{task.priority}</span>
                          {task.goalId && <span className="text-ink/60">目标：{goalMap.get(task.goalId)?.title}</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {keyThreeTasks.length === 0 && <p className="mt-3 text-sm text-ink/60">还没有设置今天关键三件事。</p>}
            </article>

            <article className="card-surface p-4 md:p-5">
              <h3 className="section-title">今日目标任务提醒</h3>

              <ul className="mt-3 space-y-2">
                {todaySessions.slice(0, 6).map((session) => (
                  <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-3">
                    <p className="text-sm font-medium text-ink">{session.title}</p>
                    <p className="mt-1 text-xs text-ink/60">
                      {session.startTime} - {session.endTime} · {goalMap.get(session.goalId)?.title}
                    </p>
                  </li>
                ))}
              </ul>

              {todaySessions.length === 0 && <p className="mt-3 text-sm text-ink/60">今天没有已排进日历的目标任务。</p>}

              {unscheduledUrgentGoals.length > 0 && (
                <div className="mt-3 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-700">临近截止但今天未安排：</p>
                  {unscheduledUrgentGoals.slice(0, 3).map((goal) => (
                    <p key={goal.id} className="text-sm text-red-700">
                      {goal.title} · 还剩 {goal.daysLeft} 天
                    </p>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="card-surface p-4 md:p-5">
              <h3 className="section-title">收件箱提醒</h3>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                <li className="rounded-xl bg-white p-3">新导入待处理任务：{importedUnsortedTasks} 条</li>
                <li className="rounded-xl bg-white p-3">未整理想法：{unprocessedIdeas} 条</li>
                <li className="rounded-xl bg-white p-3">待确认导入项：{inboxParsedCount} 条</li>
              </ul>
            </article>

            <article className="card-surface p-4 md:p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="section-title">晚间复盘（每日三问）</h3>
                {todayReview ? (
                  <span className="badge border-mint/45 bg-mint/15 text-ink/70">今日已保存</span>
                ) : (
                  <span className="badge border-ink/15 bg-white text-ink/60">今日未填写</span>
                )}
              </div>

              <form className="mt-3 space-y-2" onSubmit={onSubmitReview}>
                <textarea
                  value={wins}
                  onChange={(event) => setWins(event.target.value)}
                  rows={2}
                  placeholder="1. 今天做成了什么？"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
                />
                <textarea
                  value={wasted}
                  onChange={(event) => setWasted(event.target.value)}
                  rows={2}
                  placeholder="2. 哪里浪费时间了？"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
                />
                <textarea
                  value={improve}
                  onChange={(event) => setImprove(event.target.value)}
                  rows={2}
                  placeholder="3. 明天只改一个点"
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
                />
                <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
                  {todayReview ? "更新今日复盘" : "保存今日复盘"}
                </button>
              </form>

              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/60">历史复盘</p>
                <ul className="mt-2 space-y-2">
                  {reviewHistory.map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-ink/10 bg-white p-3">
                      <p className="text-xs text-ink/55">{entry.date}</p>
                      <p className="mt-1 text-xs text-ink/75">做成：{entry.wins || "-"}</p>
                      <p className="mt-1 text-xs text-ink/75">浪费：{entry.wastedTime || "-"}</p>
                      <p className="mt-1 text-xs text-ink/75">明日改进：{entry.improveOneThing || "-"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </section>
        </div>
      )}
    </div>
  );
}
