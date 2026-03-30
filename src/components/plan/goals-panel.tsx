"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { addDays, todayKey, toDateKey } from "@/lib/date";
import { calculateGoalProgress } from "@/lib/goal-progress";
import { Goal, GoalPriority, NewGoalInput } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

interface CreateGoalDraft {
  title: string;
  deadline: string;
  priority: GoalPriority;
  specific: string;
  measurable: string;
}

const defaultDraft: CreateGoalDraft = {
  title: "",
  deadline: toDateKey(addDays(new Date(), 30)),
  priority: "medium",
  specific: "",
  measurable: "",
};

function toGoalInput(draft: CreateGoalDraft): NewGoalInput {
  const cleanTitle = draft.title.trim();
  return {
    title: cleanTitle,
    description: draft.specific.trim() || cleanTitle,
    smart: {
      specific: draft.specific.trim() || cleanTitle,
      measurable: draft.measurable.trim(),
      achievable: "",
      relevant: "",
      timeBound: draft.deadline ? `截止于 ${draft.deadline}` : "",
    },
    deadline: draft.deadline,
    estimatedTotalHours: 1,
    suggestedSessionMinutes: 60,
    preferredTimeOfDay: "flexible",
    priority: draft.priority,
    includeInCalendar: false,
  };
}

