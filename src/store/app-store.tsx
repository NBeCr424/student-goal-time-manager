"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { addDays, fromDateKey, todayKey, toDateKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { createMockImportTasks, createMockState } from "@/lib/mock-data";
import { generateGoalSessions } from "@/lib/scheduler";
import { loadState, saveState } from "@/lib/storage";
import {
  AppState,
  IdeaCategory,
  IdeaStatus,
  KnowledgeCategory,
  NewGoalInput,
  TaskPlanType,
} from "@/lib/types";

interface AppActions {
  toggleTask: (taskId: string) => void;
  reorderTask: (taskId: string, direction: "up" | "down") => void;
  addTask: (title: string, planType: TaskPlanType) => void;
  addGoal: (input: NewGoalInput) => void;
  regenerateGoalSessions: (goalId: string) => void;
  parseImportUrl: (url: string) => void;
  toggleImportTaskSelection: (importId: string) => void;
  importSelectedTasks: (target: "today" | "weekly") => void;
  addWeeklyExecution: (entry: string) => void;
  updateWeeklyReflection: (checkSummary: string, nextWeekOneImprovement: string) => void;
  addIdea: (content: string, category: IdeaCategory) => void;
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
  convertIdeaToTask: (ideaId: string, planType: TaskPlanType) => void;
  convertIdeaToKnowledge: (ideaId: string, category: KnowledgeCategory) => void;
  addReview: (wins: string, wastedTime: string, improveOneThing: string) => void;
}

