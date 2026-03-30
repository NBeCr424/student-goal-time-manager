"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FocusHomePanel } from "@/components/home/focus-home-panel";
import { diffInDays, formatFullDate, fromDateKey, todayKey } from "@/lib/date";
import { summarizeFinance } from "@/lib/finance";
import { createId } from "@/lib/id";
import { useAppStore } from "@/store/app-store";

type HomeTab = "life" | "work" | "focus";

const PLAN_ORDER = {
  today_top: 0,
  today_secondary: 1,
  today_other: 2,
  weekly: 3,
};

const HOME_TAB_LABEL: Record<HomeTab, string> = {
  life: "生活",
  work: "工作",
  focus: "专注",
};

const MOS_WEATHER_URL = "https://www.mosweather.com";

interface LifeRecordEntry {
  id: string;
  date: string;
  content: string;
}

const LIFE_RECORD_STORAGE_KEY = "student_app_life_records_v1";

function formatCny(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function DashboardPage() {
  const { state, actions } = useAppStore();
  const searchParams = useSearchParams();
  const today = todayKey();

  const [activeTab, setActiveTab] = useState<HomeTab>("work");
  const [lifeRecordInput, setLifeRecordInput] = useState("");
  const [lifeRecords, setLifeRecords] = useState<LifeRecordEntry[]>([]);

  const queryHome = searchParams.get("home");
  const defaultFocusTaskId = searchParams.get("taskId") ?? undefined;

  useEffect(() => {
    if (queryHome === "life" || queryHome === "work" || queryHome === "focus") {
      setActiveTab(queryHome);
    }
  }, [queryHome]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LIFE_RECORD_STORAGE_KEY);
      if (!raw) {
        return;
      }
      setLifeRecords(JSON.parse(raw) as LifeRecordEntry[]);
    } catch {
      setLifeRecords([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LIFE_RECORD_STORAGE_KEY, JSON.stringify(lifeRecords));
  }, [lifeRecords]);

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
    () => state.goalSessions.filter((session) => session.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [state.goalSessions, today],
  );

  const urgentGoals = useMemo(() => {
    const todayDate = fromDateKey(today);
    return state.goals
      .filter((goal) => goal.status !== "completed")
      .map((goal) => ({
        ...goal,
        daysLeft: diffInDays(todayDate, fromDateKey(goal.deadline)),
      }))
      .filter((goal) => goal.daysLeft >= 0 && goal.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [state.goals, today]);

  const scheduledGoalIdsToday = useMemo(() => new Set(todaySessions.map((session) => session.goalId)), [todaySessions]);

  const unscheduledUrgentGoals = useMemo(
    () => urgentGoals.filter((goal) => !scheduledGoalIdsToday.has(goal.id)),
    [urgentGoals, scheduledGoalIdsToday],
  );

  const todayReview = state.reviews.find((entry) => entry.date === today);
  const financeSummary = useMemo(
    () => summarizeFinance(state.financeRecords, state.financeCategories, state.budgetPlans, today),
    [state.budgetPlans, state.financeCategories, state.financeRecords, today],
  );

  const completedTodayCount = todayTasks.filter((task) => task.completed).length;
  const todayProgressLabel = todayTasks.length > 0 ? `${completedTodayCount}/${todayTasks.length}` : "0/0";

  function submitLifeRecord(event: FormEvent) {
    event.preventDefault();
    const content = lifeRecordInput.trim();
    if (!content) {
      return;
    }

    setLifeRecords((prev) => [
      {
        id: createId("life_record"),
        date: today,
        content,
      },
      ...prev,
    ]);
    setLifeRecordInput("");
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink md:text-lg">{formatFullDate(today)}</h2>
          <div className="inline-flex rounded-full border border-ink/15 bg-white p-1">
            {(["life", "work", "focus"] as HomeTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  activeTab === tab ? "bg-mint text-ink" : "text-ink/65 hover:bg-ink/5"
                }`}
              >
                {HOME_TAB_LABEL[tab]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTab === "life" ? (
        <div className="space-y-4">
          <section className="card-surface p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="section-title">天气与穿衣</h3>
              <span className="badge border-ink/15 bg-white text-ink/70">外链入口</span>
            </div>

            <Link href={MOS_WEATHER_URL} className="mt-3 block rounded-2xl border border-mint/35 bg-mint/10 px-4 py-3">
              <p className="text-sm font-medium text-ink">点击查看 MOS 天气</p>
              <p className="mt-1 text-xs text-ink/60">前往查看</p>
            </Link>
          </section>

          <section className="card-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="section-title">生活随手记</h3>
              <Link href="/ideas" className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70">
                去想法页
              </Link>
            </div>

            <form onSubmit={submitLifeRecord} className="mt-3 flex gap-2">
              <input
                value={lifeRecordInput}
                onChange={(event) => setLifeRecordInput(event.target.value)}
                placeholder="记录今天一句话（如：下午效率不错）"
                className="flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-white">
                保存
              </button>
            </form>

            <ul className="mt-3 space-y-2">
              {lifeRecords.slice(0, 3).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink/80">
                  <p>{entry.content}</p>
                  <p className="mt-1 text-xs text-ink/55">{entry.date}</p>
                </li>
              ))}
            </ul>

            {lifeRecords.length === 0 && <p className="mt-2 text-xs text-ink/60">还没有记录，先写第一条。</p>}
          </section>
        </div>
      ) : activeTab === "work" ? (
        <div className="space-y-4">
          <article className="card-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="section-title">今日三件事摘要</h3>
                <p className="mt-1 text-xs text-ink/60">完成这三件，今天就算成功</p>
              </div>
              <span className="badge border-ink/15 bg-white text-ink/70">
                {keyThreeTasks.filter((task) => task.completed).length}/{keyThreeTasks.length || 3}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink/65">今日任务进度：{todayProgressLabel}</p>

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
                      className="mt-0.5 h-4 w-4 rounded border-ink/20 accent-mint"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${task.completed ? "line-through text-ink/50" : "text-ink"}`}>{task.title}</p>
                      {task.goalId && <p className="mt-0.5 truncate text-xs text-ink/55">{goalMap.get(task.goalId)?.title}</p>}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Link href={`/?home=focus&taskId=${task.id}`} className="rounded-full border border-ink/20 bg-white px-2 py-1 text-[11px] text-ink/70">
                      去专注
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {keyThreeTasks.length === 0 && <p className="mt-3 text-sm text-ink/60">还没有设置今天三件事。</p>}

            <div className="mt-3 flex gap-2">
              <Link href="/plan?tab=day" className="flex-1 rounded-xl border border-ink/10 bg-white py-2 text-center text-xs text-ink/60">
                去日计划
              </Link>
              <Link href="/profile?tab=review" className="flex-1 rounded-xl border border-ink/10 bg-white py-2 text-center text-xs text-ink/60">
                去复盘
              </Link>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="card-surface p-4">
              <h3 className="section-title">今日时间轴摘要</h3>
              <p className="mt-2 text-sm text-ink/70">
                已安排时段 <span className="font-semibold text-ink">{todaySessions.length}</span> 条
              </p>

              <ul className="mt-2 space-y-2">
                {todaySessions.slice(0, 2).map((session) => (
                  <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-2.5 text-xs text-ink/70">
                    {session.startTime}-{session.endTime} · {session.title}
                  </li>
                ))}
              </ul>

              {unscheduledUrgentGoals.length > 0 && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-700">临近截止但未安排</p>
                  {unscheduledUrgentGoals.slice(0, 2).map((goal) => (
                    <p key={goal.id} className="mt-1 text-xs text-red-700">
                      {goal.title} · 还剩 {goal.daysLeft} 天
                    </p>
                  ))}
                </div>
              )}
            </article>

            <article className="card-surface p-4">
              <h3 className="section-title">晚间复盘入口</h3>
              <p className="mt-2 text-sm text-ink/70">{todayReview ? "今日复盘已填写，可继续补充。 " : "今日复盘未填写，建议晚间完成。"}</p>
              <div className="mt-3 flex gap-2">
                <Link href="/profile?tab=review" className="flex-1 rounded-xl border border-ink/10 bg-white py-2 text-center text-xs text-ink/60">
                  去写复盘
                </Link>
                <Link href="/ideas" className="flex-1 rounded-xl border border-ink/10 bg-white py-2 text-center text-xs text-ink/60">
                  去快速记录
                </Link>
              </div>
            </article>
          </div>

          <article className="card-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="section-title">记账概览与入口</h3>
              <Link href="/finance" className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70">
                打开记账
              </Link>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/55">今日支出</p>
                <p className="mt-1 text-sm font-semibold text-ink">{formatCny(financeSummary.todayExpense)}</p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/55">今日收入</p>
                <p className="mt-1 text-sm font-semibold text-ink">{formatCny(financeSummary.todayIncome)}</p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/55">本月结余</p>
                <p className={`mt-1 text-sm font-semibold ${financeSummary.monthRemaining >= 0 ? "text-ink" : "text-red-700"}`}>
                  {formatCny(financeSummary.monthRemaining)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Link href="/finance" className="flex-1 rounded-xl border border-ink/10 bg-white py-2 text-center text-xs text-ink/70">
                快速记一笔
              </Link>
              <Link href="/finance/more" className="flex-1 rounded-xl border border-ink/10 bg-white py-2 text-center text-xs text-ink/70">
                预算与统计
              </Link>
              <Link href="/finance/special" className="flex-1 rounded-xl border border-ink/10 bg-white py-2 text-center text-xs text-ink/70">
                专项预算
              </Link>
            </div>
          </article>
        </div>
      ) : (
        <FocusHomePanel defaultTaskId={defaultFocusTaskId} />
      )}

    </div>
  );
}
