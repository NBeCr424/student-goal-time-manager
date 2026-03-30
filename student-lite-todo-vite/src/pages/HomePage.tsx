import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PrimaryActionBar } from "../components/PrimaryActionBar";
import { todayKey } from "../lib/date";
import { useAppData } from "../store/useAppData";

export function HomePage() {
  const { goals, todos, focusSessions } = useAppData();

  const todayTodos = useMemo(() => todos.filter((todo) => todo.dueDate === todayKey()), [todos]);
  const doneToday = todayTodos.filter((todo) => todo.isDone).length;

  return (
    <div className="space-y-4">
      <PrimaryActionBar />

      <section className="rounded-2xl border border-brand/20 bg-white p-3">
        <h2 className="text-sm font-semibold text-brand-dark">今日概览</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">今日待办 {todayTodos.length}</p>
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">已完成 {doneToday}</p>
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">专注记录 {focusSessions.length}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand/20 bg-white p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-dark">最近目标</h2>
          <Link to="/goals" className="min-h-12 rounded-xl px-3 text-sm font-semibold text-brand-dark">
            查看全部
          </Link>
        </div>
        <ul className="mt-2 space-y-2">
          {goals.slice(0, 3).map((goal) => (
            <li key={goal.id} className="rounded-xl bg-brand-soft px-3 py-2 text-sm">
              {goal.name} · {goal.deadline}
            </li>
          ))}
        </ul>
        {goals.length === 0 && <p className="mt-2 text-sm text-slate-600">还没有目标，先创建一个学习目标。</p>}
      </section>

      <section className="rounded-2xl border border-brand/20 bg-white p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-dark">今日待办</h2>
          <Link to="/todos" className="min-h-12 rounded-xl px-3 text-sm font-semibold text-brand-dark">
            打开清单
          </Link>
        </div>
        <ul className="mt-2 space-y-2">
          {todayTodos.slice(0, 4).map((todo) => (
            <li key={todo.id} className="rounded-xl bg-brand-soft px-3 py-2 text-sm">
              {todo.isDone ? "✓" : "○"} {todo.title}
            </li>
          ))}
        </ul>
        {todayTodos.length === 0 && <p className="mt-2 text-sm text-slate-600">今天还没有待办，点击上方按钮快速创建。</p>}
      </section>
    </div>
  );
}
