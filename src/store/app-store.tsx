"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { addDays, fromDateKey, todayKey, toDateKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { createMockImportTasks, createMockPdfSummary, createMockState } from "@/lib/mock-data";
import { generateGoalSessions } from "@/lib/scheduler";
import { loadState, saveState } from "@/lib/storage";
import {
  AppState,
  IdeaCategory,
  IdeaStatus,
  KnowledgeItem,
  KnowledgeItemInput,
  KnowledgeLearningStatus,
  NewGoalInput,
  PdfUploadInput,
  QuickNoteInput,
  Task,
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
  convertIdeaToKnowledge: (ideaId: string, categoryId?: string) => void;
  addReview: (wins: string, wastedTime: string, improveOneThing: string) => void;

  addKnowledgeItem: (input: KnowledgeItemInput) => void;
  updateKnowledgeItem: (itemId: string, input: KnowledgeItemInput) => void;
  deleteKnowledgeItem: (itemId: string) => void;

  addKnowledgeCategory: (name: string, parentId?: string) => void;
  updateKnowledgeCategory: (categoryId: string, name: string) => void;
  deleteKnowledgeCategory: (categoryId: string) => void;
  reorderKnowledgeCategory: (categoryId: string, direction: "up" | "down") => void;

  addQuickNote: (input: QuickNoteInput) => void;
  updateQuickNote: (noteId: string, input: QuickNoteInput) => void;
  deleteQuickNote: (noteId: string) => void;
  importQuickNoteToKnowledge: (noteId: string) => void;

  uploadPdfDocument: (input: PdfUploadInput) => void;
  savePdfSummaryToKnowledge: (documentId: string, categoryId?: string) => void;

  updateCourseLearningStatus: (courseId: string, status: KnowledgeLearningStatus) => void;
  updateNodeLearningStatus: (nodeId: string, status: KnowledgeLearningStatus) => void;
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

function migrateLegacyKnowledgeItems(loaded: AppState, base: AppState): KnowledgeItem[] {
  const categoryIdByLegacy: Record<string, string> = {
    course_notes: "cat_note",
    method_library: "cat_method",
    wrong_question: "cat_mistake",
    link_collection: "cat_link",
  };

  const typeByLegacy: Record<string, KnowledgeItem["type"]> = {
    course_notes: "note",
    method_library: "method",
    wrong_question: "mistake",
    link_collection: "link",
  };

  if (!loaded.knowledgeItems) {
    return base.knowledgeItems;
  }

  return loaded.knowledgeItems.map((raw) => {
    const legacyCategory = (raw as unknown as { category?: string }).category;
    const migratedType = raw.type ?? (legacyCategory ? typeByLegacy[legacyCategory] : undefined) ?? "note";
    const migratedCategoryId =
      raw.categoryId ?? (legacyCategory ? categoryIdByLegacy[legacyCategory] : undefined) ?? undefined;

    return {
      ...raw,
      type: migratedType,
      categoryId: migratedCategoryId,
      tags: raw.tags ?? [],
      content: raw.content ?? "",
      relatedTaskIds: raw.relatedTaskIds ?? [],
      updatedAt: raw.updatedAt ?? raw.createdAt ?? todayKey(),
      createdAt: raw.createdAt ?? todayKey(),
    };
  });
}

function normalizeLoadedState(loaded: AppState | null): AppState {
  const base = createMockState();
  if (!loaded) {
    return base;
  }

  return {
    ...base,
    ...loaded,
    goals: loaded.goals ?? base.goals,
    goalSessions: loaded.goalSessions ?? base.goalSessions,
    weeklyPlans: loaded.weeklyPlans ?? base.weeklyPlans,
    tasks: loaded.tasks ?? base.tasks,
    knowledgeItems: migrateLegacyKnowledgeItems(loaded, base),
    knowledgeCategories: loaded.knowledgeCategories ?? base.knowledgeCategories,
    knowledgeSubjects: loaded.knowledgeSubjects ?? base.knowledgeSubjects,
    knowledgeCourses: loaded.knowledgeCourses ?? base.knowledgeCourses,
    knowledgeNodes: loaded.knowledgeNodes ?? base.knowledgeNodes,
    quickNotes: loaded.quickNotes ?? base.quickNotes,
    pdfDocuments: loaded.pdfDocuments ?? base.pdfDocuments,
    ideas: loaded.ideas ?? base.ideas,
    reviews: loaded.reviews ?? base.reviews,
    parsedImportTasks: loaded.parsedImportTasks ?? base.parsedImportTasks,
  };
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

function syncTaskKnowledgeLinks(tasks: Task[], knowledgeItems: KnowledgeItem[]): Task[] {
  return tasks.map((task) => ({
    ...task,
    knowledgeItemIds: knowledgeItems.filter((item) => item.relatedTaskIds.includes(task.id)).map((item) => item.id),
  }));
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createMockState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(normalizeLoadedState(loaded));
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

      convertIdeaToKnowledge(ideaId, categoryId) {
        setState((prev) => {
          const idea = prev.ideas.find((item) => item.id === ideaId);
          if (!idea) {
            return prev;
          }

          const knowledgeId = createId("knowledge");
          const knowledgeItems = [
            {
              id: knowledgeId,
              title: idea.content.slice(0, 24),
              type: "note" as const,
              tags: ["来自想法"],
              content: idea.content,
              categoryId: categoryId ?? "cat_method",
              relatedTaskIds: [],
              createdAt: nowDate(),
              updatedAt: nowDate(),
            },
            ...prev.knowledgeItems,
          ];

          return {
            ...prev,
            knowledgeItems,
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

      addKnowledgeItem(input) {
        const cleanTitle = input.title.trim();
        const cleanContent = input.content.trim();
        if (!cleanTitle || !cleanContent) {
          return;
        }

        setState((prev) => {
          const knowledgeItems: KnowledgeItem[] = [
            {
              id: createId("knowledge"),
              title: cleanTitle,
              type: input.type,
              tags: input.tags,
              content: cleanContent,
              categoryId: input.categoryId,
              subjectId: input.subjectId,
              courseId: input.courseId,
              nodeId: input.nodeId,
              sourceDocumentId: input.sourceDocumentId,
              sourceQuickNoteId: input.sourceQuickNoteId,
              relatedTaskIds: input.relatedTaskIds,
              createdAt: nowDate(),
              updatedAt: nowDate(),
            },
            ...prev.knowledgeItems,
          ];

          return {
            ...prev,
            knowledgeItems,
            tasks: syncTaskKnowledgeLinks(prev.tasks, knowledgeItems),
          };
        });
      },

      updateKnowledgeItem(itemId, input) {
        setState((prev) => {
          const knowledgeItems = prev.knowledgeItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  title: input.title.trim(),
                  type: input.type,
                  tags: input.tags,
                  content: input.content.trim(),
                  categoryId: input.categoryId,
                  subjectId: input.subjectId,
                  courseId: input.courseId,
                  nodeId: input.nodeId,
                  sourceDocumentId: input.sourceDocumentId,
                  sourceQuickNoteId: input.sourceQuickNoteId,
                  relatedTaskIds: input.relatedTaskIds,
                  updatedAt: nowDate(),
                }
              : item,
          );

          return {
            ...prev,
            knowledgeItems,
            tasks: syncTaskKnowledgeLinks(prev.tasks, knowledgeItems),
          };
        });
      },

      deleteKnowledgeItem(itemId) {
        setState((prev) => {
          const knowledgeItems = prev.knowledgeItems.filter((item) => item.id !== itemId);

          return {
            ...prev,
            knowledgeItems,
            tasks: syncTaskKnowledgeLinks(prev.tasks, knowledgeItems),
            quickNotes: prev.quickNotes.map((note) =>
              note.importedKnowledgeItemId === itemId
                ? { ...note, status: "draft", importedKnowledgeItemId: undefined, updatedAt: nowDate() }
                : note,
            ),
            pdfDocuments: prev.pdfDocuments.map((doc) =>
              doc.savedAsKnowledgeItemId === itemId
                ? { ...doc, savedAsKnowledgeItemId: undefined, updatedAt: nowDate() }
                : doc,
            ),
          };
        });
      },

      addKnowledgeCategory(name, parentId) {
        const clean = name.trim();
        if (!clean) {
          return;
        }

        setState((prev) => {
          const siblingMax = prev.knowledgeCategories
            .filter((category) => category.parentId === parentId)
            .reduce((max, category) => Math.max(max, category.order), 0);

          return {
            ...prev,
            knowledgeCategories: [
              ...prev.knowledgeCategories,
              {
                id: createId("kcat"),
                name: clean,
                parentId,
                order: siblingMax + 1,
                isSystem: false,
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
            ],
          };
        });
      },

      updateKnowledgeCategory(categoryId, name) {
        const clean = name.trim();
        if (!clean) {
          return;
        }

        setState((prev) => ({
          ...prev,
          knowledgeCategories: prev.knowledgeCategories.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  name: clean,
                  updatedAt: nowDate(),
                }
              : category,
          ),
        }));
      },

      deleteKnowledgeCategory(categoryId) {
        setState((prev) => {
          const target = prev.knowledgeCategories.find((category) => category.id === categoryId);
          if (!target || target.isSystem) {
            return prev;
          }

          const childIds = prev.knowledgeCategories
            .filter((category) => category.parentId === categoryId)
            .map((category) => category.id);
          const deleteIds = new Set([categoryId, ...childIds]);

          return {
            ...prev,
            knowledgeCategories: prev.knowledgeCategories.filter((category) => !deleteIds.has(category.id)),
            knowledgeItems: prev.knowledgeItems.map((item) =>
              item.categoryId && deleteIds.has(item.categoryId)
                ? {
                    ...item,
                    categoryId: undefined,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
            quickNotes: prev.quickNotes.map((note) =>
              note.categoryId && deleteIds.has(note.categoryId)
                ? {
                    ...note,
                    categoryId: undefined,
                    updatedAt: nowDate(),
                  }
                : note,
            ),
          };
        });
      },

      reorderKnowledgeCategory(categoryId, direction) {
        setState((prev) => {
          const current = prev.knowledgeCategories.find((category) => category.id === categoryId);
          if (!current) {
            return prev;
          }

          const siblings = prev.knowledgeCategories
            .filter((category) => category.parentId === current.parentId)
            .sort((a, b) => a.order - b.order);
          const index = siblings.findIndex((category) => category.id === categoryId);
          const swapIndex = direction === "up" ? index - 1 : index + 1;

          if (index < 0 || swapIndex < 0 || swapIndex >= siblings.length) {
            return prev;
          }

          const swapTarget = siblings[swapIndex];

          return {
            ...prev,
            knowledgeCategories: prev.knowledgeCategories.map((category) => {
              if (category.id === current.id) {
                return { ...category, order: swapTarget.order, updatedAt: nowDate() };
              }
              if (category.id === swapTarget.id) {
                return { ...category, order: current.order, updatedAt: nowDate() };
              }
              return category;
            }),
          };
        });
      },

      addQuickNote(input) {
        const clean = input.content.trim();
        if (!clean) {
          return;
        }

        setState((prev) => ({
          ...prev,
          quickNotes: [
            {
              id: createId("qnote"),
              title: input.title?.trim(),
              content: clean,
              tags: input.tags,
              categoryId: input.categoryId,
              subjectId: input.subjectId,
              courseId: input.courseId,
              nodeId: input.nodeId,
              status: "draft",
              createdAt: nowDate(),
              updatedAt: nowDate(),
            },
            ...prev.quickNotes,
          ],
        }));
      },

      updateQuickNote(noteId, input) {
        setState((prev) => ({
          ...prev,
          quickNotes: prev.quickNotes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  title: input.title?.trim(),
                  content: input.content.trim(),
                  tags: input.tags,
                  categoryId: input.categoryId,
                  subjectId: input.subjectId,
                  courseId: input.courseId,
                  nodeId: input.nodeId,
                  updatedAt: nowDate(),
                }
              : note,
          ),
        }));
      },

      deleteQuickNote(noteId) {
        setState((prev) => ({
          ...prev,
          quickNotes: prev.quickNotes.filter((note) => note.id !== noteId),
        }));
      },

      importQuickNoteToKnowledge(noteId) {
        setState((prev) => {
          const note = prev.quickNotes.find((item) => item.id === noteId);
          if (!note) {
            return prev;
          }

          if (note.importedKnowledgeItemId) {
            return prev;
          }

          const knowledgeId = createId("knowledge");
          const knowledgeItems: KnowledgeItem[] = [
            {
              id: knowledgeId,
              title: note.title?.trim() || note.content.slice(0, 26),
              type: "quick_note_import",
              tags: note.tags,
              content: note.content,
              categoryId: note.categoryId,
              subjectId: note.subjectId,
              courseId: note.courseId,
              nodeId: note.nodeId,
              sourceQuickNoteId: note.id,
              relatedTaskIds: [],
              createdAt: nowDate(),
              updatedAt: nowDate(),
            },
            ...prev.knowledgeItems,
          ];

          return {
            ...prev,
            knowledgeItems,
            quickNotes: prev.quickNotes.map((item) =>
              item.id === noteId
                ? {
                    ...item,
                    status: "imported",
                    importedKnowledgeItemId: knowledgeId,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
            tasks: syncTaskKnowledgeLinks(prev.tasks, knowledgeItems),
          };
        });
      },

      uploadPdfDocument(input) {
        if (!input.fileName.trim()) {
          return;
        }

        setState((prev) => {
          const analysis = createMockPdfSummary(input.fileName);

          return {
            ...prev,
            pdfDocuments: [
              {
                id: createId("pdf"),
                title: input.title.trim() || input.fileName,
                fileName: input.fileName,
                fileSizeKb: input.fileSizeKb,
                subjectId: input.subjectId,
                courseId: input.courseId,
                nodeId: input.nodeId,
                summary: analysis.summary,
                keywords: analysis.keywords,
                highlights: analysis.highlights,
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
              ...prev.pdfDocuments,
            ],
          };
        });
      },

      savePdfSummaryToKnowledge(documentId, categoryId) {
        setState((prev) => {
          const doc = prev.pdfDocuments.find((item) => item.id === documentId);
          if (!doc) {
            return prev;
          }

          if (doc.savedAsKnowledgeItemId) {
            return prev;
          }

          const knowledgeId = createId("knowledge");
          const knowledgeItems: KnowledgeItem[] = [
            {
              id: knowledgeId,
              title: doc.title,
              type: "pdf_summary",
              tags: ["PDF", ...doc.keywords.slice(0, 3)],
              content: `${doc.summary}\n\n重点：\n${doc.highlights.map((line, index) => `${index + 1}. ${line}`).join("\n")}`,
              categoryId: categoryId ?? "cat_pdf",
              subjectId: doc.subjectId,
              courseId: doc.courseId,
              nodeId: doc.nodeId,
              sourceDocumentId: doc.id,
              relatedTaskIds: [],
              createdAt: nowDate(),
              updatedAt: nowDate(),
            },
            ...prev.knowledgeItems,
          ];

          return {
            ...prev,
            knowledgeItems,
            pdfDocuments: prev.pdfDocuments.map((item) =>
              item.id === documentId
                ? {
                    ...item,
                    savedAsKnowledgeItemId: knowledgeId,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
            tasks: syncTaskKnowledgeLinks(prev.tasks, knowledgeItems),
          };
        });
      },

      updateCourseLearningStatus(courseId, status) {
        setState((prev) => ({
          ...prev,
          knowledgeCourses: prev.knowledgeCourses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  status,
                  updatedAt: nowDate(),
                }
              : course,
          ),
        }));
      },

      updateNodeLearningStatus(nodeId, status) {
        setState((prev) => ({
          ...prev,
          knowledgeNodes: prev.knowledgeNodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  status,
                  updatedAt: nowDate(),
                }
              : node,
          ),
        }));
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
