"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { addDays, fromDateKey, getWeekDates, toDateKey, todayKey } from "@/lib/date";
import { getMonthKey } from "@/lib/finance";
import { FinanceCategory } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type FinanceMoreTab = "category_budget" | "stats" | "saving_goal" | "review_link";

interface SavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  note?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const SAVING_GOALS_STORAGE_KEY = "student_finance_saving_goals_v1";
const IMPULSE_KEYWORDS = ["冲动", "奶茶", "外卖", "宵夜", "盲盒", "直播", "游戏", "饮料"];

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

function formatCny(value: number): string {
  return `¥${value.toFixed(2)}`;
}

function findCategoryName(categories: FinanceCategory[], categoryId: string): string {
  return categories.find((item) => item.id === categoryId)?.name ?? "未分类";
}

function includesAny(text: string | undefined, keywords: string[]): boolean {
  if (!text) {
    return false;
  }
  return keywords.some((keyword) => text.includes(keyword));
}

export function FinanceMorePage() {
  const { state, actions } = useAppStore();
  const today = todayKey();
  const currentMonth = getMonthKey(today);
  const currentWeekDates = useMemo(() => getWeekDates(fromDateKey(today)), [today]);

  const [activeTab, setActiveTab] = useState<FinanceMoreTab>("category_budget");
  const [hint, setHint] = useState("");

  const [showBudgetSheet, setShowBudgetSheet] = useState(false);
  const [budgetCategoryId, setBudgetCategoryId] = useState("");
  const [budgetAmountInput, setBudgetAmountInput] = useState("");

  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetInput, setGoalTargetInput] = useState("");
  const [goalCurrentInput, setGoalCurrentInput] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalNote, setGoalNote] = useState("");
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);

  const expenseCategories = useMemo(
    () => state.financeCategories.filter((item) => item.type === "expense").sort((a, b) => a.order - b.order),
    [state.financeCategories],
  );

  const currentBudgetPlan = useMemo(
    () => state.budgetPlans.find((item) => item.monthKey === currentMonth),
    [state.budgetPlans, currentMonth],
  );
  const categoryBudgets = currentBudgetPlan?.categoryBudgets ?? {};

  const monthRecords = useMemo(
    () => state.financeRecords.filter((record) => getMonthKey(record.date) === currentMonth),
    [currentMonth, state.financeRecords],
  );

  const monthExpenseRecords = useMemo(() => monthRecords.filter((record) => record.type === "expense"), [monthRecords]);
  const monthIncomeRecords = useMemo(() => monthRecords.filter((record) => record.type === "income"), [monthRecords]);
  const weekRecords = useMemo(
    () => state.financeRecords.filter((record) => currentWeekDates.includes(record.date)),
    [currentWeekDates, state.financeRecords],
  );
  const weekExpenseRecords = useMemo(() => weekRecords.filter((record) => record.type === "expense"), [weekRecords]);
  const weekIncomeRecords = useMemo(() => weekRecords.filter((record) => record.type === "income"), [weekRecords]);

  const monthExpenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenseRecords.forEach((record) => {
      map.set(record.categoryId, (map.get(record.categoryId) ?? 0) + record.amount);
    });
    return map;
  }, [monthExpenseRecords]);

  const weekExpenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    weekExpenseRecords.forEach((record) => {
      map.set(record.categoryId, (map.get(record.categoryId) ?? 0) + record.amount);
    });
    return map;
  }, [weekExpenseRecords]);

  const monthExpenseTotal = useMemo(
    () => monthExpenseRecords.reduce((sum, record) => sum + record.amount, 0),
    [monthExpenseRecords],
  );
  const monthIncomeTotal = useMemo(
    () => monthIncomeRecords.reduce((sum, record) => sum + record.amount, 0),
    [monthIncomeRecords],
  );
  const weekExpenseTotal = useMemo(
    () => weekExpenseRecords.reduce((sum, record) => sum + record.amount, 0),
    [weekExpenseRecords],
  );
  const weekIncomeTotal = useMemo(
    () => weekIncomeRecords.reduce((sum, record) => sum + record.amount, 0),
    [weekIncomeRecords],
  );

  const monthTopCategoryId = useMemo(() => {
    let topId = "";
    let topAmount = 0;
    monthExpenseByCategory.forEach((amount, categoryId) => {
      if (amount > topAmount) {
        topAmount = amount;
        topId = categoryId;
      }
    });
    return topId;
  }, [monthExpenseByCategory]);

  const weekTopCategoryId = useMemo(() => {
    let topId = "";
    let topAmount = 0;
    weekExpenseByCategory.forEach((amount, categoryId) => {
      if (amount > topAmount) {
        topAmount = amount;
        topId = categoryId;
      }
    });
    return topId;
  }, [weekExpenseByCategory]);

  const monthDistribution = useMemo(() => {
    return expenseCategories
      .map((category) => ({
        category,
        amount: monthExpenseByCategory.get(category.id) ?? 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [expenseCategories, monthExpenseByCategory]);

  const maxDistributionAmount = monthDistribution[0]?.amount ?? 0;

  const last7Days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => toDateKey(addDays(fromDateKey(today), index - 6))),
    [today],
  );

  const sevenDayTrend = useMemo(
    () =>
      last7Days.map((date) => ({
        date,
        amount: state.financeRecords
          .filter((record) => record.date === date && record.type === "expense")
          .reduce((sum, record) => sum + record.amount, 0),
      })),
    [last7Days, state.financeRecords],
  );
  const maxTrendAmount = Math.max(1, ...sevenDayTrend.map((item) => item.amount));

  const monthlyRemaining = (currentBudgetPlan?.monthlyBudget ?? 0) - monthExpenseTotal;

  const unnecessaryCategoryIds = useMemo(
    () =>
      new Set(
        expenseCategories
          .filter((item) => ["娱乐", "购物", "社交", "其他"].some((name) => item.name.includes(name)))
          .map((item) => item.id),
      ),
    [expenseCategories],
  );

  const weekUnnecessaryExpense = useMemo(
    () =>
      weekExpenseRecords.reduce((sum, record) => (unnecessaryCategoryIds.has(record.categoryId) ? sum + record.amount : sum), 0),
    [unnecessaryCategoryIds, weekExpenseRecords],
  );

  const weekReviews = useMemo(
    () => state.reviews.filter((item) => currentWeekDates.includes(item.date)),
    [currentWeekDates, state.reviews],
  );

  const wastedLinkedCategoryId = useMemo(() => {
    const reasonMap = new Map<string, number>();
    const wastedDays = new Set(weekReviews.filter((item) => item.wastedTime.trim()).map((item) => item.date));
    weekExpenseRecords.forEach((record) => {
      if (!wastedDays.has(record.date)) {
        return;
      }
      reasonMap.set(record.categoryId, (reasonMap.get(record.categoryId) ?? 0) + record.amount);
    });

    let topId = "";
    let topAmount = 0;
    reasonMap.forEach((amount, categoryId) => {
      if (amount > topAmount) {
        topAmount = amount;
        topId = categoryId;
      }
    });
    return topId;
  }, [weekExpenseRecords, weekReviews]);

  const impulseCount = useMemo(
    () => weekExpenseRecords.filter((record) => includesAny(record.note, IMPULSE_KEYWORDS)).length,
    [weekExpenseRecords],
  );

  const reviewTips = useMemo(() => {
    const tips: string[] = [];
    if (weekUnnecessaryExpense > 0) {
      tips.push(`本周非必要支出约 ${formatCny(weekUnnecessaryExpense)}，建议在晚间复盘关注“冲动消费”。`);
    } else {
      tips.push("本周非必要支出较低，消费控制不错。");
    }

    if (wastedLinkedCategoryId) {
      tips.push(`“浪费时间”当天最常见支出是 ${findCategoryName(expenseCategories, wastedLinkedCategoryId)}。`);
    }

    if (impulseCount >= 2) {
      tips.push("本周有多笔疑似冲动消费，建议给娱乐消费设置每日上限。");
    } else {
      tips.push("冲动消费记录不多，保持当前节奏。");
    }

    return tips;
  }, [expenseCategories, impulseCount, wastedLinkedCategoryId, weekUnnecessaryExpense]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVING_GOALS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as SavingGoal[];
      if (Array.isArray(parsed)) {
        setSavingGoals(parsed);
      }
    } catch {
      setSavingGoals([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVING_GOALS_STORAGE_KEY, JSON.stringify(savingGoals));
  }, [savingGoals]);

  useEffect(() => {
    if (expenseCategories.length === 0) {
      return;
    }
    setBudgetCategoryId((prev) => prev || expenseCategories[0].id);
  }, [expenseCategories]);

  function openAddBudget(categoryId?: string) {
    setBudgetCategoryId(categoryId ?? expenseCategories[0]?.id ?? "");
    setBudgetAmountInput("");
    setShowBudgetSheet(true);
  }

  function openEditBudget(categoryId: string) {
    setBudgetCategoryId(categoryId);
    setBudgetAmountInput(`${categoryBudgets[categoryId] ?? 0}`);
    setShowBudgetSheet(true);
  }

  function onSubmitCategoryBudget(event: FormEvent) {
    event.preventDefault();
    const amount = Number(budgetAmountInput);
    if (!budgetCategoryId) {
      setHint("请先选择分类。");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setHint("请输入大于等于 0 的预算金额。");
      return;
    }

    actions.setCategoryBudget(currentMonth, budgetCategoryId, amount);
    setShowBudgetSheet(false);
    setHint("分类预算已保存。");
  }

  function onDeleteCategoryBudget(categoryId: string) {
    actions.removeCategoryBudget(currentMonth, categoryId);
    setHint("已删除该分类预算。");
  }

  function openCreateGoal() {
    setEditingGoalId(null);
    setGoalTitle("");
    setGoalTargetInput("");
    setGoalCurrentInput("0");
    setGoalDeadline("");
    setGoalNote("");
    setShowGoalSheet(true);
  }

  function openEditGoal(goal: SavingGoal) {
    setEditingGoalId(goal.id);
    setGoalTitle(goal.title);
    setGoalTargetInput(`${goal.targetAmount}`);
    setGoalCurrentInput(`${goal.currentAmount}`);
    setGoalDeadline(goal.deadline ?? "");
    setGoalNote(goal.note ?? "");
    setShowGoalSheet(true);
  }

  function onSubmitSavingGoal(event: FormEvent) {
    event.preventDefault();
    const title = goalTitle.trim();
    const targetAmount = Number(goalTargetInput);
    const currentAmount = Number(goalCurrentInput);
    if (!title) {
      setHint("请填写目标名称。");
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setHint("目标金额需要大于 0。");
      return;
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      setHint("当前已攒金额不能小于 0。");
      return;
    }

    if (!editingGoalId) {
      const createdAt = todayKey();
      const nextGoal: SavingGoal = {
        id: `saving_${Date.now()}`,
        title,
        targetAmount,
        currentAmount,
        deadline: goalDeadline || undefined,
        note: goalNote.trim() || undefined,
        completed: currentAmount >= targetAmount,
        createdAt,
        updatedAt: createdAt,
      };
      setSavingGoals((prev) => [nextGoal, ...prev]);
      setHint("已新增攒钱目标。");
    } else {
      setSavingGoals((prev) =>
        prev.map((goal) =>
          goal.id === editingGoalId
            ? {
                ...goal,
                title,
                targetAmount,
                currentAmount,
                deadline: goalDeadline || undefined,
                note: goalNote.trim() || undefined,
                completed: currentAmount >= targetAmount,
                updatedAt: todayKey(),
              }
            : goal,
        ),
      );
      setHint("已更新攒钱目标。");
    }

    setShowGoalSheet(false);
  }

  function onDeleteSavingGoal(goalId: string) {
    setSavingGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    setHint("已删除攒钱目标。");
  }

  function onToggleSavingGoal(goalId: string, completed: boolean) {
    setSavingGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? { ...goal, completed, updatedAt: todayKey() } : goal)),
    );
    setHint(completed ? "已标记为完成。" : "已取消完成标记。");
  }

  function appendMonthRemainingToGoal(goalId: string) {
    const safeRemaining = Math.max(0, monthlyRemaining);
    if (safeRemaining <= 0) {
      setHint("本月暂无可追加结余。");
      return;
    }

    setSavingGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              currentAmount: Math.round((goal.currentAmount + safeRemaining) * 100) / 100,
              completed: goal.currentAmount + safeRemaining >= goal.targetAmount,
              updatedAt: todayKey(),
            }
          : goal,
      ),
    );
    setHint(`已追加本月结余 ${formatCny(safeRemaining)}。`);
  }

  const tabs: Array<{ key: FinanceMoreTab; label: string }> = [
    { key: "category_budget", label: "分类预算" },
    { key: "stats", label: "消费统计" },
    { key: "saving_goal", label: "攒钱目标" },
    { key: "review_link", label: "复盘联动" },
  ];

  return (
    <div className="space-y-4 pb-2">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="soft-label">记账扩展</p>
            <h2 className="section-title">更多预算与分析</h2>
            <p className="mt-1 text-sm text-ink/70">主页面保持轻量，这里承接分类预算、统计、攒钱目标和复盘联动。</p>
          </div>
          <Link href="/finance" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回记账
          </Link>
        </div>
      </section>

      <section className="card-surface p-2">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.key ? "bg-ink text-white" : "bg-white text-ink/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "category_budget" && (
        <section className="card-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="section-title">分类预算</h3>
            <button
              type="button"
              onClick={() => openAddBudget()}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75"
            >
              + 新增分类预算
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {expenseCategories.map((category) => {
              const budget = categoryBudgets[category.id] ?? 0;
              const used = monthExpenseByCategory.get(category.id) ?? 0;
              const remaining = budget - used;
              const progress = budget > 0 ? Math.min(100, (used / budget) * 100) : 0;
              const isExceeded = budget > 0 && used > budget;
              const isNearLimit = budget > 0 && !isExceeded && used >= budget * 0.85;

              return (
                <li key={category.id} className="rounded-xl border border-ink/10 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-ink">{category.name}</p>
                      <p className="mt-1 text-xs text-ink/60">
                        预算 {formatCny(budget)} · 已用 {formatCny(used)} · 剩余 {formatCny(remaining)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {budget > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditBudget(category.id)}
                            className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-[11px] text-ink/70"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCategoryBudget(category.id)}
                            className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-[11px] text-ink/70"
                          >
                            删除
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAddBudget(category.id)}
                          className="rounded-lg border border-ink/15 bg-paper px-2 py-1 text-[11px] text-ink/70"
                        >
                          设置预算
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-ink/10">
                    <div
                      className={`h-2 rounded-full ${
                        isExceeded ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-mint"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-[11px] ${isExceeded ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-ink/60"}`}>
                    {budget <= 0 ? "未设置分类预算" : isExceeded ? "已超预算" : isNearLimit ? "接近上限" : "预算区间内"}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {activeTab === "stats" && (
        <section className="space-y-3">
          <section className="card-surface p-4">
            <h3 className="section-title">统计摘要</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">本周总支出</p>
                <p className="mt-1 text-lg font-semibold text-ink">{formatCny(weekExpenseTotal)}</p>
              </article>
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">本月总支出</p>
                <p className="mt-1 text-lg font-semibold text-ink">{formatCny(monthExpenseTotal)}</p>
              </article>
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">本周最高支出分类</p>
                <p className="mt-1 text-sm font-semibold text-ink">{findCategoryName(expenseCategories, weekTopCategoryId)}</p>
              </article>
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">本月最高支出分类</p>
                <p className="mt-1 text-sm font-semibold text-ink">{findCategoryName(expenseCategories, monthTopCategoryId)}</p>
              </article>
            </div>
          </section>

          <section className="card-surface p-4">
            <h3 className="section-title">分类分布</h3>
            <ul className="mt-3 space-y-2">
              {monthDistribution.map((item) => {
                const ratio = monthExpenseTotal > 0 ? (item.amount / monthExpenseTotal) * 100 : 0;
                const width = maxDistributionAmount > 0 ? (item.amount / maxDistributionAmount) * 100 : 0;
                return (
                  <li key={item.category.id} className="rounded-xl border border-ink/10 bg-white p-3">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <p className="font-medium text-ink">{item.category.name}</p>
                      <p className="text-ink/70">
                        {formatCny(item.amount)} · {ratio.toFixed(0)}%
                      </p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-ink/10">
                      <div className="h-2 rounded-full bg-sky" style={{ width: `${width}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            {monthDistribution.length === 0 && <p className="mt-2 text-sm text-ink/60">本月还没有支出记录。</p>}
          </section>

          <section className="card-surface p-4">
            <h3 className="section-title">最近 7 天支出趋势</h3>
            <div className="mt-3 space-y-2">
              {sevenDayTrend.map((item) => (
                <div key={item.date} className="rounded-xl border border-ink/10 bg-white p-3">
                  <div className="flex items-center justify-between text-xs text-ink/65">
                    <span>{item.date.slice(5)}</span>
                    <span>{formatCny(item.amount)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-ink/10">
                    <div className="h-2 rounded-full bg-mint" style={{ width: `${(item.amount / maxTrendAmount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">本周收入 / 支出</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {formatCny(weekIncomeTotal)} / {formatCny(weekExpenseTotal)}
                </p>
              </article>
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">本月收入 / 支出</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {formatCny(monthIncomeTotal)} / {formatCny(monthExpenseTotal)}
                </p>
              </article>
            </div>
          </section>
        </section>
      )}

      {activeTab === "saving_goal" && (
        <section className="card-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="section-title">攒钱目标</h3>
            <button
              type="button"
              onClick={openCreateGoal}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75"
            >
              + 新建目标
            </button>
          </div>

          <p className="mt-2 text-xs text-ink/60">可手动更新进度，也可用本月结余快速追加。</p>

          <ul className="mt-3 space-y-2">
            {savingGoals.map((goal) => {
              const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              return (
                <li key={goal.id} className="rounded-xl border border-ink/10 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-ink">{goal.title}</p>
                      <p className="mt-1 text-xs text-ink/60">
                        目标 {formatCny(goal.targetAmount)} · 已攒 {formatCny(goal.currentAmount)} · 剩余 {formatCny(remaining)}
                      </p>
                      {goal.deadline && <p className="mt-1 text-xs text-ink/60">截止：{goal.deadline}</p>}
                    </div>
                    <span className={`badge ${goal.completed ? "border-mint/45 bg-mint/15 text-ink/75" : "border-ink/15 bg-white text-ink/65"}`}>
                      {goal.completed ? "已完成" : "进行中"}
                    </span>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-ink/10">
                    <div className="h-2 rounded-full bg-mint" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEditGoal(goal)}
                      className="rounded-lg border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/75"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSavingGoal(goal.id)}
                      className="rounded-lg border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/75"
                    >
                      删除
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSavingGoal(goal.id, !goal.completed)}
                      className="rounded-lg border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/75"
                    >
                      {goal.completed ? "取消完成" : "标记完成"}
                    </button>
                    <button
                      type="button"
                      onClick={() => appendMonthRemainingToGoal(goal.id)}
                      className="rounded-lg border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/75"
                    >
                      追加本月结余
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {savingGoals.length === 0 && <p className="mt-2 text-sm text-ink/60">还没有攒钱目标，先创建一个小目标。</p>}
        </section>
      )}

      {activeTab === "review_link" && (
        <section className="space-y-3">
          <section className="card-surface p-4">
            <h3 className="section-title">复盘联动摘要</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">本周非必要支出</p>
                <p className="mt-1 text-lg font-semibold text-ink">{formatCny(weekUnnecessaryExpense)}</p>
              </article>
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">疑似冲动消费</p>
                <p className="mt-1 text-lg font-semibold text-ink">{impulseCount} 笔</p>
              </article>
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">浪费时间关联分类</p>
                <p className="mt-1 text-sm font-semibold text-ink">{findCategoryName(expenseCategories, wastedLinkedCategoryId)}</p>
              </article>
              <article className="rounded-xl border border-ink/10 bg-white p-3">
                <p className="text-xs text-ink/60">本周复盘天数</p>
                <p className="mt-1 text-sm font-semibold text-ink">{weekReviews.length} 天</p>
              </article>
            </div>
          </section>

          <section className="card-surface p-4">
            <h3 className="section-title">轻量建议</h3>
            <ul className="mt-3 space-y-2">
              {reviewTips.map((tip, index) => (
                <li key={`${tip}_${index}`} className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink/75">
                  {tip}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/profile?tab=review" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75">
                去晚间复盘
              </Link>
              <Link href="/finance" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75">
                返回记账主页
              </Link>
            </div>
          </section>
        </section>
      )}

      {hint && <p className="px-1 text-center text-xs text-ink/65">{hint}</p>}

      <BottomSheet
        open={showBudgetSheet}
        title={categoryBudgets[budgetCategoryId] !== undefined ? "编辑分类预算" : "新增分类预算"}
        onClose={() => setShowBudgetSheet(false)}
      >
        <form onSubmit={onSubmitCategoryBudget} className="space-y-3">
          <select
            value={budgetCategoryId}
            onChange={(event) => setBudgetCategoryId(event.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          >
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            value={budgetAmountInput}
            onChange={(event) => setBudgetAmountInput(event.target.value)}
            inputMode="decimal"
            placeholder="预算金额"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />

          <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存分类预算
          </button>
        </form>
      </BottomSheet>

      <BottomSheet open={showGoalSheet} title={editingGoalId ? "编辑攒钱目标" : "新建攒钱目标"} onClose={() => setShowGoalSheet(false)}>
        <form onSubmit={onSubmitSavingGoal} className="space-y-3">
          <input
            value={goalTitle}
            onChange={(event) => setGoalTitle(event.target.value)}
            placeholder="目标名称"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              value={goalTargetInput}
              onChange={(event) => setGoalTargetInput(event.target.value)}
              inputMode="decimal"
              placeholder="目标金额"
              className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
            />
            <input
              value={goalCurrentInput}
              onChange={(event) => setGoalCurrentInput(event.target.value)}
              inputMode="decimal"
              placeholder="当前已攒"
              className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </div>

          <input
            type="date"
            value={goalDeadline}
            onChange={(event) => setGoalDeadline(event.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />

          <textarea
            value={goalNote}
            onChange={(event) => setGoalNote(event.target.value)}
            rows={3}
            placeholder="备注（可选）"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />

          <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存目标
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
