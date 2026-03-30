import { daysUntil } from "../lib/date";

interface GoalCardProps {
  id: string;
  name: string;
  deadline: string;
  progress: number;
  onBreakdown: (goalId: string) => void;
}

export function GoalCard({ id, name, deadline, progress, onBreakdown }: GoalCardProps) {
  const days = daysUntil(deadline);

  return (
    <article className="rounded-2xl border border-brand/20 bg-white p-3">
      <p className="text-sm font-semibold text-brand-dark">{name}</p>
      <div className="mt-2 h-2 rounded-full bg-brand-soft">
        <div className="h-2 rounded-full bg-brand" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        <span>截止 {deadline}</span>
        <span>{days >= 0 ? `剩余 ${days} 天` : "已过期"}</span>
      </div>
      <button
        type="button"
        className="mt-3 min-h-12 w-full rounded-xl border border-brand/30 text-sm font-medium text-brand-dark"
        onClick={() => onBreakdown(id)}
      >
        一键拆解为待办
      </button>
    </article>
  );
}
