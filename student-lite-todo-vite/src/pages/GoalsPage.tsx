import { FormEvent, useMemo, useState } from "react";
import { GoalCard } from "../components/GoalCard";
import { useAppData } from "../store/useAppData";
import { useToast } from "../components/ToastProvider";

export function GoalsPage() {
  const { goals, todos, createGoal, oneClickBreakdown } = useAppData();
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");

  const progressByGoal = useMemo(() => {
    const map = new Map<string, number>();

    goals.forEach((goal) => {
      const related = todos.filter((todo) => todo.goalId === goal.id);
      if (related.length === 0) {
        map.set(goal.id, 0);
        return;
      }
      const done = related.filter((todo) => todo.isDone).length;
      map.set(goal.id, Math.round((done / related.length) * 100));
    });

    return map;
  }, [goals, todos]);

  async function submitGoal(event: FormEvent) {
    event.preventDefault();
    const goal = await createGoal(name, deadline);
    if (!goal) {
      pushToast("请输入目标名称和截止时间");
      return;
    }
    setName("");
    setDeadline("");
    pushToast("目标已创建");
  }

  async function handleBreakdown(goalId: string) {
    const count = await oneClickBreakdown(goalId);
    pushToast(count > 0 ? `已生成 ${count} 条待办` : "未生成待办");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitGoal} className="rounded-2xl border border-brand/20 bg-white p-3">
        <h2 className="text-sm font-semibold text-brand-dark">新建目标</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="目标名称"
            aria-label="目标名称"
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
          />
          <input
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            type="date"
            aria-label="目标截止日期"
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
          />
          <button type="submit" className="min-h-12 rounded-xl bg-brand px-3 text-sm font-semibold text-white">
            新建目标
          </button>
        </div>
      </form>

      <section className="space-y-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            id={goal.id}
            name={goal.name}
            deadline={goal.deadline}
            progress={progressByGoal.get(goal.id) ?? 0}
            onBreakdown={handleBreakdown}
          />
        ))}
        {goals.length === 0 && (
          <p className="rounded-2xl border border-brand/20 bg-white px-3 py-6 text-center text-sm text-slate-600">暂无目标</p>
        )}
      </section>
    </div>
  );
}
