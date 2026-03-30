"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";
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

export function FinanceSpecialPage() {
  const { state, actions } = useAppStore();

  const [openSheet, setOpenSheet] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [hint, setHint] = useState("");

  const spentMap = useMemo(() => {
    const map = new Map<string, number>();
    state.specialBudgetRecords.forEach((record) => {
      map.set(record.specialBudgetId, (map.get(record.specialBudgetId) ?? 0) + record.amount);
    });
    return map;
  }, [state.specialBudgetRecords]);

  const recordCountMap = useMemo(() => {
    const map = new Map<string, number>();
    state.specialBudgetRecords.forEach((record) => {
      map.set(record.specialBudgetId, (map.get(record.specialBudgetId) ?? 0) + 1);
    });
    return map;
  }, [state.specialBudgetRecords]);

  const budgets = useMemo(
    () =>
      [...state.specialBudgets].sort((a, b) => `${b.updatedAt}-${b.createdAt}`.localeCompare(`${a.updatedAt}-${a.createdAt}`)),
    [state.specialBudgets],
  );

  function openCreateSheet() {
    setEditingBudgetId(null);
    setName("");
    setTotalAmount("");
    setStartDate("");
    setEndDate("");
    setNote("");
    setOpenSheet(true);
  }

  function openEditSheet(budgetId: string) {
    const budget = state.specialBudgets.find((item) => item.id === budgetId);
    if (!budget) {
      return;
    }
    setEditingBudgetId(budget.id);
    setName(budget.name);
    setTotalAmount(`${budget.totalAmount}`);
    setStartDate(budget.startDate ?? "");
    setEndDate(budget.endDate ?? "");
    setNote(budget.note ?? "");
    setOpenSheet(true);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(totalAmount);
    if (!name.trim()) {
      setHint("请先填写专项预算名称。");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setHint("预算金额需要大于 0。");
      return;
    }

    const input = {
      name: name.trim(),
      totalAmount: amount,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      note: note.trim() || undefined,
    };

    if (editingBudgetId) {
      actions.updateSpecialBudget(editingBudgetId, input);
      setHint("专项预算已更新。");
    } else {
      actions.addSpecialBudget(input);
      setHint("专项预算已创建。");
    }

    setOpenSheet(false);
  }

  function onDeleteBudget(budgetId: string) {
    actions.deleteSpecialBudget(budgetId);
    setHint("专项预算已删除。");
  }

  return (
    <div className="space-y-4 pb-2">
      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="soft-label">独立预算</p>
            <h2 className="section-title">专项预算</h2>
            <p className="mt-1 text-sm text-ink/70">旅游、活动、设备等专项开支独立记录，不计入月支出统计。</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/finance" className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs text-ink/70">
              返回记账
            </Link>
            <button
              type="button"
              onClick={openCreateSheet}
              className="rounded-xl bg-ink px-3 py-2 text-xs font-medium text-white"
            >
              + 新建专项预算
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        {budgets.map((budget) => {
          const spent = spentMap.get(budget.id) ?? 0;
          const remaining = budget.totalAmount - spent;
          const progress = budget.totalAmount > 0 ? Math.min(100, (spent / budget.totalAmount) * 100) : 0;
          const recordCount = recordCountMap.get(budget.id) ?? 0;

          return (
            <article key={budget.id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/finance/special/${budget.id}`} className="text-base font-semibold text-ink hover:underline">
                    {budget.name}
                  </Link>
                  <p className="mt-1 text-xs text-ink/60">
                    总预算 {formatCny(budget.totalAmount)} · 已使用 {formatCny(spent)} · 剩余 {formatCny(remaining)}
                  </p>
                  {(budget.startDate || budget.endDate) && (
                    <p className="mt-1 text-xs text-ink/60">
                      {budget.startDate ?? "未设置"} - {budget.endDate ?? "未设置"}
                    </p>
                  )}
                  {budget.note && <p className="mt-1 text-xs text-ink/60">备注：{budget.note}</p>}
                </div>
                <span className="badge border-ink/15 bg-white text-ink/65">{recordCount} 笔</span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-ink/10">
                <div
                  className={`h-2 rounded-full ${remaining >= 0 ? "bg-mint" : "bg-red-500"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/finance/special/${budget.id}`}
                  className="rounded-lg border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/75"
                >
                  查看详情
                </Link>
                <button
                  type="button"
                  onClick={() => openEditSheet(budget.id)}
                  className="rounded-lg border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/75"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteBudget(budget.id)}
                  className="rounded-lg border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/75"
                >
                  删除
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {budgets.length === 0 && (
        <section className="card-surface p-4">
          <p className="text-sm text-ink/60">还没有专项预算，先创建一个目标预算吧。</p>
        </section>
      )}

      {hint && <p className="text-center text-xs text-ink/65">{hint}</p>}

      <BottomSheet open={openSheet} title={editingBudgetId ? "编辑专项预算" : "新建专项预算"} onClose={() => setOpenSheet(false)}>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="预算名称（如：旅游预算）"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <input
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
            inputMode="decimal"
            placeholder="总预算金额"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="备注（可选）"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
            保存专项预算
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