// Inline checklist + assign panel for one goal
function GoalCard({ goal }: { goal: Goal }) {
  const { state, actions } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [assignItemId, setAssignItemId] = useState<string | null>(null);
  const [assignDate, setAssignDate] = useState(todayKey());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const today = todayKey();
  const tomorrow = toDateKey(addDays(new Date(), 1));

  const progress = calculateGoalProgress(goal, state.tasks);
  const linkedTasks = state.tasks.filter((t) => t.goalId === goal.id);
  const hasTodayTask = linkedTasks.some((t) => t.planType !== "weekly" && t.dueDate === today);

  function addItem(e: FormEvent) {
    e.preventDefault();
    const clean = newItem.trim();
    if (!clean) return;
    actions.addGoalBreakdownItem(goal.id, clean);
    setNewItem("");
  }

  function assignItem(itemId: string, date: string) {
    const item = goal.breakdownItems.find((i) => i.id === itemId);
    if (!item) return;
    actions.distributeGoalTaskToPlan(goal.id, item.title, "today_other", date, { durationMinutes: 45 }, itemId);
    setAssignItemId(null);
  }

  return (
    <article className="rounded-2xl border border-ink/10 bg-white">
      {/* header */}
      <div className="flex items-start gap-2 p-3">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{goal.title}</span>
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${hasTodayTask ? "bg-mint/20 text-ink/70" : "bg-amber-50 text-amber-700"}`}>
              {hasTodayTask ? "今日已排" : "今日未排"}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink/55">截止 {goal.deadline} · {progress.percent}% 完成</p>
          <div className="mt-1.5 h-1.5 rounded-full bg-ink/10">
            <div className="h-1.5 rounded-full bg-mint transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
        </button>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full border border-ink/15 px-2 py-0.5 text-xs text-ink/60"
          >
            ···
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 min-w-28 rounded-xl border border-ink/15 bg-white p-1 shadow-card">
              <Link
                href={`/goals/${goal.id}`}
                className="block rounded-lg px-3 py-1.5 text-xs text-ink/75 hover:bg-ink/5"
                onClick={() => setMenuOpen(false)}
              >
                查看详情
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm(`确认删除目标「${goal.title}」？此操作不可撤销。`)) {
                    actions.deleteGoal(goal.id);
                  }
                }}
                className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
              >
                删除目标
              </button>
            </div>
          )}
        </div>
      </div>

      {/* checklist */}
      {expanded && (
        <div className="border-t border-ink/8 px-3 pb-3 pt-2">
          <p className="mb-2 text-[11px] text-ink/50">清单 · 点击分配到某天</p>
          <ul className="space-y-1.5">
            {goal.breakdownItems.map((item) => (
              <li key={item.id}>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => actions.toggleGoalBreakdownItem(goal.id, item.id)}
                    className="h-4 w-4 shrink-0 accent-mint"
                  />
                  <span className={`min-w-0 flex-1 text-sm ${item.completed ? "line-through text-ink/40" : "text-ink"}`}>
                    {item.title}
                  </span>
                  {!item.completed && (
                    <button
                      type="button"
                      onClick={() => setAssignItemId(assignItemId === item.id ? null : item.id)}
                      className="shrink-0 rounded-lg border border-ink/15 px-2 py-0.5 text-[11px] text-ink/60"
                    >
                      分配
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => actions.deleteGoalBreakdownItem(goal.id, item.id)}
                    className="shrink-0 text-[11px] text-ink/30 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>

                {/* inline assign panel */}
                {assignItemId === item.id && (
                  <div className="ml-6 mt-1.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-ink/10 bg-paper p-2">
                    <button
                      type="button"
                      onClick={() => assignItem(item.id, today)}
                      className="rounded-lg border border-ink/15 bg-white px-2.5 py-1 text-xs text-ink/70"
                    >
                      今日
                    </button>
                    <button
                      type="button"
                      onClick={() => assignItem(item.id, tomorrow)}
                      className="rounded-lg border border-ink/15 bg-white px-2.5 py-1 text-xs text-ink/70"
                    >
                      明日
                    </button>
                    <input
                      type="date"
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                      className="rounded-lg border border-ink/15 bg-white px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => assignItem(item.id, assignDate)}
                      className="rounded-lg bg-ink px-2.5 py-1 text-xs text-white"
                    >
                      确认
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* add item */}
          <form onSubmit={addItem} className="mt-2 flex gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="添加清单项…"
              className="flex-1 rounded-xl border border-ink/15 px-3 py-1.5 text-sm"
            />
            <button type="submit" className="rounded-xl bg-ink px-3 py-1.5 text-xs font-medium text-white">
              +
            </button>
          </form>

          {goal.breakdownItems.length === 0 && (
            <p className="mt-1 text-xs text-ink/45">还没有清单项，添加后可分配到具体日期。</p>
          )}
        </div>
      )}
    </article>
  );
}

export function GoalsPanel() {
  const { state, actions } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [draft, setDraft] = useState<CreateGoalDraft>(defaultDraft);

  const activeGoals = useMemo(
    () => state.goals.filter((g) => g.status === "active" || g.status === "not_started"),
    [state.goals],
  );
  const completedGoals = useMemo(() => state.goals.filter((g) => g.status === "completed"), [state.goals]);
  const archivedGoals = useMemo(() => state.goals.filter((g) => g.status === "paused"), [state.goals]);

  function submitGoal(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    actions.addGoal(toGoalInput(draft));
    setDraft({ ...defaultDraft, deadline: toDateKey(addDays(new Date(), 30)) });
    setShowCreate(false);
  }

  return (
    <div className="space-y-4">
      {/* active goals */}
      <section className="card-surface p-4">
        <h3 className="section-title">长期目标</h3>
        <p className="mt-1 text-xs text-ink/55">展开目标可管理清单，点击分发到计划即可安排到具体日期。</p>
        <div className="mt-3 space-y-2">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          {activeGoals.length === 0 && <p className="text-sm text-ink/55">还没有进行中的目标。</p>}
        </div>
      </section>

      {/* create */}
      <section className="card-surface p-4">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-ink">+ 新建目标</span>
          <span className="text-xs text-ink/50">{showCreate ? "收起" : "展开"}</span>
        </button>

        {showCreate && (
          <form onSubmit={submitGoal} className="mt-3 space-y-2">
            <input
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="目标名称，例如：英语六级 560+"
              className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
              autoFocus
            />
            <textarea
              value={draft.specific}
              onChange={(e) => setDraft((p) => ({ ...p, specific: e.target.value }))}
              rows={2}
              placeholder="具体说明（可选）：要达成什么、怎么衡量"
              className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-ink/60">
                截止日期
                <input
                  type="date"
                  value={draft.deadline}
                  onChange={(e) => setDraft((p) => ({ ...p, deadline: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-ink/60">
                优先级
                <select
                  value={draft.priority}
                  onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value as GoalPriority }))}
                  className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </label>
            </div>
            <button type="submit" className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
              创建目标
            </button>
          </form>
        )}
      </section>

      {/* history */}
      <section className="card-surface p-4">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-ink">历史目标</span>
          <span className="text-xs text-ink/50">{showHistory ? "收起" : "展开"}</span>
        </button>
        {showHistory && (
          <div className="mt-3 space-y-1">
            {[...completedGoals, ...archivedGoals].map((g) => (
              <p key={g.id} className="text-sm text-ink/60">
                {g.status === "completed" ? "✓" : "—"} {g.title}
              </p>
            ))}
            {completedGoals.length === 0 && archivedGoals.length === 0 && (
              <p className="text-xs text-ink/45">暂无历史目标。</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
