import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { buildGoalBreakdown } from "../lib/breakdown";
import { nowIso, todayKey } from "../lib/date";
import { idb, loadAllData } from "../lib/idb";
import { uid } from "../lib/id";
import { ActiveFocus, ExportSnapshot, FocusMode, FocusSession, FocusSessionStatus, Goal, Priority, Todo } from "../types";

interface CreateTodoInput {
  title: string;
  dueDate: string;
  priority: Priority;
  goalId?: string;
  parentId?: string;
}

interface AppDataContextValue {
  ready: boolean;
  goals: Goal[];
  todos: Todo[];
  focusSessions: FocusSession[];
  activeFocus: ActiveFocus | null;
  createGoal: (name: string, deadline: string) => Promise<Goal | null>;
  createTodo: (input: CreateTodoInput) => Promise<Todo | null>;
  toggleTodo: (todoId: string, next?: boolean) => Promise<void>;
  setTodoPriority: (todoId: string, priority: Priority) => Promise<void>;
  oneClickBreakdown: (goalId: string) => Promise<number>;
  startFocus: (mode: FocusMode, minutes: number, todoId?: string) => Promise<void>;
  pauseFocus: () => Promise<void>;
  resumeFocus: () => Promise<void>;
  endFocus: (status?: FocusSessionStatus) => Promise<void>;
  exportSnapshot: () => ExportSnapshot;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function normalizeHydratedFocus(activeFocus: ActiveFocus | null): ActiveFocus | null {
  if (!activeFocus || !activeFocus.running) {
    return activeFocus;
  }

  const now = new Date().getTime();
  const last = new Date(activeFocus.updatedAt).getTime();
  const delta = Math.max(0, Math.floor((now - last) / 1000));

  return {
    ...activeFocus,
    elapsedSeconds: activeFocus.elapsedSeconds + delta,
    updatedAt: nowIso(),
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [activeFocus, setActiveFocus] = useState<ActiveFocus | null>(null);

  useEffect(() => {
    let mounted = true;

    loadAllData()
      .then((data) => {
        if (!mounted) {
          return;
        }
        const normalizedFocus = normalizeHydratedFocus(data.activeFocus);
        setGoals(data.goals);
        setTodos(data.todos);
        setFocusSessions(data.focusSessions);
        setActiveFocus(normalizedFocus);
        if (normalizedFocus) {
          void idb.setActiveFocus(normalizedFocus);
        }
        setReady(true);
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeFocus || !activeFocus.running) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveFocus((prev) => {
        if (!prev || !prev.running) {
          return prev;
        }
        const next: ActiveFocus = {
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
          updatedAt: nowIso(),
        };
        void idb.setActiveFocus(next);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeFocus?.running]);

  const createGoal = async (name: string, deadline: string) => {
    const cleanName = name.trim();
    if (!cleanName || !deadline) {
      return null;
    }

    const now = nowIso();
    const goal: Goal = {
      id: uid("goal"),
      name: cleanName,
      deadline,
      createdAt: now,
      updatedAt: now,
    };

    setGoals((prev) => [goal, ...prev]);
    await idb.putGoal(goal);
    return goal;
  };

  const createTodo = async (input: CreateTodoInput) => {
    const title = input.title.trim();
    if (!title) {
      return null;
    }

    const now = nowIso();
    const todo: Todo = {
      id: uid("todo"),
      title,
      dueDate: input.dueDate || todayKey(),
      priority: input.priority,
      goalId: input.goalId,
      parentId: input.parentId,
      isDone: false,
      createdAt: now,
      updatedAt: now,
    };

    setTodos((prev) => [todo, ...prev]);
    await idb.putTodo(todo);
    return todo;
  };

  const toggleTodo = async (todoId: string, next?: boolean) => {
    let changed: Todo | null = null;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== todoId) {
          return todo;
        }
        changed = {
          ...todo,
          isDone: next ?? !todo.isDone,
          updatedAt: nowIso(),
        };
        return changed;
      }),
    );

    if (changed) {
      await idb.putTodo(changed);
    }
  };

  const setTodoPriority = async (todoId: string, priority: Priority) => {
    let changed: Todo | null = null;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== todoId) {
          return todo;
        }
        changed = {
          ...todo,
          priority,
          updatedAt: nowIso(),
        };
        return changed;
      }),
    );

    if (changed) {
      await idb.putTodo(changed);
    }
  };

  const oneClickBreakdown = async (goalId: string) => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) {
      return 0;
    }

    const breakdownTodos = buildGoalBreakdown(goal.id, goal.name, goal.deadline);
    setTodos((prev) => [...breakdownTodos, ...prev]);
    await idb.putTodos(breakdownTodos);
    return breakdownTodos.length;
  };

  const startFocus = async (mode: FocusMode, minutes: number, todoId?: string) => {
    const plannedSeconds = mode === "countdown" ? Math.max(60, Math.round(minutes * 60)) : 0;
    const focus: ActiveFocus = {
      mode,
      plannedSeconds,
      elapsedSeconds: 0,
      running: true,
      todoId,
      goalId: todoId ? todos.find((todo) => todo.id === todoId)?.goalId : undefined,
      startedAt: nowIso(),
      updatedAt: nowIso(),
    };

    setActiveFocus(focus);
    await idb.setActiveFocus(focus);
  };

  const pauseFocus = async () => {
    if (!activeFocus || !activeFocus.running) {
      return;
    }

    const next: ActiveFocus = {
      ...activeFocus,
      running: false,
      updatedAt: nowIso(),
    };
    setActiveFocus(next);
    await idb.setActiveFocus(next);
  };

  const resumeFocus = async () => {
    if (!activeFocus || activeFocus.running) {
      return;
    }

    const next: ActiveFocus = {
      ...activeFocus,
      running: true,
      updatedAt: nowIso(),
    };
    setActiveFocus(next);
    await idb.setActiveFocus(next);
  };

  const endFocus = async (status: FocusSessionStatus = "completed") => {
    if (!activeFocus) {
      return;
    }

    const session: FocusSession = {
      id: uid("focus"),
      mode: activeFocus.mode,
      plannedSeconds: activeFocus.plannedSeconds,
      elapsedSeconds: activeFocus.elapsedSeconds,
      status,
      todoId: activeFocus.todoId,
      goalId: activeFocus.goalId,
      startedAt: activeFocus.startedAt,
      endedAt: nowIso(),
    };

    setFocusSessions((prev) => [session, ...prev]);
    await idb.putFocusSession(session);

    if (activeFocus.todoId && status === "completed") {
      await toggleTodo(activeFocus.todoId, true);
    }

    setActiveFocus(null);
    await idb.setActiveFocus(null);
  };

  const exportSnapshot = (): ExportSnapshot => ({
    goals,
    todos,
    focusSessions,
    exportedAt: nowIso(),
  });

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      goals,
      todos,
      focusSessions,
      activeFocus,
      createGoal,
      createTodo,
      toggleTodo,
      setTodoPriority,
      oneClickBreakdown,
      startFocus,
      pauseFocus,
      resumeFocus,
      endFocus,
      exportSnapshot,
    }),
    [activeFocus, focusSessions, goals, ready, todos],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
