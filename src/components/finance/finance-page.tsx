"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { todayKey } from "@/lib/date";
import { getMonthKey, summarizeFinance } from "@/lib/finance";
import { FinanceCategory, FinanceRecordType } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function formatCny(value: number): string {
  return `¥${value.toFixed(2)}`;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}年${month}月`;
}

function typeLabel(type: FinanceRecordType): string {
  return type === "expense" ? "支出" : "收入";
}

function findCategoryName(categories: FinanceCategory[], categoryId: string): string {
  return categories.find((item) => item.id === categoryId)?.name ?? "未分类";
}

interface FoldCardProps {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function FoldCard({ title, summary, open, onToggle, children }: FoldCardProps) {
  return (
    <section className="card-surface p-4">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <h3 className="section-title">{title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-ink/65">{summary}</p>
        </div>
        <span className="shrink-0 text-base text-ink/55">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

export function FinancePage() {
  const { state, actions } = useAppStore();
  const today = todayKey();
  const currentMonth = getMonthKey(today);

  const summary = useMemo(
    () => summarizeFinance(state.financeRecords, state.financeCategories, state.budgetPlans, today),
    [state.budgetPlans, state.financeCategories, state.financeRecords, today],
  );

  const topExpenseCategoryName = useMemo(() => {
    if (!summary.topExpenseCategoryId) {
      return "暂无";
    }
    return findCategoryName(state.financeCategories, summary.topExpenseCategoryId);
  }, [state.financeCategories, summary.topExpenseCategoryId]);

  const allRecentRecords = useMemo(
    () => [...state.financeRecords].sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`)),
    [state.financeRecords],
  );

  const budgetUsage = summary.monthBudget > 0 ? Math.min(100, (summary.monthExpense / summary.monthBudget) * 100) : 0;
  const monthNet = summary.monthIncome - summary.monthExpense;

  const [recordType, setRecordType] = useState<FinanceRecordType>("expense");
  const [amountInput, setAmountInput] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
    const firstExpense = state.financeCategories.find((item) => item.type === "expense");
    return firstExpense?.id ?? "";
  });
  const [recordDate, setRecordDate] = useState(today);
  const [note, setNote] = useState("");
  const [budgetInput, setBudgetInput] = useState(`${summary.monthBudget || 0}`);
  const [hint, setHint] = useState("");

  const [openSpendingSummary, setOpenSpendingSummary] = useState(false);
  const [openBudgetRecords, setOpenBudgetRecords] = useState(false);
  const [openMore, setOpenMore] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);

  const categories = useMemo(
    () => state.financeCategories.filter((item) => item.type === recordType).sort((a, b) => a.order - b.order),
    [recordType, state.financeCategories],
  );

  useEffect(() => {
    if (!categories.some((item) => item.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0]?.id ?? "");
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    setBudgetInput(`${summary.monthBudget || 0}`);
  }, [summary.monthBudget]);

  function onSwitchType(type: FinanceRecordType) {
    setRecordType(type);
    const firstCategory = state.financeCategories.find((item) => item.type === type);
    setSelectedCategoryId(firstCategory?.id ?? "");
  }

  function onSubmitRecord(event: FormEvent) {
    event.preventDefault();
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setHint("请输入大于 0 的金额。");
      return;
    }
    if (!selectedCategoryId) {
      setHint("请先选择分类。");
      return;
    }

    actions.addFinanceRecord({
      type: recordType,
      amount,
      categoryId: selectedCategoryId,
      date: recordDate,
      note,
    });

    setAmountInput("");
    setNote("");
    setHint("已保存记账记录。");
  }

  function onSaveBudget(event: FormEvent) {
    event.preventDefault();
    const amount = Number(budgetInput);
    if (!Number.isFinite(amount) || amount < 0) {
      setHint("预算金额不能小于 0。");
      return;
    }
    actions.setMonthlyBudget(currentMonth, amount);
    setHint("本月预算已更新。");
  }

  const visibleRecords = showAllRecords ? allRecentRecords : allRecentRecords.slice(0, 3);
  const budgetSummary =
    summary.monthBudget > 0 ? `预算 ${formatCny(summary.monthBudget)} · 已用 ${budgetUsage.toFixed(0)}%` : "还未设置本月预算";
  const spendingSummary = `本月支出 ${formatCny(summary.monthExpense)}，最高支出分类：${topExpenseCategoryName}`;

  return (
    <div className="space-y-4">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="soft-label">我的 · 记账与预算</p>
            <h2 className="section-title">超轻记账</h2>
          </div>
          <Link href="/profile" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75">
            返回我的
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-[11px] text-ink/60">今日支出</p>
            <p className="mt-1 text-sm font-semibold text-ink">{formatCny(summary.todayExpense)}</p>
          </article>
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-[11px] text-ink/60">本月支出</p>
            <p className="mt-1 text-sm font-semibold text-ink">{formatCny(summary.monthExpense)}</p>
          </article>
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-[11px] text-ink/60">预算剩余</p>
            <p className={`mt-1 text-sm font-semibold ${summary.monthRemaining >= 0 ? "text-ink" : "text-red-600"}`}>
              {formatCny(summary.monthRemaining)}
            </p>
          </article>
        </div>

        <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
          <div className="flex items-center justify-between gap-2 text-xs text-ink/65">
            <span>{monthLabel(currentMonth)}预算进度</span>
            <span>{summary.monthBudget > 0 ? `${budgetUsage.toFixed(0)}%` : "未设置预算"}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-ink/10">
            <div
              className={`h-2 rounded-full ${summary.monthRemaining >= 0 ? "bg-mint" : "bg-red-500"}`}
              style={{ width: `${summary.monthBudget > 0 ? Math.min(100, budgetUsage) : 0}%` }}
            />
          </div>
        </div>
      </section>

      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">快速记一笔</h3>
          <span className="badge border-ink/15 bg-white text-ink/60">高频</span>
        </div>

        <div className="mt-3 inline-flex rounded-full border border-ink/15 bg-white p-1">
          <button
            type="button"
            onClick={() => onSwitchType("expense")}
            className={`rounded-full px-3 py-1 text-sm ${recordType === "expense" ? "bg-ink text-white" : "text-ink/65"}`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => onSwitchType("income")}
            className={`rounded-full px-3 py-1 text-sm ${recordType === "income" ? "bg-ink text-white" : "text-ink/65"}`}
          >
            收入
          </button>
        </div>

        <form className="mt-3 space-y-2" onSubmit={onSubmitRecord}>
          <input
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            inputMode="decimal"
            placeholder="金额，例如 18.5"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-3 text-2xl font-semibold outline-none ring-mint/50 focus:ring"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={recordDate}
              onChange={(event) => setRecordDate(event.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
            />
          </div>

          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="备注（可选）"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
          />

          <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存记录
          </button>
        </form>
      </section>

      <FoldCard
        title="消费建议"
        summary={spendingSummary}
        open={openSpendingSummary}
        onToggle={() => setOpenSpendingSummary((prev) => !prev)}
      >
        <div className="rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink/70">
          <p>今日支出：{formatCny(summary.todayExpense)}</p>
          <p className="mt-1">本月支出：{formatCny(summary.monthExpense)}</p>
          <p className="mt-1">本月收入：{formatCny(summary.monthIncome)}</p>
          <p className="mt-1">本月净额：{formatCny(monthNet)}</p>
          <p className="mt-1">最高支出分类：{topExpenseCategoryName}</p>
        </div>
      </FoldCard>

      <FoldCard
        title="预算与记录"
        summary={budgetSummary}
        open={openBudgetRecords}
        onToggle={() => setOpenBudgetRecords((prev) => !prev)}
      >
        <form className="flex flex-wrap items-end gap-2" onSubmit={onSaveBudget}>
          <div className="flex-1">
            <label htmlFor="budget_amount" className="text-xs text-ink/60">
              {monthLabel(currentMonth)}预算
            </label>
            <input
              id="budget_amount"
              value={budgetInput}
              onChange={(event) => setBudgetInput(event.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
            />
          </div>
          <button type="submit" className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/80">
            保存预算
          </button>
        </form>

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">最近记录</h4>
            {allRecentRecords.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllRecords((prev) => !prev)}
                className="text-xs text-ink/65 underline"
              >
                {showAllRecords ? "收起" : "查看全部记录"}
              </button>
            )}
          </div>

          <ul className="mt-2 space-y-2">
            {visibleRecords.map((record) => (
              <li key={record.id} className="rounded-xl border border-ink/10 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{findCategoryName(state.financeCategories, record.categoryId)}</p>
                    <p className="mt-0.5 text-xs text-ink/60">
                      {record.date} · {typeLabel(record.type)}
                      {record.note ? ` · ${record.note}` : ""}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${record.type === "expense" ? "text-red-600" : "text-mint-700"}`}>
                    {record.type === "expense" ? "-" : "+"}
                    {formatCny(record.amount)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {allRecentRecords.length === 0 && <p className="mt-2 text-sm text-ink/60">还没有记录，先记第一笔。</p>}
        </div>
      </FoldCard>

      <FoldCard
        title="更多预算与分析"
        summary="分类预算、消费统计、攒钱目标、复盘联动、专项预算"
        open={openMore}
        onToggle={() => setOpenMore((prev) => !prev)}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Link href="/finance/more" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink/75">
            分类预算 / 消费统计 / 攒钱目标 / 复盘联动
          </Link>
          <Link href="/finance/special" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink/75">
            专项预算
          </Link>
        </div>
      </FoldCard>

      {hint && <p className="px-1 text-center text-xs text-ink/65">{hint}</p>}
    </div>
  );
}
