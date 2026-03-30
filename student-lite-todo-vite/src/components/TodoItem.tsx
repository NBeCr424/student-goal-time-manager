import { Priority, Todo } from "../types";
import { formatDate } from "../lib/date";

interface TodoItemProps {
  todo: Todo;
  depth: number;
  goalName?: string;
  onToggle: (id: string, next?: boolean) => void;
  onPriority: (id: string, priority: Priority) => void;
  onFocus: (id: string) => void;
}

const priorityLabel: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const priorityTone: Record<Priority, string> = {
  high: "text-warn",
  medium: "text-brand-dark",
  low: "text-slate-600",
};

export function TodoItem({ todo, depth, goalName, onToggle, onPriority, onFocus }: TodoItemProps) {
  return (
    <li className="rounded-2xl border border-brand/20 bg-white p-3" style={{ marginLeft: `${depth * 12}px` }}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.isDone}
          onChange={() => onToggle(todo.id)}
          aria-label={`完成 ${todo.title}`}
          className="mt-1 h-5 w-5"
        />
        <div className="flex-1">
          <p className={`text-sm font-medium ${todo.isDone ? "line-through text-slate-400" : "text-slate-800"}`}>{todo.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(todo.dueDate)} {goalName ? `· ${goalName}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["high", "medium", "low"] as Priority[]).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => onPriority(todo.id, priority)}
                className={`min-h-12 rounded-xl border px-3 text-xs font-semibold ${
                  todo.priority === priority ? "border-brand bg-brand-soft text-brand-dark" : "border-slate-200 text-slate-500"
                }`}
              >
                {priorityLabel[priority]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onFocus(todo.id)}
              className="min-h-12 rounded-xl border border-brand/30 px-3 text-xs font-semibold text-brand-dark"
            >
              开始计时
            </button>
          </div>
        </div>
        <span className={`text-xs font-semibold ${priorityTone[todo.priority]}`}>{priorityLabel[todo.priority]}</span>
      </div>
    </li>
  );
}
