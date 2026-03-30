export type Priority = "high" | "medium" | "low";
export type FocusMode = "countdown" | "stopwatch";
export type FocusSessionStatus = "completed" | "interrupted";

export interface Goal {
  id: string;
  name: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  goalId?: string;
  dueDate: string;
  priority: Priority;
  parentId?: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  mode: FocusMode;
  plannedSeconds: number;
  elapsedSeconds: number;
  status: FocusSessionStatus;
  todoId?: string;
  goalId?: string;
  startedAt: string;
  endedAt: string;
}

export interface ActiveFocus {
  mode: FocusMode;
  plannedSeconds: number;
  elapsedSeconds: number;
  running: boolean;
  todoId?: string;
  goalId?: string;
  startedAt: string;
  updatedAt: string;
}

export interface ExportSnapshot {
  goals: Goal[];
  todos: Todo[];
  focusSessions: FocusSession[];
  exportedAt: string;
}
