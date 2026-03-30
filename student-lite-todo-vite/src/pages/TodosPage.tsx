import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TodoItem } from "../components/TodoItem";
import { todayKey } from "../lib/date";
import { Priority, Todo } from "../types";
import { useAppData } from "../store/useAppData";
import { useToast } from "../components/ToastProvider";

type FilterMode = "all" | "today";

interface FlatTodo {
  todo: Todo;
  depth: number;
}

function flattenTodos(todos: Todo[]): FlatTodo[] {
  const byParent = new Map<string | undefined, Todo[]>();

  for (const todo of todos) {
    const key = todo.parentId;
    const list = byParent.get(key) ?? [];
    list.push(todo);
    byParent.set(key, list);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const result: FlatTodo[] = [];

  function visit(parentId: string | undefined, depth: number) {
    const children = byParent.get(parentId) ?? [];
    children.forEach((todo) => {
      result.push({ todo, depth });
      visit(todo.id, depth + 1);
    });
  }

  visit(undefined, 0);
  return result.reverse();
}

export function TodosPage() {
  const { goals, todos, createTodo, toggleTodo, setTodoPriority } = useAppData();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayKey());
  const [priority, setPriority] = useState<Priority>("medium");
  const [goalId, setGoalId] = useState("");

  const filteredTodos = useMemo(() => {
    const target = filterMode === "today" ? todos.filter((todo) => todo.dueDate === todayKey()) : todos;
    return flattenTodos(target);
  }, [filterMode, todos]);

  const goalNameMap = useMemo(() => new Map(goals.map((goal) => [goal.id, goal.name])), [goals]);

  async function submitTodo(event: FormEvent) {
    event.preventDefault();
    const todo = await createTodo({
      title,
      dueDate,
      priority,
      goalId: goalId || undefined,
    });

    if (!todo) {
      pushToast("请输入待办内容");
      return;
    }

    setTitle("");
    pushToast("待办已添加");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitTodo} className="rounded-2xl border border-brand/20 bg-white p-3">
        <h2 className="text-sm font-semibold text-brand-dark">新建待办</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="待办内容"
            aria-label="待办内容"
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
          />
          <input
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            aria-label="待办日期"
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
          />
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            aria-label="优先级"
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <select
            value={goalId}
            onChange={(event) => setGoalId(event.target.value)}
            aria-label="关联目标"
            className="min-h-12 rounded-xl border border-brand/20 px-3 text-sm"
          >
            <option value="">不关联目标</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="mt-2 min-h-12 w-full rounded-xl bg-brand px-3 text-sm font-semibold text-white">
          新建待办
        </button>
      </form>

      <section className="rounded-2xl border border-brand/20 bg-white p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`min-h-12 flex-1 rounded-xl text-sm font-semibold ${filterMode === "all" ? "bg-brand text-white" : "border border-brand/20 text-brand-dark"}`}
          >
            全部
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("today")}
            className={`min-h-12 flex-1 rounded-xl text-sm font-semibold ${filterMode === "today" ? "bg-brand text-white" : "border border-brand/20 text-brand-dark"}`}
          >
            今日待办
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          {filteredTodos.map(({ todo, depth }) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              depth={depth}
              goalName={todo.goalId ? goalNameMap.get(todo.goalId) : undefined}
              onToggle={toggleTodo}
              onPriority={setTodoPriority}
              onFocus={(todoId) => navigate(`/focus?todo=${todoId}`)}
            />
          ))}
        </ul>

        {filteredTodos.length === 0 && <p className="py-6 text-center text-sm text-slate-600">当前筛选下暂无待办。</p>}
      </section>
    </div>
  );
}