interface AppStoreContextValue {
  state: AppState;
  hydrated: boolean;
  actions: AppActions;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

function nowDate() {
  return todayKey();
}

function findCurrentWeeklyPlanIndex(state: AppState): number {
  if (state.weeklyPlans.length === 0) {
    return -1;
  }

  const today = fromDateKey(todayKey());
  const monday = addDays(today, today.getDay() === 0 ? -6 : 1 - today.getDay());
  const weekStart = toDateKey(monday);
  const exact = state.weeklyPlans.findIndex((plan) => plan.weekStartDate === weekStart);

  return exact >= 0 ? exact : 0;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createMockState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      setState(loaded);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveState(state);
  }, [state, hydrated]);

  const actions = useMemo<AppActions>(
    () => ({
      toggleTask(taskId) {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  completed: !task.completed,
                  updatedAt: nowDate(),
                }
              : task,
          ),
        }));
      },

      reorderTask(taskId, direction) {
        setState((prev) => {
          const targetTask = prev.tasks.find((task) => task.id === taskId);
          if (!targetTask) {
            return prev;
          }

          const peers = prev.tasks
            .filter((task) => task.planType === targetTask.planType && task.dueDate === targetTask.dueDate)
            .sort((a, b) => a.order - b.order);

          const index = peers.findIndex((task) => task.id === taskId);
          const swapIndex = direction === "up" ? index - 1 : index + 1;

          if (index < 0 || swapIndex < 0 || swapIndex >= peers.length) {
            return prev;
          }

          const current = peers[index];
          const swap = peers[swapIndex];

          return {
            ...prev,
            tasks: prev.tasks.map((task) => {
              if (task.id === current.id) {
                return { ...task, order: swap.order, updatedAt: nowDate() };
              }
              if (task.id === swap.id) {
                return { ...task, order: current.order, updatedAt: nowDate() };
              }
              return task;
            }),
          };
        });
      },

      addTask(title, planType) {
        const clean = title.trim();
        if (!clean) {
          return;
        }

        setState((prev) => {
          const dueDate = planType === "weekly" ? toDateKey(addDays(fromDateKey(todayKey()), 3)) : todayKey();
          const maxOrder = prev.tasks
            .filter((task) => task.planType === planType && task.dueDate === dueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);

          return {
            ...prev,
            tasks: [
              ...prev.tasks,
              {
                id: createId("task"),
                title: clean,
                description: "",
                completed: false,
                dueDate,
                priority: "medium",
                planType,
                order: maxOrder + 1,
                knowledgeItemIds: [],
                source: "manual",
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
            ],
          };
        });
      },

      addGoal(input) {
        if (!input.title.trim()) {
          return;
        }

        setState((prev) => {
          const id = createId("goal");
          const goal = {
            id,
            title: input.title.trim(),
            description: input.description.trim(),
            smart: input.smart,
            deadline: input.deadline,
            estimatedTotalHours: input.estimatedTotalHours,
            suggestedSessionMinutes: input.suggestedSessionMinutes,
            preferredTimeOfDay: input.preferredTimeOfDay,
            priority: input.priority,
            includeInCalendar: input.includeInCalendar,
            progress: 0,
            status: "not_started" as const,
            taskIds: [],
            sessionIds: [],
            createdAt: nowDate(),
            updatedAt: nowDate(),
          };

          const sessions = goal.includeInCalendar ? generateGoalSessions(goal) : [];

          return {
            ...prev,
            goals: [
              ...prev.goals,
              {
                ...goal,
                sessionIds: sessions.map((session) => session.id),
              },
            ],
            goalSessions: [...prev.goalSessions, ...sessions],
          };
        });
      },

      regenerateGoalSessions(goalId) {
        setState((prev) => {
          const goal = prev.goals.find((item) => item.id === goalId);
          if (!goal) {
            return prev;
          }

          const freshSessions = generateGoalSessions(goal);
          const keptSessions = prev.goalSessions.filter((session) => session.goalId !== goalId);

          return {
            ...prev,
            goalSessions: [...keptSessions, ...freshSessions],
            goals: prev.goals.map((item) =>
              item.id === goalId
                ? {
                    ...item,
                    sessionIds: freshSessions.map((session) => session.id),
                    updatedAt: nowDate(),
                  }
                : item,
            ),
          };
        });
      },

      parseImportUrl(url) {
        const clean = url.trim();
        if (!clean) {
          return;
        }

        setState((prev) => ({
          ...prev,
          parsedImportTasks: createMockImportTasks(clean),
        }));
      },

      toggleImportTaskSelection(importId) {
        setState((prev) => ({
          ...prev,
          parsedImportTasks: prev.parsedImportTasks.map((item) =>
            item.id === importId ? { ...item, selected: !item.selected } : item,
          ),
        }));
      },

      importSelectedTasks(target) {
        setState((prev) => {
          const selected = prev.parsedImportTasks.filter((item) => item.selected);
          if (selected.length === 0) {
            return prev;
          }

          const dueDate = target === "today" ? todayKey() : toDateKey(addDays(fromDateKey(todayKey()), 3));
          const planType: TaskPlanType = target === "today" ? "today_other" : "weekly";
          const currentMax = prev.tasks
            .filter((task) => task.planType === planType && task.dueDate === dueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);

          const newTasks = selected.map((item, index) => ({
            id: createId("task"),
            title: item.title,
            description: `来源：${item.sourceUrl}`,
            completed: false,
            dueDate,
            priority: "medium" as const,
            planType,
            order: currentMax + index + 1,
            knowledgeItemIds: [],
            source: "imported" as const,
            createdAt: nowDate(),
            updatedAt: nowDate(),
          }));

          return {
            ...prev,
            tasks: [...prev.tasks, ...newTasks],
            parsedImportTasks: [],
          };
        });
      },

      addWeeklyExecution(entry) {
        const clean = entry.trim();
        if (!clean) {
          return;
        }

        setState((prev) => {
          const index = findCurrentWeeklyPlanIndex(prev);
          if (index < 0) {
            return prev;
          }

          const weeklyPlans = [...prev.weeklyPlans];
          weeklyPlans[index] = {
            ...weeklyPlans[index],
            executionLog: [clean, ...weeklyPlans[index].executionLog],
            updatedAt: nowDate(),
          };

          return {
            ...prev,
            weeklyPlans,
          };
        });
      },

      updateWeeklyReflection(checkSummary, nextWeekOneImprovement) {
        setState((prev) => {
          const index = findCurrentWeeklyPlanIndex(prev);
          if (index < 0) {
            return prev;
          }

          const weeklyPlans = [...prev.weeklyPlans];
          weeklyPlans[index] = {
            ...weeklyPlans[index],
            checkSummary,
            nextWeekOneImprovement,
            updatedAt: nowDate(),
          };

          return {
            ...prev,
            weeklyPlans,
          };
        });
      },

      addIdea(content, category) {
        const clean = content.trim();
        if (!clean) {
          return;
        }

        setState((prev) => ({
          ...prev,
          ideas: [
            {
              id: createId("idea"),
              content: clean,
              category,
              status: "unprocessed",
              createdAt: nowDate(),
              updatedAt: nowDate(),
            },
            ...prev.ideas,
          ],
        }));
      },

      updateIdeaStatus(ideaId, status) {
        setState((prev) => ({
          ...prev,
          ideas: prev.ideas.map((idea) =>
            idea.id === ideaId
              ? {
                  ...idea,
                  status,
                  updatedAt: nowDate(),
                }
              : idea,
          ),
        }));
      },

      convertIdeaToTask(ideaId, planType) {
        setState((prev) => {
          const idea = prev.ideas.find((item) => item.id === ideaId);
          if (!idea) {
            return prev;
          }

          const dueDate = planType === "weekly" ? toDateKey(addDays(fromDateKey(todayKey()), 3)) : todayKey();
          const maxOrder = prev.tasks
            .filter((task) => task.planType === planType && task.dueDate === dueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);

          const taskId = createId("task");

          return {
            ...prev,
            tasks: [
              ...prev.tasks,
              {
                id: taskId,
                title: idea.content.slice(0, 36),
                description: idea.content,
                completed: false,
                dueDate,
                priority: "medium",
                planType,
                order: maxOrder + 1,
                knowledgeItemIds: [],
                source: "idea",
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
            ],
            ideas: prev.ideas.map((item) =>
              item.id === ideaId
                ? {
                    ...item,
                    status: "converted_task",
                    linkedTaskId: taskId,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
          };
        });
      },

      convertIdeaToKnowledge(ideaId, category) {
        setState((prev) => {
          const idea = prev.ideas.find((item) => item.id === ideaId);
          if (!idea) {
            return prev;
          }

          const knowledgeId = createId("knowledge");

          return {
            ...prev,
            knowledgeItems: [
              {
                id: knowledgeId,
                title: idea.content.slice(0, 24),
                category,
                tags: ["来自想法"],
                content: idea.content,
                relatedTaskIds: [],
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
              ...prev.knowledgeItems,
            ],
            ideas: prev.ideas.map((item) =>
              item.id === ideaId
                ? {
                    ...item,
                    status: "converted_knowledge",
                    linkedKnowledgeId: knowledgeId,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
          };
        });
      },

      addReview(wins, wastedTime, improveOneThing) {
        const date = todayKey();
        const review = {
          id: createId("review"),
          date,
          wins: wins.trim(),
          wastedTime: wastedTime.trim(),
          improveOneThing: improveOneThing.trim(),
          createdAt: date,
        };

        setState((prev) => {
          const exists = prev.reviews.find((entry) => entry.date === date);

          if (!exists) {
            return {
              ...prev,
              reviews: [review, ...prev.reviews],
            };
          }

          return {
            ...prev,
            reviews: prev.reviews.map((entry) => (entry.date === date ? review : entry)),
          };
        });
      },
    }),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      hydrated,
      actions,
    }),
    [actions, hydrated, state],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }

  return context;
}
