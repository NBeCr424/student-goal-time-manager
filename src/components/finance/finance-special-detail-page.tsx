"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { todayKey } from "@/lib/date";
import { useAppStore } from "@/store/app-store";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

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

function getCategoryName(categories: Array<{ id: string; name: string }>, categoryId: string): string {
  return categories.find((item) => item.id === categoryId)?.name ?? "未分类";
}

export function FinanceSpecialDetailPage({ budgetId }: { budgetId: string }) {
  const { state, actions } = useAppStore();
  const today = todayKey();

  const budget = state.specialBudgets.find((item) => item.id === budgetId);
  const expenseCategories = useMemo(
    () => state.financeCategories.filter((item) => item.type === "expense").sort((a, b) => a.order - b.order),
    [state.financeCategories],
  );

  const records = useMemo(
    () =>
      state.specialBudgetRecords
        .filter((record) => record.specialBudgetId === budgetId)
        .sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`)),
    [budgetId, state.specialBudgetRecords],
  );

  const spent = useMemo(() => records.reduce((sum, record) => sum + record.amount, 0), [records]);
  const remaining = (budget?.totalAmount ?? 0) - spent;
  const progress = budget && budget.totalAmount > 0 ? Math.min(100, (spent / budget.totalAmount) * 100) : 0;

  const [openSheet, setOpenSheet] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [dateInput, setDateInput] = useState(today);
  const [categoryId, setCategoryId] = useState(() => expenseCategories[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [hint, setHint] = useState("");

  if (!budget) {
    return (
      <section className="card-surface p-4">
        <h2 className="section-title">专项预算不存在</h2>
        <p className="mt-2 text-sm text-ink/65">可能已删除或链接已失效。</p>
        <Link href="/finance/special" className="mt-3 inline-flex rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/75">
          返回专项预算
        </Link>
      </section>
    );
  }

  function onOpenSheet() {
    setAmountInput("");
    setDateInput(today);
    setCategoryId(expenseCategories[0]?.id ?? "");
    setNote("");
    setOpenSheet(true);
  }

  function onSubmitRecord(event: FormEvent) {
    event.preventDefault();
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setHint("请输入大于 0 的金额。");
      return;
    }
    if (!categoryId) {
      setHint("请先选择分类。");
      return;
    }

    actions.addSpecialBudgetRecord({
      specialBudgetId: budgetId,
      amount,
      categoryId,
      date: dateInput,
      note,
    });

    setOpenSheet(false);
    setHint("专项记录已添加。该记录不会计入月支出。");
  }

  function onDeleteRecord(recordId: string) {
    actions.deleteSpecialBudgetRecord(recordId);
    setHint("该专项记录已删除。");
  }

  return (
    <div className="space-y-4 pb-2">
      <section className="card-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="soft-label">专项预算详情</p>
            <h2 className="section-title">{budget.name}</h2>
            <p className="mt-1 text-sm text-ink/70">专项记录独立统计，不影响普通月预算。</p>
          </div>
          <Link href="/finance/special" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
            返回列表
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">总预算</p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCny(budget.totalAmount)}</p>
          </article>
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">已使用</p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatCny(spent)}</p>
          </article>
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">剩余金额</p>
            <p className={`mt-1 text-lg font-semibold ${remaining >= 0 ? "text-ink" : "text-red-600"}`}>{formatCny(remaining)}</p>
          </article>
        </div>

        <div className="mt-3 h-2 rounded-full bg-ink/10">
          <div className={`h-2 rounded-full ${remaining >= 0 ? "bg-mint" : "bg-red-500"}`} style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink/65">
          {budget.startDate && <span>开始：{budget.startDate}</span>}
          {budget.endDate && <span>截止：{budget.endDate}</span>}
          {budget.note && <span>备注：{budget.note}</span>}
        </div>

        <button type="button" onClick={onOpenSheet} className="mt-3 rounded-xl bg-ink px-3 py-2 text-xs font-medium text-white">
          + 记一笔
        </button>
      </section>

      <section className="card-surface p-4">
        <h3 className="section-title">专项消费记录</h3>
        <ul className="mt-3 space-y-2">
          {records.map((record) => (
            <li key={record.id} className="rounded-xl border border-ink/10 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{getCategoryName(expenseCategories, record.categoryId)}</p>
                  <p className="mt-1 text-xs text-ink/60">
                    {record.date}
                    {record.note ? ` · ${record.note}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">-{formatCny(record.amount)}</p>
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(record.id)}
                    className="mt-1 rounded-lg border border-ink/15 bg-paper px-2 py-1 text-[11px] text-ink/70"
                  >
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {records.length === 0 && <p className="mt-2 text-sm text-ink/60">还没有专项记录，先添加第一笔。</p>}
      </section>

      {hint && <p className="text-center text-xs text-ink/65">{hint}</p>}

      <BottomSheet open={openSheet} title="新增专项支出" onClose={() => setOpenSheet(false)}>
        <form onSubmit={onSubmitRecord} className="space-y-3">
          <input
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            inputMode="decimal"
            placeholder="金额"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          >
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="备注（可选）"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存记录
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
