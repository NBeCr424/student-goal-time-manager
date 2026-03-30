"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { addDays, addMinutes, fromDateKey, startOfWeek, todayKey, toDateKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { createMockImportTasks, createMockState, getMockWeatherByCity } from "@/lib/mock-data";
import { generateGoalSessions } from "@/lib/scheduler";
import { loadState, saveState } from "@/lib/storage";
import {
  AppState,
  BudgetPlan,
  EventMemo,
  EventMemoInput,
  EventMemoStatus,
  FinanceCategory,
  FinanceRecordInput,
  SpecialBudgetInput,
  SpecialBudgetRecordInput,
  FocusMode,
  FocusSessionStatus,
  IdeaCategory,
  IdeaStatus,
  KnowledgeItem,
  KnowledgeItemInput,
  KnowledgeLearningStatus,
  NewGoalInput,
  PdfUploadInput,
  QuickNoteInput,
  Task,
  TaskImportTarget,
  TaskKnowledgeRelation,
  TimelineItem,
  TaskPlanType,
  UrlImportJob,
  WeatherLocation,
} from "@/lib/types";

interface AppActions {
  replaceState: (nextState: AppState) => void;
  addWeatherLocation: (city: string) => void;
  selectWeatherLocation: (locationId: string) => void;
  setDefaultWeatherLocation: (locationId: string) => void;
  addManualTimelineItem: (title: string, startTime: string, endTime?: string) => void;
  removeManualTimelineItem: (itemId: string) => void;

  toggleTask: (taskId: string) => void;
  reorderTask: (taskId: string, direction: "up" | "down") => void;
  deleteTask: (taskId: string) => void;
  addTask: (
    title: string,
    planType: TaskPlanType,
    schedule?: { startTime?: string; endTime?: string; durationMinutes?: number },
  ) => void;
  addTaskOnDate: (
    title: string,
    planType: TaskPlanType,
    dueDate: string,
    schedule?: { startTime?: string; endTime?: string; durationMinutes?: number },
  ) => void;
  addGoalBreakdownItem: (goalId: string, title: string) => void;
  toggleGoalBreakdownItem: (goalId: string, itemId: string) => void;
  deleteGoalBreakdownItem: (goalId: string, itemId: string) => void;
  moveGoalBreakdownItem: (goalId: string, itemId: string, targetItemId: string) => void;
  markGoalBreakdownItemDistributed: (goalId: string, itemId: string) => void;
  addGoalTemplate: (
    name: string,
    payload: {
      title: string;
      specific: string;
      measurable: string;
      achievable: string;
      relevant: string;
      estimatedTotalHours: number;
      priority: "high" | "medium" | "low";
    },
  ) => void;
  deleteGoalTemplate: (templateId: string) => void;
  distributeGoalTaskToPlan: (
    goalId: string,
    title: string,
    planType: TaskPlanType,
    dueDate: string,
    schedule?: { startTime?: string; endTime?: string; durationMinutes?: number },
    goalBreakdownItemId?: string,
  ) => void;
  reassignGoalDistributedTask: (
    taskId: string,
    planType: TaskPlanType,
    dueDate: string,
    schedule?: { startTime?: string; endTime?: string; durationMinutes?: number },
  ) => void;
  restoreDeletedGoalTask: (task: Task) => void;
  moveIncompleteTodayTasksToTomorrow: () => void;
  setTaskSchedule: (taskId: string, startTime: string, endTime?: string, durationMinutes?: number) => void;
  clearTaskSchedule: (taskId: string) => void;
  markTasksSyncedToCalendar: (taskIds: string[], synced: boolean) => void;
  markGoalSessionsSyncedToCalendar: (sessionIds: string[], synced: boolean) => void;
  addGoal: (input: NewGoalInput) => void;
  deleteGoal: (goalId: string) => void;
  regenerateGoalSessions: (goalId: string) => void;
  parseImportUrl: (url: string) => void;
  importTasksFromJson: (payload: string) => { ok: boolean; message: string; parsedCount?: number; invalidCount?: number };
  toggleImportTaskSelection: (importId: string) => void;
  importSelectedTasks: (target: TaskImportTarget) => void;
  linkTaskToKnowledge: (taskId: string, knowledgeItemId: string) => void;
  unlinkTaskFromKnowledge: (taskId: string, knowledgeItemId: string) => void;
  startFocusSession: (mode: FocusMode, plannedMinutes: number, taskId?: string, goalId?: string) => void;
  finishFocusSession: (sessionId: string, status: FocusSessionStatus, actualMinutes?: number) => void;
  addWeeklyExecution: (entry: string) => void;
  updateWeeklyReflection: (checkSummary: string, nextWeekOneImprovement: string) => void;
  addIdea: (content: string, category: IdeaCategory) => void;
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
  convertIdeaToTask: (ideaId: string, planType: TaskPlanType) => void;
  convertIdeaToKnowledge: (ideaId: string, categoryId?: string) => void;
  addEventMemo: (input: EventMemoInput) => void;
  updateEventMemo: (
    eventMemoId: string,
    patch: {
      title?: string;
      description?: string;
      status?: EventMemoStatus;
      deadline?: string;
      targetOutcome?: string;
      why?: string;
      nextAction?: string;
      blockedReason?: string;
      notes?: string;
      completionSummary?: string;
      nextTimeTip?: string;
    },
  ) => void;
  addEventMemoStep: (eventMemoId: string, stepTitle: string) => void;
  toggleEventMemoStep: (eventMemoId: string, stepId: string) => void;
  reorderEventMemoStep: (eventMemoId: string, stepId: string, direction: "up" | "down") => void;
  deleteEventMemoStep: (eventMemoId: string, stepId: string) => void;
  moveEventMemoToPlan: (eventMemoId: string, target: "today" | "tomorrow" | "weekly") => void;
  linkEventMemoToKnowledge: (eventMemoId: string, knowledgeItemId: string) => void;
  addReview: (wins: string, wastedTime: string, improveOneThing: string) => void;
  addFinanceRecord: (input: FinanceRecordInput) => void;
  setMonthlyBudget: (monthKey: string, monthlyBudget: number) => void;
  setCategoryBudget: (monthKey: string, categoryId: string, budgetAmount: number) => void;
  removeCategoryBudget: (monthKey: string, categoryId: string) => void;
  addSpecialBudget: (input: SpecialBudgetInput) => void;
  updateSpecialBudget: (budgetId: string, input: SpecialBudgetInput) => void;
  deleteSpecialBudget: (budgetId: string) => void;
  addSpecialBudgetRecord: (input: SpecialBudgetRecordInput) => void;
  deleteSpecialBudgetRecord: (recordId: string) => void;

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
const UNCATEGORIZED_KNOWLEDGE_CATEGORY_ID = "cat_uncategorized";

function nowDate() {
  return todayKey();
}

function getFallbackKnowledgeCategoryId(categories: AppState["knowledgeCategories"]): string | undefined {
  const uncategorized = categories.find((category) => category.id === UNCATEGORIZED_KNOWLEDGE_CATEGORY_ID);
  if (uncategorized) {
    return uncategorized.id;
  }
  return categories[0]?.id;
}

function normalizeKnowledgeCategoryId(
  categoryId: string | undefined,
  categories: AppState["knowledgeCategories"],
): string | undefined {
  const clean = categoryId?.trim();
  if (clean && categories.some((category) => category.id === clean)) {
    return clean;
  }
  return getFallbackKnowledgeCategoryId(categories);
}

function ensureRequiredKnowledgeCategories(
  categories: AppState["knowledgeCategories"],
  baseCategories: AppState["knowledgeCategories"],
): AppState["knowledgeCategories"] {
  const requiredSystem = baseCategories.filter((category) => category.isSystem);
  const existingIds = new Set(categories.map((category) => category.id));
  const missing = requiredSystem.filter((category) => !existingIds.has(category.id));
  if (missing.length === 0) {
    return categories;
  }
  return [...categories, ...missing].sort((a, b) => a.order - b.order);
}

function normalizeKnowledgeItemsCategoryIds(
  items: AppState["knowledgeItems"],
  categories: AppState["knowledgeCategories"],
): AppState["knowledgeItems"] {
  return items.map((item) => ({
    ...item,
    categoryId: normalizeKnowledgeCategoryId(item.categoryId, categories),
  }));
}

function normalizeQuickNotesCategoryIds(
  notes: AppState["quickNotes"],
  categories: AppState["knowledgeCategories"],
): AppState["quickNotes"] {
  return notes.map((note) => ({
    ...note,
    categoryId: normalizeKnowledgeCategoryId(note.categoryId, categories),
  }));
}

function buildMockPdfInsights(input: PdfUploadInput): Pick<AppState["pdfDocuments"][number], "summary" | "keywords" | "highlights"> {
  const baseTitle = input.title.trim() || input.fileName.trim() || "PDF 文档";
  const parsedKeywords = baseTitle
    .replace(/\.[^.]+$/, "")
    .split(/[\s\-_.]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const keywords = Array.from(new Set(["PDF", ...parsedKeywords])).slice(0, 4);

  return {
    summary: `Mock 摘要：${baseTitle} 主要围绕核心概念、关键步骤与应用场景展开，建议先过框架再做练习巩固。`,
    keywords,
    highlights: ["先建立知识框架，再看细节推导。", "把关键结论整理成可复习清单。"],
  };
}

function pickFirstNonEmptyText(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function extractJsonImportRows(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (!input || typeof input !== "object") {
    return [];
  }

  const record = input as Record<string, unknown>;
  const listKeys = ["items", "tasks", "list", "data", "records"];
  for (const key of listKeys) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  return [input];
}

function toParsedImportTask(item: unknown): { title: string; sourceUrl: string } | null {
  if (typeof item === "string") {
    const title = item.trim();
    if (!title) {
      return null;
    }
    return { title, sourceUrl: "json://manual" };
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const title = pickFirstNonEmptyText([
    record.title,
    record.name,
    record.taskTitle,
    record.task,
    record.text,
    record.content,
  ]);

  if (!title) {
    return null;
  }

  const sourceUrl =
    pickFirstNonEmptyText([record.sourceUrl, record.source, record.url, record.origin, record.app]) ?? "json://manual";

  return { title, sourceUrl };
}

function toMinuteOfDay(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function durationBetween(startTime: string, endTime: string): number {
  return Math.max(15, toMinuteOfDay(endTime) - toMinuteOfDay(startTime));
}

function normalizeGoalSessions(entries: AppState["goalSessions"] | undefined): AppState["goalSessions"] {
  if (!entries || entries.length === 0) {
    return [];
  }

  return entries.map((session) => ({
    ...session,
    syncedToCalendar: session.syncedToCalendar ?? false,
  }));
}

function normalizeGoalBreakdownItems(
  items: AppState["goals"][number]["breakdownItems"] | undefined,
  fallbackDate: string,
): AppState["goals"][number]["breakdownItems"] {
  if (!items || items.length === 0) {
    return [];
  }

  return items
    .map((item) => {
      const createdAt = item.createdAt ?? fallbackDate;
      const updatedAt = item.updatedAt ?? createdAt;
      return {
        id: item.id || createId("goal_step"),
        title: item.title?.trim() || "",
        completed: item.completed ?? false,
        distributedCount: Math.max(0, Number(item.distributedCount) || 0),
        lastDistributedAt: item.lastDistributedAt?.trim() || undefined,
        createdAt,
        updatedAt,
      };
    })
    .filter((item) => item.title.length > 0);
}

function normalizeGoals(entries: AppState["goals"] | undefined, fallbackDate: string): AppState["goals"] {
  if (!entries || entries.length === 0) {
    return [];
  }

  return entries.map((goal) => {
    const createdAt = goal.createdAt ?? fallbackDate;
    const updatedAt = goal.updatedAt ?? createdAt;

    return {
      ...goal,
      createdAt,
      updatedAt,
      breakdownItems: normalizeGoalBreakdownItems(goal.breakdownItems, fallbackDate),
      taskIds: goal.taskIds ?? [],
      sessionIds: goal.sessionIds ?? [],
    };
  });
}

function normalizeTasks(entries: AppState["tasks"] | undefined, fallbackDate: string): AppState["tasks"] {
  if (!entries || entries.length === 0) {
    return [];
  }

  return entries.map((task) => {
    const createdAt = task.createdAt ?? fallbackDate;
    const updatedAt = task.updatedAt ?? createdAt;
    const hasStart = Boolean(task.startTime);
    const hasEnd = Boolean(task.endTime);
    const inferredDuration =
      task.durationMinutes ??
      (task.startTime && task.endTime ? durationBetween(task.startTime, task.endTime) : undefined) ??
      60;
    const isScheduled = task.isScheduled ?? (hasStart && hasEnd);
    const syncedToCalendar = task.syncedToCalendar ?? false;

    if (!isScheduled) {
      return {
        ...task,
        createdAt,
        updatedAt,
        isScheduled: false,
        syncedToCalendar,
      };
    }

    const safeStart = task.startTime ?? "19:00";
    const safeEnd = task.endTime ?? addMinutes(safeStart, inferredDuration);

    return {
      ...task,
      createdAt,
      updatedAt,
      startTime: safeStart,
      endTime: safeEnd,
      durationMinutes: inferredDuration,
      isScheduled: true,
      syncedToCalendar,
    };
  });
}

function normalizeReviewEntries(entries: AppState["reviews"], fallbackDate: string): AppState["reviews"] {
  return entries.map((entry) => ({
    ...entry,
    updatedAt: entry.updatedAt ?? entry.createdAt ?? fallbackDate,
    createdAt: entry.createdAt ?? fallbackDate,
  }));
}

function normalizeWeatherLocations(locations: WeatherLocation[] | undefined, fallbackDate: string): WeatherLocation[] {
  if (!locations || locations.length === 0) {
    return [];
  }

  return locations.map((location) => ({
    ...location,
    label: location.label || location.city,
    createdAt: location.createdAt || fallbackDate,
    updatedAt: location.updatedAt || fallbackDate,
  }));
}

function normalizeTimelineItems(items: AppState["timelineItems"] | undefined, fallbackDate: string): AppState["timelineItems"] {
  if (!items || items.length === 0) {
    return [];
  }

  return items.map((item) => ({
    ...item,
    status: item.status ?? "planned",
    createdAt: item.createdAt ?? fallbackDate,
    updatedAt: item.updatedAt ?? item.createdAt ?? fallbackDate,
  }));
}

function deriveEventMemoStatus(status: EventMemoStatus, steps: EventMemo["steps"]): EventMemoStatus {
  if (steps.length === 0) {
    return status;
  }

  const completedCount = steps.filter((step) => step.completed).length;
  if (completedCount === 0) {
    return status === "completed" ? "not_started" : status;
  }
  if (completedCount === steps.length) {
    return "completed";
  }
  return "in_progress";
}

function normalizeEventMemos(entries: AppState["eventMemos"] | undefined, fallbackDate: string): AppState["eventMemos"] {
  if (!entries || entries.length === 0) {
    return [];
  }

  return entries.map((eventMemo) => {
    const steps = (eventMemo.steps ?? [])
      .map((step, index) => ({
        ...step,
        order: step.order ?? index + 1,
        completed: step.completed ?? false,
        createdAt: step.createdAt ?? fallbackDate,
        updatedAt: step.updatedAt ?? step.createdAt ?? fallbackDate,
      }))
      .sort((a, b) => a.order - b.order);

    const rawStatus = eventMemo.status as string | undefined;
    const migratedStatus = rawStatus === "pending" ? "not_started" : rawStatus;
    const safeStatus: EventMemoStatus =
      migratedStatus === "not_started" || migratedStatus === "in_progress" || migratedStatus === "completed" || migratedStatus === "paused"
        ? migratedStatus
        : "not_started";

    return {
      ...eventMemo,
      title: eventMemo.title?.trim() || "Untitled event",
      description: eventMemo.description?.trim() || "",
      status: deriveEventMemoStatus(safeStatus, steps),
      nextAction: eventMemo.nextAction?.trim() || "Next step",
      targetOutcome: eventMemo.targetOutcome?.trim() || undefined,
      why: eventMemo.why?.trim() || undefined,
      deadline: eventMemo.deadline?.trim() || undefined,
      blockedReason: eventMemo.blockedReason?.trim() || undefined,
      notes: eventMemo.notes?.trim() || undefined,
      completionSummary: eventMemo.completionSummary?.trim() || undefined,
      nextTimeTip: eventMemo.nextTimeTip?.trim() || undefined,
      relatedKnowledgeItemIds: eventMemo.relatedKnowledgeItemIds ?? [],
      linkedTaskIds: eventMemo.linkedTaskIds ?? [],
      steps,
      createdAt: eventMemo.createdAt ?? fallbackDate,
      updatedAt: eventMemo.updatedAt ?? eventMemo.createdAt ?? fallbackDate,
    };
  });
}

function normalizeFinanceCategories(
  categories: FinanceCategory[] | undefined,
  fallbackDate: string,
): FinanceCategory[] {
  if (!categories || categories.length === 0) {
    return [];
  }

  return categories
    .map((category, index) => ({
      ...category,
      order: category.order ?? index + 1,
      isSystem: category.isSystem ?? false,
      createdAt: category.createdAt ?? fallbackDate,
      updatedAt: category.updatedAt ?? fallbackDate,
    }))
    .sort((a, b) => a.order - b.order);
}

function normalizeFinanceRecords(
  records: AppState["financeRecords"] | undefined,
  fallbackDate: string,
): AppState["financeRecords"] {
  if (!records || records.length === 0) {
    return [];
  }

  return records
    .map((record) => ({
      ...record,
      amount: Math.max(0, Number(record.amount) || 0),
      source: record.source ?? "manual",
      note: record.note?.trim() || undefined,
      createdAt: record.createdAt ?? fallbackDate,
      updatedAt: record.updatedAt ?? fallbackDate,
    }))
    .sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`));
}

function normalizeBudgetPlans(
  plans: BudgetPlan[] | undefined,
  fallbackDate: string,
): BudgetPlan[] {
  if (!plans || plans.length === 0) {
    return [];
  }

  return plans
    .map((plan) => ({
      ...plan,
      monthlyBudget: Math.max(0, Number(plan.monthlyBudget) || 0),
      updatedAt: plan.updatedAt ?? fallbackDate,
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

function normalizeSpecialBudgets(
  budgets: AppState["specialBudgets"] | undefined,
  fallbackDate: string,
): AppState["specialBudgets"] {
  if (!budgets || budgets.length === 0) {
    return [];
  }

  return budgets
    .map((budget) => ({
      ...budget,
      name: budget.name?.trim() || "未命名专项预算",
      totalAmount: Math.max(0, Number(budget.totalAmount) || 0),
      note: budget.note?.trim() || undefined,
      startDate: budget.startDate?.trim() || undefined,
      endDate: budget.endDate?.trim() || undefined,
      createdAt: budget.createdAt ?? fallbackDate,
      updatedAt: budget.updatedAt ?? budget.createdAt ?? fallbackDate,
    }))
    .sort((a, b) => `${b.updatedAt}-${b.createdAt}`.localeCompare(`${a.updatedAt}-${a.createdAt}`));
}

function normalizeSpecialBudgetRecords(
  records: AppState["specialBudgetRecords"] | undefined,
  fallbackDate: string,
): AppState["specialBudgetRecords"] {
  if (!records || records.length === 0) {
    return [];
  }

  return records
    .map((record) => ({
      ...record,
      amount: Math.max(0, Number(record.amount) || 0),
      note: record.note?.trim() || undefined,
      createdAt: record.createdAt ?? fallbackDate,
      updatedAt: record.updatedAt ?? record.createdAt ?? fallbackDate,
    }))
    .sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`));
}

function normalizeUrlImportJobs(
  jobs: AppState["urlImportJobs"] | undefined,
  fallbackDate: string,
): AppState["urlImportJobs"] {
  if (!jobs || jobs.length === 0) {
    return [];
  }

  return jobs.map((job) => ({
    ...job,
    requestedAt: job.requestedAt ?? fallbackDate,
    parsedCount: Math.max(0, Number(job.parsedCount) || 0),
    status: job.status ?? "queued",
  }));
}

function normalizeFocusSessions(
  sessions: AppState["focusSessions"] | undefined,
  fallbackDate: string,
): AppState["focusSessions"] {
  if (!sessions || sessions.length === 0) {
    return [];
  }

  return sessions.map((session) => ({
    ...session,
    plannedMinutes: Math.max(1, Number(session.plannedMinutes) || 25),
    actualMinutes: Math.max(0, Number(session.actualMinutes) || 0),
    status: session.status ?? "running",
    createdAt: session.createdAt ?? fallbackDate,
    updatedAt: session.updatedAt ?? fallbackDate,
  }));
}

function normalizeFocusPresets(presets: AppState["focusPresets"] | undefined): AppState["focusPresets"] {
  if (!presets || presets.length === 0) {
    return [];
  }

  return presets
    .map((preset) => ({
      ...preset,
      minutes: Math.max(1, Number(preset.minutes) || 25),
    }))
    .sort((a, b) => a.minutes - b.minutes);
}

function normalizeGoalTemplates(
  templates: AppState["goalTemplates"] | undefined,
  fallbackDate: string,
): AppState["goalTemplates"] {
  if (!templates || templates.length === 0) {
    return [];
  }

  return templates
    .map((template) => {
      const name = template.name?.trim() || template.title?.trim() || "未命名模板";
      const title = template.title?.trim() || name;
      const createdAt = template.createdAt ?? fallbackDate;
      const updatedAt = template.updatedAt ?? createdAt;

      return {
        id: template.id || createId("goal_template"),
        name,
        title,
        specific: template.specific?.trim() || "",
        measurable: template.measurable?.trim() || "",
        achievable: template.achievable?.trim() || "",
        relevant: template.relevant?.trim() || "",
        estimatedTotalHours: Math.max(1, Number(template.estimatedTotalHours) || 1),
        priority: template.priority ?? "medium",
        createdAt,
        updatedAt,
      };
    })
    .sort((a, b) => `${b.updatedAt}-${b.createdAt}`.localeCompare(`${a.updatedAt}-${a.createdAt}`));
}

function ensureWeatherSelection(state: AppState): AppState {
  const locations = state.weatherLocations.length > 0 ? state.weatherLocations : createMockState().weatherLocations;
  const selected =
    locations.find((location) => location.id === state.selectedWeatherLocationId) ??
    locations.find((location) => location.isDefault) ??
    locations[0];

  const normalizedLocations = locations.map((location) => ({
    ...location,
    isDefault: location.id === selected.id,
  }));

  return {
    ...state,
    weatherLocations: normalizedLocations,
    selectedWeatherLocationId: selected.id,
    weather: getMockWeatherByCity(selected.city, todayKey()),
  };
}

function migrateLegacyKnowledgeItems(loaded: AppState, base: AppState): KnowledgeItem[] {
  const categoryIdByLegacy: Record<string, string> = {
    course_notes: "cat_note",
    method_library: "cat_method",
    wrong_question: UNCATEGORIZED_KNOWLEDGE_CATEGORY_ID,
    link_collection: UNCATEGORIZED_KNOWLEDGE_CATEGORY_ID,
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
      sourceType: raw.sourceType ?? (migratedType === "quick_note_import" ? "today_note" : "outside_knowledge"),
      categoryId: migratedCategoryId,
      tags: raw.tags ?? [],
      content: raw.content ?? "",
      attachments: raw.attachments ?? [],
      images: raw.images ?? [],
      fileType: raw.fileType,
      relatedTaskIds: raw.relatedTaskIds ?? [],
      updatedAt: raw.updatedAt ?? raw.createdAt ?? todayKey(),
      createdAt: raw.createdAt ?? todayKey(),
    };
  });
}

function localizeKnowledgeCategories(
  categories: AppState["knowledgeCategories"],
  baseCategories: AppState["knowledgeCategories"],
): AppState["knowledgeCategories"] {
  const baseMap = new Map(baseCategories.map((item) => [item.id, item]));
  return categories.map((item) => {
    const seeded = baseMap.get(item.id);
    if (!seeded || !seeded.isSystem) {
      return item;
    }
    return {
      ...item,
      name: seeded.name,
    };
  });
}

function localizeKnowledgeSubjects(
  subjects: AppState["knowledgeSubjects"],
  baseSubjects: AppState["knowledgeSubjects"],
): AppState["knowledgeSubjects"] {
  const baseMap = new Map(baseSubjects.map((item) => [item.id, item]));
  return subjects.map((item) => {
    const seeded = baseMap.get(item.id);
    if (!seeded) {
      return item;
    }
    return {
      ...item,
      name: seeded.name,
      description: seeded.description,
    };
  });
}

function localizeKnowledgeCourses(
  courses: AppState["knowledgeCourses"],
  baseCourses: AppState["knowledgeCourses"],
): AppState["knowledgeCourses"] {
  const baseMap = new Map(baseCourses.map((item) => [item.id, item]));
  return courses.map((item) => {
    const seeded = baseMap.get(item.id);
    if (!seeded) {
      return item;
    }
    return {
      ...item,
      name: seeded.name,
      description: seeded.description,
    };
  });
}

function localizeKnowledgeNodes(
  nodes: AppState["knowledgeNodes"],
  baseNodes: AppState["knowledgeNodes"],
): AppState["knowledgeNodes"] {
  const baseMap = new Map(baseNodes.map((item) => [item.id, item]));
  return nodes.map((item) => {
    const seeded = baseMap.get(item.id);
    if (!seeded) {
      return item;
    }
    return {
      ...item,
      title: seeded.title,
      description: seeded.description,
    };
  });
}

function localizeKnowledgeItems(
  items: AppState["knowledgeItems"],
  baseItems: AppState["knowledgeItems"],
): AppState["knowledgeItems"] {
  const baseMap = new Map(baseItems.map((item) => [item.id, item]));
  return items.map((item) => {
    const seeded = baseMap.get(item.id);
    if (!seeded) {
      return item;
    }
    return {
      ...item,
      title: seeded.title,
      tags: seeded.tags,
      content: seeded.content,
    };
  });
}

function localizeQuickNotes(
  notes: AppState["quickNotes"],
  baseNotes: AppState["quickNotes"],
): AppState["quickNotes"] {
  const baseMap = new Map(baseNotes.map((item) => [item.id, item]));
  return notes.map((item) => {
    const seeded = baseMap.get(item.id);
    if (!seeded) {
      return item;
    }
    return {
      ...item,
      title: seeded.title,
      tags: seeded.tags,
      content: seeded.content,
    };
  });
}

function localizePdfDocuments(
  docs: AppState["pdfDocuments"],
  baseDocs: AppState["pdfDocuments"],
): AppState["pdfDocuments"] {
  const baseMap = new Map(baseDocs.map((item) => [item.id, item]));
  return docs.map((item) => {
    const seeded = baseMap.get(item.id);
    if (!seeded) {
      return item;
    }
    return {
      ...item,
      title: seeded.title,
      summary: seeded.summary,
      keywords: seeded.keywords,
      highlights: seeded.highlights,
    };
  });
}

function normalizeLoadedState(loaded: AppState | null): AppState {
  const base = createMockState();
  if (!loaded) {
    return base;
  }

  const loadedWeatherLocations = normalizeWeatherLocations(loaded.weatherLocations, todayKey());
  const loadedTimelineItems = normalizeTimelineItems(loaded.timelineItems, todayKey());
  const normalizedTasks = normalizeTasks(loaded.tasks ?? base.tasks, todayKey());
  const normalizedGoals = normalizeGoals(loaded.goals ?? base.goals, todayKey());
  const normalizedGoalSessions = normalizeGoalSessions(loaded.goalSessions ?? base.goalSessions);
  const normalizedFinanceCategories = normalizeFinanceCategories(loaded.financeCategories ?? base.financeCategories, todayKey());
  const normalizedFinanceRecords = normalizeFinanceRecords(loaded.financeRecords ?? base.financeRecords, todayKey());
  const normalizedBudgetPlans = normalizeBudgetPlans(loaded.budgetPlans ?? base.budgetPlans, todayKey());
  const normalizedSpecialBudgets = normalizeSpecialBudgets(loaded.specialBudgets ?? base.specialBudgets, todayKey());
  const normalizedSpecialBudgetRecords = normalizeSpecialBudgetRecords(
    loaded.specialBudgetRecords ?? base.specialBudgetRecords,
    todayKey(),
  );
  const normalizedUrlImportJobs = normalizeUrlImportJobs(loaded.urlImportJobs ?? base.urlImportJobs, todayKey());
  const normalizedFocusPresets = normalizeFocusPresets(loaded.focusPresets ?? base.focusPresets);
  const normalizedFocusSessions = normalizeFocusSessions(loaded.focusSessions ?? base.focusSessions, todayKey());
  const normalizedGoalTemplates = normalizeGoalTemplates(loaded.goalTemplates ?? base.goalTemplates, todayKey());
  const normalizedKnowledgeCategories = ensureRequiredKnowledgeCategories(
    localizeKnowledgeCategories(loaded.knowledgeCategories ?? base.knowledgeCategories, base.knowledgeCategories),
    base.knowledgeCategories,
  );
  const normalizedKnowledgeSubjects = localizeKnowledgeSubjects(
    loaded.knowledgeSubjects ?? base.knowledgeSubjects,
    base.knowledgeSubjects,
  );
  const normalizedKnowledgeCourses = localizeKnowledgeCourses(
    loaded.knowledgeCourses ?? base.knowledgeCourses,
    base.knowledgeCourses,
  );
  const normalizedKnowledgeNodes = localizeKnowledgeNodes(
    loaded.knowledgeNodes ?? base.knowledgeNodes,
    base.knowledgeNodes,
  );
  const migratedKnowledgeItems = migrateLegacyKnowledgeItems(loaded, base);
  const normalizedKnowledgeItems = normalizeKnowledgeItemsCategoryIds(
    localizeKnowledgeItems(migratedKnowledgeItems, base.knowledgeItems),
    normalizedKnowledgeCategories,
  );
  const normalizedQuickNotes = normalizeQuickNotesCategoryIds(
    localizeQuickNotes(loaded.quickNotes ?? base.quickNotes, base.quickNotes),
    normalizedKnowledgeCategories,
  );
  const normalizedPdfDocuments = localizePdfDocuments(loaded.pdfDocuments ?? base.pdfDocuments, base.pdfDocuments);
  const normalizedEventMemos = normalizeEventMemos(loaded.eventMemos ?? base.eventMemos, todayKey());
  const syncedKnowledgeState = syncTaskKnowledgeState(normalizedTasks, normalizedKnowledgeItems, todayKey());

  const mergedRaw: AppState & { newsItems?: unknown } = {
    ...base,
    ...loaded,
    weatherLocations: loadedWeatherLocations.length > 0 ? loadedWeatherLocations : base.weatherLocations,
    selectedWeatherLocationId: loaded.selectedWeatherLocationId ?? base.selectedWeatherLocationId,
    timelineItems: loaded.timelineItems ? loadedTimelineItems : base.timelineItems,
    eventMemos: normalizedEventMemos,
    goals: normalizedGoals,
    goalTemplates: normalizedGoalTemplates,
    goalSessions: normalizedGoalSessions,
    weeklyPlans: loaded.weeklyPlans ?? base.weeklyPlans,
    tasks: syncedKnowledgeState.tasks,
    knowledgeItems: normalizedKnowledgeItems,
    knowledgeCategories: normalizedKnowledgeCategories,
    knowledgeSubjects: normalizedKnowledgeSubjects,
    knowledgeCourses: normalizedKnowledgeCourses,
    knowledgeNodes: normalizedKnowledgeNodes,
    quickNotes: normalizedQuickNotes,
    pdfDocuments: normalizedPdfDocuments,
    ideas: loaded.ideas ?? base.ideas,
    reviews: normalizeReviewEntries(loaded.reviews ?? base.reviews, todayKey()),
    financeCategories: normalizedFinanceCategories,
    financeRecords: normalizedFinanceRecords,
    budgetPlans: normalizedBudgetPlans,
    specialBudgets: normalizedSpecialBudgets,
    specialBudgetRecords: normalizedSpecialBudgetRecords,
    parsedImportTasks: loaded.parsedImportTasks ?? base.parsedImportTasks,
    taskImportInbox: loaded.taskImportInbox ?? base.taskImportInbox,
    urlImportProviders: loaded.urlImportProviders ?? base.urlImportProviders,
    urlImportJobs: normalizedUrlImportJobs,
    taskKnowledgeRelations: syncedKnowledgeState.taskKnowledgeRelations,
    focusPresets: normalizedFocusPresets,
    focusSessions: normalizedFocusSessions,
  };
  const { newsItems: _legacyNewsItems, ...mergedWithoutNews } = mergedRaw;
  const merged = mergedWithoutNews as AppState;

  return ensureWeatherSelection(stripLegacySeedData(merged));
}

function stripLegacySeedData(state: AppState): AppState {
  const seededGoalIds = new Set(["goal_exam"]);
  const seededTaskIds = new Set(["task_today_top_1", "task_today_secondary_1", "task_today_other_1", "task_weekly_1"]);
  const seededGoalSessionIds = new Set(["goal_session_1", "goal_session_2", "goal_session_3"]);
  const seededWeeklyPlanIds = new Set(["weekly_1"]);
  const seededKnowledgeItemIds = new Set(["knowledge_1"]);
  const seededQuickNoteIds = new Set(["quick_1"]);
  const seededPdfIds = new Set(["pdf_1"]);
  const seededIdeaIds = new Set(["idea_1"]);
  const seededReviewIds = new Set(["review_1"]);
  const seededFinanceRecordIds = new Set(["fin_1", "fin_2", "fin_3"]);
  const seededBudgetPlanIds = new Set(["budget_1"]);
  const seededSpecialBudgetIds = new Set(["special_1"]);
  const seededSpecialBudgetRecordIds = new Set(["special_record_1"]);
  const seededEventMemoIds = new Set(["event_1"]);
  const seededTimelineIds = new Set(["timeline_1"]);
  const seededFocusSessionIds = new Set(["focus_1"]);

  const goals = state.goals.filter((goal) => !seededGoalIds.has(goal.id));
  const goalMap = new Map(goals.map((goal) => [goal.id, goal]));
  const goalIdSet = new Set(goals.map((goal) => goal.id));

  const tasks = state.tasks
    .filter((task) => !seededTaskIds.has(task.id))
    .map((task) => {
      const safeGoalId = task.goalId && goalIdSet.has(task.goalId) ? task.goalId : undefined;
      const safeBreakdownId =
        safeGoalId && task.goalBreakdownItemId
          ? goalMap.get(safeGoalId)?.breakdownItems.some((item) => item.id === task.goalBreakdownItemId)
            ? task.goalBreakdownItemId
            : undefined
          : undefined;

      return {
        ...task,
        goalId: safeGoalId,
        goalBreakdownItemId: safeBreakdownId,
      };
    });
  const taskIdSet = new Set(tasks.map((task) => task.id));

  const goalSessions = state.goalSessions.filter(
    (session) => !seededGoalSessionIds.has(session.id) && goalIdSet.has(session.goalId),
  );
  const goalSessionIdSet = new Set(goalSessions.map((session) => session.id));

  const normalizedGoals = goals.map((goal) => ({
    ...goal,
    taskIds: goal.taskIds.filter((taskId) => taskIdSet.has(taskId)),
    sessionIds: goal.sessionIds.filter((sessionId) => goalSessionIdSet.has(sessionId)),
    breakdownItems: goal.breakdownItems ?? [],
  }));

  const knowledgeItems = state.knowledgeItems
    .filter((item) => !seededKnowledgeItemIds.has(item.id))
    .map((item) => ({
      ...item,
      relatedTaskIds: item.relatedTaskIds.filter((taskId) => taskIdSet.has(taskId)),
    }));
  const knowledgeItemIdSet = new Set(knowledgeItems.map((item) => item.id));

  const eventMemos = state.eventMemos
    .filter((eventMemo) => !seededEventMemoIds.has(eventMemo.id))
    .map((eventMemo) => ({
      ...eventMemo,
      linkedTaskIds: eventMemo.linkedTaskIds.filter((taskId) => taskIdSet.has(taskId)),
      relatedKnowledgeItemIds: eventMemo.relatedKnowledgeItemIds.filter((itemId) => knowledgeItemIdSet.has(itemId)),
    }));

  const specialBudgets = state.specialBudgets.filter((budget) => !seededSpecialBudgetIds.has(budget.id));
  const specialBudgetIdSet = new Set(specialBudgets.map((budget) => budget.id));

  return {
    ...state,
    timelineItems: state.timelineItems.filter((item) => !seededTimelineIds.has(item.id)),
    eventMemos,
    goals: normalizedGoals,
    goalSessions,
    weeklyPlans: state.weeklyPlans
      .filter((plan) => !seededWeeklyPlanIds.has(plan.id))
      .map((plan) => ({
        ...plan,
        weekGoalIds: plan.weekGoalIds.filter((goalId) => goalIdSet.has(goalId)),
      })),
    tasks,
    knowledgeItems,
    quickNotes: state.quickNotes.filter((note) => !seededQuickNoteIds.has(note.id)),
    pdfDocuments: state.pdfDocuments.filter((doc) => !seededPdfIds.has(doc.id)),
    ideas: state.ideas.filter((idea) => !seededIdeaIds.has(idea.id)),
    reviews: state.reviews.filter((review) => !seededReviewIds.has(review.id)),
    financeRecords: state.financeRecords.filter((record) => !seededFinanceRecordIds.has(record.id)),
    budgetPlans: state.budgetPlans.filter((plan) => !seededBudgetPlanIds.has(plan.id)),
    specialBudgets,
    specialBudgetRecords: state.specialBudgetRecords.filter(
      (record) => !seededSpecialBudgetRecordIds.has(record.id) && specialBudgetIdSet.has(record.specialBudgetId),
    ),
    taskKnowledgeRelations: state.taskKnowledgeRelations.filter(
      (relation) => taskIdSet.has(relation.taskId) && knowledgeItemIdSet.has(relation.knowledgeItemId),
    ),
    focusSessions: state.focusSessions.filter((session) => !seededFocusSessionIds.has(session.id)),
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

function buildTaskKnowledgeRelations(tasks: Task[], knowledgeItems: KnowledgeItem[], fallbackDate: string): TaskKnowledgeRelation[] {
  const taskIdSet = new Set(tasks.map((task) => task.id));
  const relationMap = new Map<string, TaskKnowledgeRelation>();

  knowledgeItems.forEach((item) => {
    item.relatedTaskIds.forEach((taskId) => {
      if (!taskIdSet.has(taskId)) {
        return;
      }
      const key = `${taskId}__${item.id}`;
      relationMap.set(key, {
        id: `task_kn_${taskId}_${item.id}`,
        taskId,
        knowledgeItemId: item.id,
        source: "knowledge_side",
        createdAt: fallbackDate,
        updatedAt: fallbackDate,
      });
    });
  });

  return Array.from(relationMap.values());
}

function syncTaskKnowledgeState(tasks: Task[], knowledgeItems: KnowledgeItem[], fallbackDate: string) {
  const syncedTasks = syncTaskKnowledgeLinks(tasks, knowledgeItems);
  const relations = buildTaskKnowledgeRelations(syncedTasks, knowledgeItems, fallbackDate);
  return {
    tasks: syncedTasks,
    taskKnowledgeRelations: relations,
  };
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
      replaceState(nextState) {
        setState(normalizeLoadedState(nextState));
      },

      addWeatherLocation(city) {
        const clean = city.trim();
        if (!clean) {
          return;
        }

        setState((prev) => {
          const existing = prev.weatherLocations.find(
            (location) => location.city.toLowerCase() === clean.toLowerCase(),
          );

          if (existing) {
            return {
              ...prev,
              selectedWeatherLocationId: existing.id,
              weather: getMockWeatherByCity(existing.city, todayKey()),
            };
          }

          const newLocation: WeatherLocation = {
            id: createId("weather"),
            city: clean,
            label: clean,
            isDefault: false,
            createdAt: nowDate(),
            updatedAt: nowDate(),
          };

          return {
            ...prev,
            weatherLocations: [...prev.weatherLocations, newLocation],
            selectedWeatherLocationId: newLocation.id,
            weather: getMockWeatherByCity(newLocation.city, todayKey()),
          };
        });
      },

      selectWeatherLocation(locationId) {
        setState((prev) => {
          const location = prev.weatherLocations.find((item) => item.id === locationId);
          if (!location) {
            return prev;
          }

          return {
            ...prev,
            selectedWeatherLocationId: location.id,
            weather: getMockWeatherByCity(location.city, todayKey()),
          };
        });
      },

      setDefaultWeatherLocation(locationId) {
        setState((prev) => {
          const target = prev.weatherLocations.find((item) => item.id === locationId);
          if (!target) {
            return prev;
          }

          const weatherLocations = prev.weatherLocations.map((location) => ({
            ...location,
            isDefault: location.id === locationId,
            updatedAt: nowDate(),
          }));

          return {
            ...prev,
            weatherLocations,
            selectedWeatherLocationId: locationId,
            weather: getMockWeatherByCity(target.city, todayKey()),
          };
        });
      },

      addManualTimelineItem(title, startTime, endTime) {
        const cleanTitle = title.trim();
        if (!cleanTitle || !startTime.trim()) {
          return;
        }

        setState((prev) => ({
          ...prev,
          timelineItems: [
            ...prev.timelineItems,
            {
              id: createId("timeline"),
              type: "manual_schedule",
              title: cleanTitle,
              date: todayKey(),
              startTime,
              endTime: endTime?.trim() || undefined,
              status: "planned",
              createdAt: nowDate(),
              updatedAt: nowDate(),
            } as TimelineItem,
          ],
        }));
      },

      removeManualTimelineItem(itemId) {
        setState((prev) => ({
          ...prev,
          timelineItems: prev.timelineItems.filter((item) => item.id !== itemId),
        }));
      },

      setTaskSchedule(taskId, startTime, endTime, durationMinutes) {
        const cleanStart = startTime.trim();
        if (!cleanStart) {
          return;
        }

        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id !== taskId) {
              return task;
            }

            const safeDuration = durationMinutes ?? task.durationMinutes ?? 60;
            const safeEnd = endTime?.trim() || addMinutes(cleanStart, safeDuration);

            return {
              ...task,
              startTime: cleanStart,
              endTime: safeEnd,
              durationMinutes: safeDuration,
              isScheduled: true,
              syncedToCalendar: false,
              updatedAt: nowDate(),
            };
          }),
        }));
      },

      clearTaskSchedule(taskId) {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  startTime: undefined,
                  endTime: undefined,
                  durationMinutes: undefined,
                  isScheduled: false,
                  syncedToCalendar: false,
                  updatedAt: nowDate(),
                }
              : task,
          ),
        }));
      },

      markTasksSyncedToCalendar(taskIds, synced) {
        if (taskIds.length === 0) {
          return;
        }
        const idSet = new Set(taskIds);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            idSet.has(task.id)
              ? {
                  ...task,
                  syncedToCalendar: synced,
                  updatedAt: nowDate(),
                }
              : task,
          ),
        }));
      },

      markGoalSessionsSyncedToCalendar(sessionIds, synced) {
        if (sessionIds.length === 0) {
          return;
        }
        const idSet = new Set(sessionIds);
        setState((prev) => ({
          ...prev,
          goalSessions: prev.goalSessions.map((session) =>
            idSet.has(session.id)
              ? {
                  ...session,
                  syncedToCalendar: synced,
                }
              : session,
          ),
        }));
      },

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

      deleteTask(taskId) {
        const cleanTaskId = taskId.trim();
        if (!cleanTaskId) {
          return;
        }

        setState((prev) => {
          const targetTask = prev.tasks.find((task) => task.id === cleanTaskId);
          if (!targetTask) {
            return prev;
          }

          const nextTasks = prev.tasks.filter((task) => task.id !== cleanTaskId);
          const nextKnowledgeItems = prev.knowledgeItems.map((item) => ({
            ...item,
            relatedTaskIds: item.relatedTaskIds.filter((id) => id !== cleanTaskId),
            updatedAt: item.relatedTaskIds.includes(cleanTaskId) ? nowDate() : item.updatedAt,
          }));
          const synced = syncTaskKnowledgeState(nextTasks, nextKnowledgeItems, nowDate());

          return {
            ...prev,
            tasks: synced.tasks,
            knowledgeItems: nextKnowledgeItems,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
            goals: prev.goals.map((goal) => ({
              ...goal,
              taskIds: goal.taskIds.filter((id) => id !== cleanTaskId),
              updatedAt: goal.taskIds.includes(cleanTaskId) ? nowDate() : goal.updatedAt,
            })),
            eventMemos: prev.eventMemos.map((memo) => ({
              ...memo,
              linkedTaskIds: memo.linkedTaskIds.filter((id) => id !== cleanTaskId),
              updatedAt: memo.linkedTaskIds.includes(cleanTaskId) ? nowDate() : memo.updatedAt,
            })),
            taskImportInbox: prev.taskImportInbox.map((item) =>
              item.importedTaskId === cleanTaskId
                ? {
                    ...item,
                    importedTaskId: undefined,
                    status: "unprocessed",
                    note: item.note ? `${item.note}锛堝師鍏宠仈浠诲姟宸插垹闄わ級` : "鍘熷叧鑱斾换鍔″凡鍒犻櫎",
                  }
                : item,
            ),
          };
        });
      },

      restoreDeletedGoalTask(task) {
        const cleanTaskId = task.id?.trim();
        const cleanTitle = task.title?.trim();
        const cleanDueDate = task.dueDate?.trim();
        if (!cleanTaskId || !cleanTitle || !cleanDueDate) {
          return;
        }

        setState((prev) => {
          if (prev.tasks.some((item) => item.id === cleanTaskId)) {
            return prev;
          }

          const timestamp = nowDate();
          const linkedGoal = task.goalId ? prev.goals.find((goal) => goal.id === task.goalId) : undefined;
          const safeGoalId = linkedGoal?.id;
          const safeBreakdownId =
            linkedGoal && task.goalBreakdownItemId
              ? linkedGoal.breakdownItems.some((item) => item.id === task.goalBreakdownItemId)
                ? task.goalBreakdownItemId
                : undefined
              : undefined;

          const maxOrder = prev.tasks
            .filter((item) => item.planType === task.planType && item.dueDate === cleanDueDate)
            .reduce((max, item) => Math.max(max, item.order), 0);
          const safeDuration = Math.max(
            15,
            task.durationMinutes ??
              (task.startTime && task.endTime ? durationBetween(task.startTime, task.endTime) : undefined) ??
              60,
          );
          const startTime = task.startTime?.trim() || undefined;
          const endTime = task.endTime?.trim() || (startTime ? addMinutes(startTime, safeDuration) : undefined);

          const restoredTask: Task = {
            ...task,
            id: cleanTaskId,
            title: cleanTitle,
            description: task.description ?? "",
            dueDate: cleanDueDate,
            startTime,
            endTime,
            durationMinutes: safeDuration,
            isScheduled: Boolean(startTime && endTime),
            syncedToCalendar: false,
            order: maxOrder + 1,
            goalId: safeGoalId,
            goalBreakdownItemId: safeBreakdownId,
            knowledgeItemIds: task.knowledgeItemIds ?? [],
            source: task.source ?? "manual",
            createdAt: task.createdAt ?? timestamp,
            updatedAt: timestamp,
          };

          let nextWeeklyPlans = prev.weeklyPlans;
          if (restoredTask.planType === "weekly" && safeGoalId) {
            const index = findCurrentWeeklyPlanIndex(prev);
            if (index >= 0) {
              const current = prev.weeklyPlans[index];
              if (!current.weekGoalIds.includes(safeGoalId)) {
                const weeklyPlans = [...prev.weeklyPlans];
                weeklyPlans[index] = {
                  ...current,
                  weekGoalIds: [...current.weekGoalIds, safeGoalId],
                  updatedAt: timestamp,
                };
                nextWeeklyPlans = weeklyPlans;
              }
            } else {
              const weekStartDate = toDateKey(startOfWeek(fromDateKey(todayKey())));
              nextWeeklyPlans = [
                {
                  id: createId("weekly_plan"),
                  weekStartDate,
                  weekGoalIds: [safeGoalId],
                  executionLog: [],
                  checkSummary: "",
                  nextWeekOneImprovement: "",
                  updatedAt: timestamp,
                },
                ...prev.weeklyPlans,
              ];
            }
          }

          const nextKnowledgeItems = prev.knowledgeItems.map((item) => {
            if (!restoredTask.knowledgeItemIds.includes(item.id)) {
              return item;
            }
            if (item.relatedTaskIds.includes(cleanTaskId)) {
              return item;
            }
            return {
              ...item,
              relatedTaskIds: [...item.relatedTaskIds, cleanTaskId],
              updatedAt: timestamp,
            };
          });
          const synced = syncTaskKnowledgeState([...prev.tasks, restoredTask], nextKnowledgeItems, timestamp);

          return {
            ...prev,
            tasks: synced.tasks,
            knowledgeItems: nextKnowledgeItems,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
            goals: safeGoalId
              ? prev.goals.map((goal) =>
                  goal.id === safeGoalId
                    ? {
                        ...goal,
                        taskIds: goal.taskIds.includes(cleanTaskId) ? goal.taskIds : [...goal.taskIds, cleanTaskId],
                        updatedAt: timestamp,
                      }
                    : goal,
                )
              : prev.goals,
            weeklyPlans: nextWeeklyPlans,
          };
        });
      },

      addTask(title, planType, schedule) {
        const clean = title.trim();
        if (!clean) {
          return;
        }

        setState((prev) => {
          const dueDate = planType === "weekly" ? toDateKey(addDays(fromDateKey(todayKey()), 3)) : todayKey();
          const maxOrder = prev.tasks
            .filter((task) => task.planType === planType && task.dueDate === dueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);
          const startTime = schedule?.startTime?.trim() || undefined;
          const duration = schedule?.durationMinutes ?? 60;
          const endTime = schedule?.endTime?.trim() || (startTime ? addMinutes(startTime, duration) : undefined);
          const isScheduled = Boolean(startTime && endTime);

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
                startTime,
                endTime,
                durationMinutes: duration,
                isScheduled,
                syncedToCalendar: false,
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
            breakdownItems: [],
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

      deleteGoal(goalId) {
        const cleanGoalId = goalId.trim();
        if (!cleanGoalId) {
          return;
        }

        setState((prev) => {
          const targetGoal = prev.goals.find((goal) => goal.id === cleanGoalId);
          if (!targetGoal) {
            return prev;
          }

          const removedTaskIds = new Set(
            prev.tasks.filter((task) => task.goalId === cleanGoalId).map((task) => task.id),
          );

          const nextTasks = prev.tasks.filter((task) => task.goalId !== cleanGoalId);
          const nextGoalSessions = prev.goalSessions.filter((session) => session.goalId !== cleanGoalId);
          const nextKnowledgeItems = prev.knowledgeItems.map((item) => ({
            ...item,
            relatedTaskIds: item.relatedTaskIds.filter((taskId) => !removedTaskIds.has(taskId)),
            updatedAt: item.relatedTaskIds.some((taskId) => removedTaskIds.has(taskId)) ? nowDate() : item.updatedAt,
          }));
          const synced = syncTaskKnowledgeState(nextTasks, nextKnowledgeItems, nowDate());

          return {
            ...prev,
            goals: prev.goals.filter((goal) => goal.id !== cleanGoalId),
            goalSessions: nextGoalSessions,
            tasks: synced.tasks,
            knowledgeItems: nextKnowledgeItems,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
            weeklyPlans: prev.weeklyPlans.map((plan) =>
              plan.weekGoalIds.includes(cleanGoalId)
                ? {
                    ...plan,
                    weekGoalIds: plan.weekGoalIds.filter((id) => id !== cleanGoalId),
                    updatedAt: nowDate(),
                  }
                : plan,
            ),
            timelineItems: prev.timelineItems.filter((item) => item.sourceGoalId !== cleanGoalId),
            focusSessions: prev.focusSessions.map((session) =>
              session.goalId === cleanGoalId
                ? {
                    ...session,
                    goalId: undefined,
                    updatedAt: nowDate(),
                  }
                : session,
            ),
            eventMemos: prev.eventMemos.map((memo) => ({
              ...memo,
              linkedTaskIds: memo.linkedTaskIds.filter((taskId) => !removedTaskIds.has(taskId)),
              updatedAt: memo.linkedTaskIds.some((taskId) => removedTaskIds.has(taskId)) ? nowDate() : memo.updatedAt,
            })),
            taskImportInbox: prev.taskImportInbox.map((item) =>
              item.importedTaskId && removedTaskIds.has(item.importedTaskId)
                ? {
                    ...item,
                    importedTaskId: undefined,
                    status: "unprocessed",
                    note: item.note ? `${item.note}锛堝師鍏宠仈鐩爣浠诲姟宸插垹闄わ級` : "鍘熷叧鑱旂洰鏍囦换鍔″凡鍒犻櫎",
                  }
                : item,
            ),
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

        setState((prev) => {
          const provider = prev.urlImportProviders.find((item) => item.enabled) ?? prev.urlImportProviders[0];
          const parsed = createMockImportTasks(clean);
          const importJob: UrlImportJob = {
            id: createId("url_job"),
            sourceUrl: clean,
            providerId: provider?.id ?? "provider_mock",
            requestedAt: nowDate(),
            status: "success",
            parsedCount: parsed.length,
          };

          return {
            ...prev,
            parsedImportTasks: parsed,
            urlImportJobs: [importJob, ...prev.urlImportJobs].slice(0, 20),
          };
        });
      },

      importTasksFromJson(payload) {
        const raw = payload.trim();
        if (!raw) {
          return { ok: false, message: "请先粘贴 JSON 内容。" };
        }

        let parsedInput: unknown;
        try {
          parsedInput = JSON.parse(raw);
        } catch {
          return { ok: false, message: "JSON 格式不正确，请检查后重试。" };
        }

        const rows = extractJsonImportRows(parsedInput);
        if (rows.length === 0) {
          return { ok: false, message: "未找到可导入的数据，请使用数组或包含 items/tasks 的对象。" };
        }

        const parsedTasks = rows
          .map((row) => toParsedImportTask(row))
          .filter((item): item is { title: string; sourceUrl: string } => Boolean(item))
          .map((item) => ({
            id: createId("import_task"),
            title: item.title,
            sourceUrl: item.sourceUrl,
            selected: true,
          }));

        const invalidCount = rows.length - parsedTasks.length;
        if (parsedTasks.length === 0) {
          return { ok: false, message: "没有可识别的任务标题字段（title/name/task 等）。", invalidCount };
        }

        const importJob: UrlImportJob = {
          id: createId("url_job"),
          sourceUrl: "json://manual",
          providerId: "provider_json",
          requestedAt: nowDate(),
          status: "success",
          parsedCount: parsedTasks.length,
          errorMessage: invalidCount > 0 ? `忽略 ${invalidCount} 条无效记录` : undefined,
        };

        setState((prev) => ({
          ...prev,
          parsedImportTasks: parsedTasks,
          urlImportJobs: [importJob, ...prev.urlImportJobs].slice(0, 20),
        }));

        const message =
          invalidCount > 0
            ? `已解析 ${parsedTasks.length} 条任务，忽略 ${invalidCount} 条无效记录。`
            : `已解析 ${parsedTasks.length} 条任务，请选择目标后导入。`;

        return {
          ok: true,
          message,
          parsedCount: parsedTasks.length,
          invalidCount,
        };
      },

      addTaskOnDate(title, planType, dueDate, schedule) {
        const clean = title.trim();
        const cleanDueDate = dueDate.trim();
        if (!clean || !cleanDueDate) {
          return;
        }

        setState((prev) => {
          const maxOrder = prev.tasks
            .filter((task) => task.planType === planType && task.dueDate === cleanDueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);
          const startTime = schedule?.startTime?.trim() || undefined;
          const duration = schedule?.durationMinutes ?? 60;
          const endTime = schedule?.endTime?.trim() || (startTime ? addMinutes(startTime, duration) : undefined);
          const isScheduled = Boolean(startTime && endTime);

          return {
            ...prev,
            tasks: [
              ...prev.tasks,
              {
                id: createId("task"),
                title: clean,
                description: "",
                completed: false,
                dueDate: cleanDueDate,
                startTime,
                endTime,
                durationMinutes: duration,
                isScheduled,
                syncedToCalendar: false,
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

      addGoalBreakdownItem(goalId, title) {
        const cleanGoalId = goalId.trim();
        const cleanTitle = title.trim();
        if (!cleanGoalId || !cleanTitle) {
          return;
        }

        setState((prev) => {
          const goal = prev.goals.find((item) => item.id === cleanGoalId);
          if (!goal) {
            return prev;
          }

          const timestamp = nowDate();
          const nextItem = {
            id: createId("goal_step"),
            title: cleanTitle,
            completed: false,
            distributedCount: 0,
            lastDistributedAt: undefined,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          return {
            ...prev,
            goals: prev.goals.map((item) =>
              item.id === cleanGoalId
                ? {
                    ...item,
                    status: item.status === "not_started" ? "active" : item.status,
                    breakdownItems: [...item.breakdownItems, nextItem],
                    updatedAt: timestamp,
                  }
                : item,
            ),
          };
        });
      },

      toggleGoalBreakdownItem(goalId, itemId) {
        const cleanGoalId = goalId.trim();
        const cleanItemId = itemId.trim();
        if (!cleanGoalId || !cleanItemId) {
          return;
        }

        setState((prev) => {
          const goal = prev.goals.find((item) => item.id === cleanGoalId);
          if (!goal) {
            return prev;
          }

          const exists = goal.breakdownItems.some((item) => item.id === cleanItemId);
          if (!exists) {
            return prev;
          }

          const timestamp = nowDate();

          return {
            ...prev,
            goals: prev.goals.map((item) =>
              item.id === cleanGoalId
                ? {
                    ...item,
                    breakdownItems: item.breakdownItems.map((step) =>
                      step.id === cleanItemId
                        ? {
                            ...step,
                            completed: !step.completed,
                            updatedAt: timestamp,
                          }
                        : step,
                    ),
                    updatedAt: timestamp,
                  }
                : item,
            ),
          };
        });
      },

      deleteGoalBreakdownItem(goalId, itemId) {
        const cleanGoalId = goalId.trim();
        const cleanItemId = itemId.trim();
        if (!cleanGoalId || !cleanItemId) {
          return;
        }

        setState((prev) => {
          const goal = prev.goals.find((item) => item.id === cleanGoalId);
          if (!goal || !goal.breakdownItems.some((item) => item.id === cleanItemId)) {
            return prev;
          }

          const timestamp = nowDate();

          return {
            ...prev,
            goals: prev.goals.map((item) =>
              item.id === cleanGoalId
                ? {
                    ...item,
                    breakdownItems: item.breakdownItems.filter((step) => step.id !== cleanItemId),
                    updatedAt: timestamp,
                  }
                : item,
            ),
          };
        });
      },

      moveGoalBreakdownItem(goalId, itemId, targetItemId) {
        const cleanGoalId = goalId.trim();
        const cleanItemId = itemId.trim();
        const cleanTargetItemId = targetItemId.trim();
        if (!cleanGoalId || !cleanItemId || !cleanTargetItemId || cleanItemId === cleanTargetItemId) {
          return;
        }

        setState((prev) => {
          const goal = prev.goals.find((item) => item.id === cleanGoalId);
          if (!goal) {
            return prev;
          }

          const fromIndex = goal.breakdownItems.findIndex((item) => item.id === cleanItemId);
          const toIndex = goal.breakdownItems.findIndex((item) => item.id === cleanTargetItemId);
          if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
            return prev;
          }

          const timestamp = nowDate();
          const reordered = [...goal.breakdownItems];
          const [moved] = reordered.splice(fromIndex, 1);
          if (!moved) {
            return prev;
          }
          reordered.splice(toIndex, 0, {
            ...moved,
            updatedAt: timestamp,
          });

          return {
            ...prev,
            goals: prev.goals.map((item) =>
              item.id === cleanGoalId
                ? {
                    ...item,
                    breakdownItems: reordered,
                    updatedAt: timestamp,
                  }
                : item,
            ),
          };
        });
      },

      markGoalBreakdownItemDistributed(goalId, itemId) {
        const cleanGoalId = goalId.trim();
        const cleanItemId = itemId.trim();
        if (!cleanGoalId || !cleanItemId) {
          return;
        }

        setState((prev) => {
          const goal = prev.goals.find((item) => item.id === cleanGoalId);
          if (!goal || !goal.breakdownItems.some((item) => item.id === cleanItemId)) {
            return prev;
          }

          const timestamp = nowDate();

          return {
            ...prev,
            goals: prev.goals.map((item) =>
              item.id === cleanGoalId
                ? {
                    ...item,
                    breakdownItems: item.breakdownItems.map((step) =>
                      step.id === cleanItemId
                        ? {
                            ...step,
                            distributedCount: step.distributedCount + 1,
                            lastDistributedAt: timestamp,
                            updatedAt: timestamp,
                          }
                        : step,
                    ),
                    updatedAt: timestamp,
                  }
                : item,
            ),
          };
        });
      },

      addGoalTemplate(name, payload) {
        const cleanName = name.trim();
        const cleanTitle = payload.title.trim();
        if (!cleanName || !cleanTitle) {
          return;
        }

        setState((prev) => {
          const timestamp = nowDate();
          const templateId = createId("goal_template");
          return {
            ...prev,
            goalTemplates: [
              {
                id: templateId,
                name: cleanName,
                title: cleanTitle,
                specific: payload.specific.trim(),
                measurable: payload.measurable.trim(),
                achievable: payload.achievable.trim(),
                relevant: payload.relevant.trim(),
                estimatedTotalHours: Math.max(1, Number(payload.estimatedTotalHours) || 1),
                priority: payload.priority,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
              ...prev.goalTemplates,
            ],
          };
        });
      },

      deleteGoalTemplate(templateId) {
        const cleanTemplateId = templateId.trim();
        if (!cleanTemplateId) {
          return;
        }

        setState((prev) => ({
          ...prev,
          goalTemplates: prev.goalTemplates.filter((template) => template.id !== cleanTemplateId),
        }));
      },

      distributeGoalTaskToPlan(goalId, title, planType, dueDate, schedule, goalBreakdownItemId) {
        const cleanGoalId = goalId.trim();
        const cleanTitle = title.trim();
        const cleanDueDate = dueDate.trim();
        if (!cleanGoalId || !cleanTitle || !cleanDueDate) {
          return;
        }

        setState((prev) => {
          const targetGoal = prev.goals.find((goal) => goal.id === cleanGoalId);
          if (!targetGoal) {
            return prev;
          }
          const cleanBreakdownId = goalBreakdownItemId?.trim() || undefined;
          const hasBreakdownRef =
            !!cleanBreakdownId && targetGoal.breakdownItems.some((item) => item.id === cleanBreakdownId);

          const maxOrder = prev.tasks
            .filter((task) => task.planType === planType && task.dueDate === cleanDueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);

          const safeDuration = Math.max(15, schedule?.durationMinutes ?? 60);
          const startTime = schedule?.startTime?.trim() || undefined;
          const endTime = schedule?.endTime?.trim() || (startTime ? addMinutes(startTime, safeDuration) : undefined);
          const isScheduled = Boolean(startTime && endTime);
          const taskId = createId("task");
          const timestamp = nowDate();

          let nextWeeklyPlans = prev.weeklyPlans;
          if (planType === "weekly") {
            const index = findCurrentWeeklyPlanIndex(prev);

            if (index >= 0) {
              const current = prev.weeklyPlans[index];
              if (!current.weekGoalIds.includes(cleanGoalId)) {
                const weeklyPlans = [...prev.weeklyPlans];
                weeklyPlans[index] = {
                  ...current,
                  weekGoalIds: [...current.weekGoalIds, cleanGoalId],
                  updatedAt: timestamp,
                };
                nextWeeklyPlans = weeklyPlans;
              }
            } else {
              const weekStartDate = toDateKey(startOfWeek(fromDateKey(todayKey())));
              nextWeeklyPlans = [
                {
                  id: createId("weekly_plan"),
                  weekStartDate,
                  weekGoalIds: [cleanGoalId],
                  executionLog: [],
                  checkSummary: "",
                  nextWeekOneImprovement: "",
                  updatedAt: timestamp,
                },
                ...prev.weeklyPlans,
              ];
            }
          }

          return {
            ...prev,
            tasks: [
              ...prev.tasks,
              {
                id: taskId,
                title: cleanTitle,
                description: "",
                completed: false,
                dueDate: cleanDueDate,
                startTime,
                endTime,
                durationMinutes: safeDuration,
                isScheduled,
                syncedToCalendar: false,
                priority: "medium",
                planType,
                order: maxOrder + 1,
                goalId: cleanGoalId,
                goalBreakdownItemId: hasBreakdownRef ? cleanBreakdownId : undefined,
                knowledgeItemIds: [],
                source: "manual",
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
            goals: prev.goals.map((goal) =>
              goal.id === cleanGoalId
                ? {
                    ...goal,
                    taskIds: goal.taskIds.includes(taskId) ? goal.taskIds : [...goal.taskIds, taskId],
                    status: goal.status === "not_started" ? "active" : goal.status,
                    breakdownItems:
                      hasBreakdownRef && cleanBreakdownId
                        ? goal.breakdownItems.map((item) =>
                            item.id === cleanBreakdownId
                              ? {
                                  ...item,
                                  distributedCount: item.distributedCount + 1,
                                  lastDistributedAt: timestamp,
                                  updatedAt: timestamp,
                                }
                              : item,
                          )
                        : goal.breakdownItems,
                    updatedAt: timestamp,
                  }
                : goal,
            ),
            weeklyPlans: nextWeeklyPlans,
          };
        });
      },

      reassignGoalDistributedTask(taskId, planType, dueDate, schedule) {
        const cleanTaskId = taskId.trim();
        const cleanDueDate = dueDate.trim();
        if (!cleanTaskId || !cleanDueDate) {
          return;
        }

        setState((prev) => {
          const targetTask = prev.tasks.find((task) => task.id === cleanTaskId);
          if (!targetTask) {
            return prev;
          }

          const maxOrder = prev.tasks
            .filter((task) => task.id !== cleanTaskId && task.planType === planType && task.dueDate === cleanDueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);
          const safeDuration = Math.max(15, schedule?.durationMinutes ?? targetTask.durationMinutes ?? 60);
          const startTime = schedule?.startTime?.trim() || undefined;
          const endTime = schedule?.endTime?.trim() || (startTime ? addMinutes(startTime, safeDuration) : undefined);
          const isScheduled = Boolean(startTime && endTime);
          const timestamp = nowDate();

          let nextWeeklyPlans = prev.weeklyPlans;
          if (planType === "weekly" && targetTask.goalId) {
            const index = findCurrentWeeklyPlanIndex(prev);

            if (index >= 0) {
              const current = prev.weeklyPlans[index];
              if (!current.weekGoalIds.includes(targetTask.goalId)) {
                const weeklyPlans = [...prev.weeklyPlans];
                weeklyPlans[index] = {
                  ...current,
                  weekGoalIds: [...current.weekGoalIds, targetTask.goalId],
                  updatedAt: timestamp,
                };
                nextWeeklyPlans = weeklyPlans;
              }
            } else {
              const weekStartDate = toDateKey(startOfWeek(fromDateKey(todayKey())));
              nextWeeklyPlans = [
                {
                  id: createId("weekly_plan"),
                  weekStartDate,
                  weekGoalIds: [targetTask.goalId],
                  executionLog: [],
                  checkSummary: "",
                  nextWeekOneImprovement: "",
                  updatedAt: timestamp,
                },
                ...prev.weeklyPlans,
              ];
            }
          }

          return {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === cleanTaskId
                ? {
                    ...task,
                    planType,
                    dueDate: cleanDueDate,
                    startTime,
                    endTime,
                    durationMinutes: safeDuration,
                    isScheduled,
                    syncedToCalendar: false,
                    order: maxOrder + 1,
                    updatedAt: timestamp,
                  }
                : task,
            ),
            weeklyPlans: nextWeeklyPlans,
          };
        });
      },

      moveIncompleteTodayTasksToTomorrow() {
        setState((prev) => {
          const today = todayKey();
          const tomorrow = toDateKey(addDays(fromDateKey(today), 1));

          const candidateIds = prev.tasks
            .filter((task) => task.dueDate === today && !task.completed && task.planType !== "weekly")
            .map((task) => task.id);

          if (candidateIds.length === 0) {
            return prev;
          }

          const idSet = new Set(candidateIds);
          const maxOrderByType: Record<TaskPlanType, number> = {
            today_top: prev.tasks
              .filter((task) => task.dueDate === tomorrow && task.planType === "today_top")
              .reduce((max, task) => Math.max(max, task.order), 0),
            today_secondary: prev.tasks
              .filter((task) => task.dueDate === tomorrow && task.planType === "today_secondary")
              .reduce((max, task) => Math.max(max, task.order), 0),
            today_other: prev.tasks
              .filter((task) => task.dueDate === tomorrow && task.planType === "today_other")
              .reduce((max, task) => Math.max(max, task.order), 0),
            weekly: prev.tasks
              .filter((task) => task.dueDate === tomorrow && task.planType === "weekly")
              .reduce((max, task) => Math.max(max, task.order), 0),
          };

          return {
            ...prev,
            tasks: prev.tasks.map((task) => {
              if (!idSet.has(task.id)) {
                return task;
              }

              const nextOrder = maxOrderByType[task.planType] + 1;
              maxOrderByType[task.planType] = nextOrder;

              return {
                ...task,
                dueDate: tomorrow,
                order: nextOrder,
                startTime: undefined,
                endTime: undefined,
                durationMinutes: undefined,
                isScheduled: false,
                syncedToCalendar: false,
                updatedAt: nowDate(),
              };
            }),
          };
        });
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

          if (target === "inbox") {
            const inboxItems = selected.map((item) => ({
              id: createId("import_inbox"),
              title: item.title,
              sourceUrl: item.sourceUrl,
              createdAt: nowDate(),
              status: "unprocessed" as const,
            }));

            return {
              ...prev,
              taskImportInbox: [...inboxItems, ...prev.taskImportInbox],
              parsedImportTasks: [],
            };
          }

          const dueDate = target === "today" ? todayKey() : toDateKey(addDays(fromDateKey(todayKey()), 3));
          const planType: TaskPlanType = target === "today" ? "today_other" : "weekly";
          const currentMax = prev.tasks
            .filter((task) => task.planType === planType && task.dueDate === dueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);

          const newTasks = selected.map((item, index) => ({
            id: createId("task"),
            title: item.title,
            description: `source: ${item.sourceUrl}`,
            completed: false,
            dueDate,
            isScheduled: false,
            syncedToCalendar: false,
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

      linkTaskToKnowledge(taskId, knowledgeItemId) {
        setState((prev) => {
          const taskExists = prev.tasks.some((task) => task.id === taskId);
          if (!taskExists) {
            return prev;
          }

          const knowledgeItems = prev.knowledgeItems.map((item) =>
            item.id === knowledgeItemId
              ? {
                  ...item,
                  relatedTaskIds: Array.from(new Set([...item.relatedTaskIds, taskId])),
                  updatedAt: nowDate(),
                }
              : item,
          );

          const synced = syncTaskKnowledgeState(prev.tasks, knowledgeItems, nowDate());
          return {
            ...prev,
            knowledgeItems,
            tasks: synced.tasks,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
          };
        });
      },

      unlinkTaskFromKnowledge(taskId, knowledgeItemId) {
        setState((prev) => {
          const knowledgeItems = prev.knowledgeItems.map((item) =>
            item.id === knowledgeItemId
              ? {
                  ...item,
                  relatedTaskIds: item.relatedTaskIds.filter((id) => id !== taskId),
                  updatedAt: nowDate(),
                }
              : item,
          );

          const synced = syncTaskKnowledgeState(prev.tasks, knowledgeItems, nowDate());
          return {
            ...prev,
            knowledgeItems,
            tasks: synced.tasks,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
          };
        });
      },

      startFocusSession(mode, plannedMinutes, taskId, goalId) {
        const safeMinutes = Math.max(1, Math.round(plannedMinutes));
        setState((prev) => ({
          ...prev,
          focusSessions: [
            {
              id: createId("focus"),
              taskId,
              goalId,
              mode,
              plannedMinutes: safeMinutes,
              actualMinutes: 0,
              status: "running",
              startedAt: new Date().toISOString(),
              createdAt: nowDate(),
              updatedAt: nowDate(),
            },
            ...prev.focusSessions,
          ],
        }));
      },

      finishFocusSession(sessionId, status, actualMinutes) {
        setState((prev) => ({
          ...prev,
          focusSessions: prev.focusSessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  status,
                  actualMinutes: Math.max(0, Math.round(actualMinutes ?? session.plannedMinutes)),
                  endedAt: new Date().toISOString(),
                  updatedAt: nowDate(),
                }
              : session,
          ),
        }));
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
                isScheduled: false,
                syncedToCalendar: false,
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
          const resolvedCategoryId = normalizeKnowledgeCategoryId(categoryId ?? "cat_method", prev.knowledgeCategories);

          const knowledgeId = createId("knowledge");
          const knowledgeItems = [
            {
              id: knowledgeId,
              title: idea.content.slice(0, 24),
              type: "note" as const,
              sourceType: "outside_knowledge" as const,
              tags: ["from_idea"],
              content: idea.content,
              attachments: [],
              images: [],
              categoryId: resolvedCategoryId,
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

      addEventMemo(input) {
        const cleanTitle = input.title.trim();
        if (!cleanTitle) {
          return;
        }

        const now = nowDate();
        const defaultSteps = [
          {
            id: createId("event_step"),
            title: "Step 1",
            completed: false,
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("event_step"),
            title: "Step 2",
            completed: false,
            order: 2,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId("event_step"),
            title: "Step 3",
            completed: false,
            order: 3,
            createdAt: now,
            updatedAt: now,
          },
        ];

        setState((prev) => ({
          ...prev,
          eventMemos: [
            {
              id: createId("event_memo"),
              title: cleanTitle,
              description: input.description?.trim() || "",
              status: "not_started",
              deadline: input.deadline?.trim() || undefined,
              targetOutcome: input.targetOutcome?.trim() || undefined,
              why: input.why?.trim() || undefined,
              nextAction: input.nextAction?.trim() || "Step 1",
              blockedReason: undefined,
              notes: undefined,
              completionSummary: undefined,
              nextTimeTip: undefined,
              relatedKnowledgeItemIds: [],
              linkedTaskIds: [],
              steps: defaultSteps,
              createdAt: now,
              updatedAt: now,
            },
            ...prev.eventMemos,
          ],
        }));
      },

      updateEventMemo(eventMemoId, patch) {
        setState((prev) => ({
          ...prev,
          eventMemos: prev.eventMemos.map((item) => {
            if (item.id !== eventMemoId) {
              return item;
            }

            const nextTitle = patch.title !== undefined ? patch.title.trim() || item.title : item.title;
            const nextDeadline = patch.deadline !== undefined ? patch.deadline.trim() || undefined : item.deadline;
            const nextWhy = patch.why !== undefined ? patch.why.trim() || undefined : item.why;
            const nextDescription = patch.description !== undefined ? patch.description.trim() : item.description;
            const nextTargetOutcome =
              patch.targetOutcome !== undefined ? patch.targetOutcome.trim() || undefined : item.targetOutcome;
            const nextAction = patch.nextAction !== undefined ? patch.nextAction.trim() || "Step 1" : item.nextAction;
            const nextBlockedReason =
              patch.blockedReason !== undefined ? patch.blockedReason.trim() || undefined : item.blockedReason;
            const nextNotes = patch.notes !== undefined ? patch.notes.trim() || undefined : item.notes;
            const nextSummary =
              patch.completionSummary !== undefined ? patch.completionSummary.trim() || undefined : item.completionSummary;
            const nextTimeTip = patch.nextTimeTip !== undefined ? patch.nextTimeTip.trim() || undefined : item.nextTimeTip;
            const nextStatus = patch.status ?? item.status;

            return {
              ...item,
              title: nextTitle,
              description: nextDescription,
              deadline: nextDeadline,
              targetOutcome: nextTargetOutcome,
              why: nextWhy,
              nextAction,
              blockedReason: nextBlockedReason,
              notes: nextNotes,
              completionSummary: nextSummary,
              nextTimeTip,
              status: nextStatus,
              updatedAt: nowDate(),
            };
          }),
        }));
      },

      addEventMemoStep(eventMemoId, stepTitle) {
        const clean = stepTitle.trim();
        if (!clean) {
          return;
        }

        setState((prev) => ({
          ...prev,
          eventMemos: prev.eventMemos.map((item) => {
            if (item.id !== eventMemoId) {
              return item;
            }

            const maxOrder = item.steps.reduce((max, step) => Math.max(max, step.order), 0);
            const steps = [
              ...item.steps,
              {
                id: createId("event_step"),
                title: clean,
                completed: false,
                order: maxOrder + 1,
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
            ];

            return {
              ...item,
              steps,
              status: deriveEventMemoStatus(item.status, steps),
              updatedAt: nowDate(),
            };
          }),
        }));
      },

      toggleEventMemoStep(eventMemoId, stepId) {
        setState((prev) => ({
          ...prev,
          eventMemos: prev.eventMemos.map((item) => {
            if (item.id !== eventMemoId) {
              return item;
            }

            const steps = item.steps.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    completed: !step.completed,
                    updatedAt: nowDate(),
                  }
                : step,
            );

            return {
              ...item,
              steps,
              status: deriveEventMemoStatus(item.status, steps),
              updatedAt: nowDate(),
            };
          }),
        }));
      },

      reorderEventMemoStep(eventMemoId, stepId, direction) {
        setState((prev) => ({
          ...prev,
          eventMemos: prev.eventMemos.map((item) => {
            if (item.id !== eventMemoId) {
              return item;
            }

            const steps = [...item.steps].sort((a, b) => a.order - b.order);
            const index = steps.findIndex((step) => step.id === stepId);
            const swapIndex = direction === "up" ? index - 1 : index + 1;

            if (index < 0 || swapIndex < 0 || swapIndex >= steps.length) {
              return item;
            }

            const next = [...steps];
            const temp = next[index];
            const swapTarget = next[swapIndex];
            next[index] = next[swapIndex];
            next[swapIndex] = temp;

            const normalized = next.map((step, idx) => ({
              ...step,
              order: idx + 1,
              updatedAt: step.id === stepId || step.id === swapTarget.id ? nowDate() : step.updatedAt,
            }));

            return {
              ...item,
              steps: normalized,
              updatedAt: nowDate(),
            };
          }),
        }));
      },

      deleteEventMemoStep(eventMemoId, stepId) {
        setState((prev) => ({
          ...prev,
          eventMemos: prev.eventMemos.map((item) => {
            if (item.id !== eventMemoId) {
              return item;
            }

            const steps = item.steps
              .filter((step) => step.id !== stepId)
              .map((step, index) => ({
                ...step,
                order: index + 1,
              }));

            return {
              ...item,
              steps,
              status: deriveEventMemoStatus(item.status, steps),
              updatedAt: nowDate(),
            };
          }),
        }));
      },

      moveEventMemoToPlan(eventMemoId, target) {
        setState((prev) => {
          const eventMemo = prev.eventMemos.find((item) => item.id === eventMemoId);
          if (!eventMemo) {
            return prev;
          }

          let dueDate = todayKey();
          let planType: TaskPlanType = "today_other";
          if (target === "tomorrow") {
            dueDate = toDateKey(addDays(fromDateKey(todayKey()), 1));
            planType = "today_other";
          } else if (target === "weekly") {
            dueDate = toDateKey(addDays(fromDateKey(todayKey()), 3));
            planType = "weekly";
          }

          const maxOrder = prev.tasks
            .filter((task) => task.planType === planType && task.dueDate === dueDate)
            .reduce((max, task) => Math.max(max, task.order), 0);

          const taskId = createId("task");
          const taskTitle = eventMemo.nextAction?.trim() || eventMemo.title;

          return {
            ...prev,
            tasks: [
              ...prev.tasks,
              {
                id: taskId,
                title: taskTitle,
                description: eventMemo.description
                  ? `闂傚倷绀侀幖顐λ囬銏犵？闁圭虎鍠栭崥瑙勭節婵犲倸顏い鈺傜叀閹鏁愰崒娑欑彆濡炪倖鍔樺Λ鍕€︾捄銊﹀磯闁绘垶蓱閹瑧绱撴担铏瑰笡婵炶尙鍠栧?{eventMemo.title}\n${eventMemo.description}`
                  : `闂傚倷绀侀幖顐λ囬銏犵？闁圭虎鍠栭崥瑙勭節婵犲倸顏い鈺傜叀閹鏁愰崒娑欑彆濡炪倖鍔樺Λ鍕€︾捄銊﹀磯闁绘垶蓱閹瑧绱撴担铏瑰笡婵炶尙鍠栧?{eventMemo.title}`,
                completed: false,
                dueDate,
                isScheduled: false,
                syncedToCalendar: false,
                priority: "medium",
                planType,
                order: maxOrder + 1,
                knowledgeItemIds: [],
                source: "manual",
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
            ],
            eventMemos: prev.eventMemos.map((item) =>
              item.id === eventMemoId
                ? {
                    ...item,
                    status: item.status === "not_started" ? "in_progress" : item.status,
                    linkedTaskIds: item.linkedTaskIds.includes(taskId) ? item.linkedTaskIds : [...item.linkedTaskIds, taskId],
                    updatedAt: nowDate(),
                  }
                : item,
            ),
          };
        });
      },

      linkEventMemoToKnowledge(eventMemoId, knowledgeItemId) {
        setState((prev) => {
          const knowledgeExists = prev.knowledgeItems.some((item) => item.id === knowledgeItemId);
          if (!knowledgeExists) {
            return prev;
          }

          return {
            ...prev,
            eventMemos: prev.eventMemos.map((item) =>
              item.id === eventMemoId
                ? {
                    ...item,
                    relatedKnowledgeItemIds: item.relatedKnowledgeItemIds.includes(knowledgeItemId)
                      ? item.relatedKnowledgeItemIds
                      : [...item.relatedKnowledgeItemIds, knowledgeItemId],
                    updatedAt: nowDate(),
                  }
                : item,
            ),
          };
        });
      },

      addReview(wins, wastedTime, improveOneThing) {
        const date = todayKey();

        setState((prev) => {
          const exists = prev.reviews.find((entry) => entry.date === date);
          const review = {
            id: exists?.id ?? createId("review"),
            date,
            wins: wins.trim(),
            wastedTime: wastedTime.trim(),
            improveOneThing: improveOneThing.trim(),
            createdAt: exists?.createdAt ?? date,
            updatedAt: nowDate(),
          };

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

      addFinanceRecord(input) {
        const amount = Number(input.amount);
        const cleanDate = input.date?.trim();
        const cleanCategoryId = input.categoryId?.trim();
        const cleanNote = input.note?.trim();

        if (!cleanDate || !cleanCategoryId || !Number.isFinite(amount) || amount <= 0) {
          return;
        }

        setState((prev) => {
          const category = prev.financeCategories.find((item) => item.id === cleanCategoryId);
          if (!category || category.type !== input.type) {
            return prev;
          }

          return {
            ...prev,
            financeRecords: [
              {
                id: createId("finance"),
                type: input.type,
                amount: Math.round(amount * 100) / 100,
                categoryId: cleanCategoryId,
                note: cleanNote || undefined,
                date: cleanDate,
                source: "manual",
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
              ...prev.financeRecords,
            ],
          };
        });
      },

      setMonthlyBudget(monthKey, monthlyBudget) {
        const cleanMonth = monthKey.trim();
        const safeBudget = Math.max(0, Number(monthlyBudget) || 0);
        if (!cleanMonth) {
          return;
        }

        setState((prev) => {
          const existing = prev.budgetPlans.find((item) => item.monthKey === cleanMonth);

          if (!existing) {
            return {
              ...prev,
              budgetPlans: [
                {
                  id: createId("budget"),
                  monthKey: cleanMonth,
                  monthlyBudget: safeBudget,
                  updatedAt: nowDate(),
                },
                ...prev.budgetPlans,
              ],
            };
          }

          return {
            ...prev,
            budgetPlans: prev.budgetPlans.map((item) =>
              item.monthKey === cleanMonth
                ? {
                    ...item,
                    monthlyBudget: safeBudget,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
          };
        });
      },

      setCategoryBudget(monthKey, categoryId, budgetAmount) {
        const cleanMonth = monthKey.trim();
        const cleanCategoryId = categoryId.trim();
        const safeAmount = Math.max(0, Number(budgetAmount) || 0);
        if (!cleanMonth || !cleanCategoryId) {
          return;
        }

        setState((prev) => {
          const category = prev.financeCategories.find((item) => item.id === cleanCategoryId && item.type === "expense");
          if (!category) {
            return prev;
          }

          const existing = prev.budgetPlans.find((item) => item.monthKey === cleanMonth);
          const nextCategoryBudgets = {
            ...(existing?.categoryBudgets ?? {}),
            [cleanCategoryId]: safeAmount,
          };

          if (!existing) {
            return {
              ...prev,
              budgetPlans: [
                {
                  id: createId("budget"),
                  monthKey: cleanMonth,
                  monthlyBudget: 0,
                  categoryBudgets: nextCategoryBudgets,
                  updatedAt: nowDate(),
                },
                ...prev.budgetPlans,
              ],
            };
          }

          return {
            ...prev,
            budgetPlans: prev.budgetPlans.map((item) =>
              item.monthKey === cleanMonth
                ? {
                    ...item,
                    categoryBudgets: nextCategoryBudgets,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
          };
        });
      },

      removeCategoryBudget(monthKey, categoryId) {
        const cleanMonth = monthKey.trim();
        const cleanCategoryId = categoryId.trim();
        if (!cleanMonth || !cleanCategoryId) {
          return;
        }

        setState((prev) => {
          const existing = prev.budgetPlans.find((item) => item.monthKey === cleanMonth);
          if (!existing?.categoryBudgets || !(cleanCategoryId in existing.categoryBudgets)) {
            return prev;
          }

          const nextCategoryBudgets = { ...existing.categoryBudgets };
          delete nextCategoryBudgets[cleanCategoryId];

          return {
            ...prev,
            budgetPlans: prev.budgetPlans.map((item) =>
              item.monthKey === cleanMonth
                ? {
                    ...item,
                    categoryBudgets: nextCategoryBudgets,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
          };
        });
      },

      addSpecialBudget(input) {
        const name = input.name.trim();
        const totalAmount = Number(input.totalAmount);
        const startDate = input.startDate?.trim();
        const endDate = input.endDate?.trim();
        const note = input.note?.trim();

        if (!name || !Number.isFinite(totalAmount) || totalAmount <= 0) {
          return;
        }

        setState((prev) => ({
          ...prev,
          specialBudgets: [
            {
              id: createId("sp_budget"),
              name,
              totalAmount: Math.round(totalAmount * 100) / 100,
              startDate: startDate || undefined,
              endDate: endDate || undefined,
              note: note || undefined,
              createdAt: nowDate(),
              updatedAt: nowDate(),
            },
            ...prev.specialBudgets,
          ],
        }));
      },

      updateSpecialBudget(budgetId, input) {
        const name = input.name.trim();
        const totalAmount = Number(input.totalAmount);
        const startDate = input.startDate?.trim();
        const endDate = input.endDate?.trim();
        const note = input.note?.trim();

        if (!name || !Number.isFinite(totalAmount) || totalAmount <= 0) {
          return;
        }

        setState((prev) => ({
          ...prev,
          specialBudgets: prev.specialBudgets.map((item) =>
            item.id === budgetId
              ? {
                  ...item,
                  name,
                  totalAmount: Math.round(totalAmount * 100) / 100,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  note: note || undefined,
                  updatedAt: nowDate(),
                }
              : item,
          ),
        }));
      },

      deleteSpecialBudget(budgetId) {
        setState((prev) => ({
          ...prev,
          specialBudgets: prev.specialBudgets.filter((item) => item.id !== budgetId),
          specialBudgetRecords: prev.specialBudgetRecords.filter((record) => record.specialBudgetId !== budgetId),
        }));
      },

      addSpecialBudgetRecord(input) {
        const amount = Number(input.amount);
        const budgetId = input.specialBudgetId.trim();
        const categoryId = input.categoryId.trim();
        const date = input.date?.trim();
        const note = input.note?.trim();

        if (!budgetId || !categoryId || !date || !Number.isFinite(amount) || amount <= 0) {
          return;
        }

        setState((prev) => {
          const budget = prev.specialBudgets.find((item) => item.id === budgetId);
          if (!budget) {
            return prev;
          }

          const category = prev.financeCategories.find((item) => item.id === categoryId && item.type === "expense");
          if (!category) {
            return prev;
          }

          return {
            ...prev,
            specialBudgets: prev.specialBudgets.map((item) =>
              item.id === budgetId
                ? {
                    ...item,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
            specialBudgetRecords: [
              {
                id: createId("sp_record"),
                specialBudgetId: budgetId,
                amount: Math.round(amount * 100) / 100,
                categoryId,
                date,
                note: note || undefined,
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
              ...prev.specialBudgetRecords,
            ],
          };
        });
      },

      deleteSpecialBudgetRecord(recordId) {
        setState((prev) => ({
          ...prev,
          specialBudgetRecords: prev.specialBudgetRecords.filter((item) => item.id !== recordId),
        }));
      },

      addKnowledgeItem(input) {
        const cleanTitle = input.title.trim();
        const cleanContent = input.content.trim();
        if (!cleanTitle || !cleanContent) {
          return;
        }

        setState((prev) => {
          const resolvedCategoryId = normalizeKnowledgeCategoryId(input.categoryId, prev.knowledgeCategories);
          const knowledgeItems: KnowledgeItem[] = [
            {
              id: createId("knowledge"),
              title: cleanTitle,
              type: input.type,
              sourceType: input.sourceType ?? "outside_knowledge",
              tags: input.tags,
              content: cleanContent,
              attachments: input.attachments ?? [],
              images: input.images ?? [],
              fileType: input.fileType,
              categoryId: resolvedCategoryId,
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
          const synced = syncTaskKnowledgeState(prev.tasks, knowledgeItems, nowDate());

          return {
            ...prev,
            knowledgeItems,
            tasks: synced.tasks,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
          };
        });
      },

      updateKnowledgeItem(itemId, input) {
        setState((prev) => {
          const resolvedCategoryId = normalizeKnowledgeCategoryId(input.categoryId, prev.knowledgeCategories);
          const knowledgeItems = prev.knowledgeItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  title: input.title.trim(),
                  type: input.type,
                  sourceType: input.sourceType ?? item.sourceType ?? "outside_knowledge",
                  tags: input.tags,
                  content: input.content.trim(),
                  attachments: input.attachments ?? item.attachments ?? [],
                  images: input.images ?? item.images ?? [],
                  fileType: input.fileType ?? item.fileType,
                  categoryId: resolvedCategoryId,
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
          const synced = syncTaskKnowledgeState(prev.tasks, knowledgeItems, nowDate());

          return {
            ...prev,
            knowledgeItems,
            tasks: synced.tasks,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
          };
        });
      },

      deleteKnowledgeItem(itemId) {
        setState((prev) => {
          const knowledgeItems = prev.knowledgeItems.filter((item) => item.id !== itemId);
          const synced = syncTaskKnowledgeState(prev.tasks, knowledgeItems, nowDate());

          return {
            ...prev,
            knowledgeItems,
            tasks: synced.tasks,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
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

        setState((prev) => {
          const target = prev.knowledgeCategories.find((category) => category.id === categoryId);
          if (!target || target.isSystem) {
            return prev;
          }

          return {
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
          };
        });
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
          const nextCategories = prev.knowledgeCategories.filter((category) => !deleteIds.has(category.id));
          const fallbackCategoryId = normalizeKnowledgeCategoryId(undefined, nextCategories);

          return {
            ...prev,
            knowledgeCategories: nextCategories,
            knowledgeItems: prev.knowledgeItems.map((item) =>
              item.categoryId && deleteIds.has(item.categoryId)
                ? {
                    ...item,
                    categoryId: fallbackCategoryId,
                    updatedAt: nowDate(),
                  }
                : item,
            ),
            quickNotes: prev.quickNotes.map((note) =>
              note.categoryId && deleteIds.has(note.categoryId)
                ? {
                    ...note,
                    categoryId: fallbackCategoryId,
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

        setState((prev) => {
          const resolvedCategoryId = normalizeKnowledgeCategoryId(input.categoryId, prev.knowledgeCategories);
          return {
            ...prev,
            quickNotes: [
              {
                id: createId("qnote"),
                title: input.title?.trim(),
                content: clean,
                tags: input.tags,
                categoryId: resolvedCategoryId,
                subjectId: input.subjectId,
                courseId: input.courseId,
                nodeId: input.nodeId,
                status: "draft",
                createdAt: nowDate(),
                updatedAt: nowDate(),
              },
              ...prev.quickNotes,
            ],
          };
        });
      },

      updateQuickNote(noteId, input) {
        setState((prev) => {
          const resolvedCategoryId = normalizeKnowledgeCategoryId(input.categoryId, prev.knowledgeCategories);
          return {
            ...prev,
            quickNotes: prev.quickNotes.map((note) =>
              note.id === noteId
                ? {
                    ...note,
                    title: input.title?.trim(),
                    content: input.content.trim(),
                    tags: input.tags,
                    categoryId: resolvedCategoryId,
                    subjectId: input.subjectId,
                    courseId: input.courseId,
                    nodeId: input.nodeId,
                    updatedAt: nowDate(),
                  }
                : note,
            ),
          };
        });
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
          const resolvedCategoryId = normalizeKnowledgeCategoryId(note.categoryId, prev.knowledgeCategories);

          const knowledgeId = createId("knowledge");
          const knowledgeItems: KnowledgeItem[] = [
            {
              id: knowledgeId,
              title: note.title?.trim() || note.content.slice(0, 26),
              type: "quick_note_import",
              sourceType: "today_note",
              tags: note.tags,
              content: note.content,
              attachments: [],
              images: [],
              categoryId: resolvedCategoryId,
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
          const synced = syncTaskKnowledgeState(prev.tasks, knowledgeItems, nowDate());

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
            tasks: synced.tasks,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
          };
        });
      },

      uploadPdfDocument(input) {
        if (!input.fileName.trim()) {
          return;
        }

        setState((prev) => {
          const insights = buildMockPdfInsights(input);
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
                summary: insights.summary,
                keywords: insights.keywords,
                highlights: insights.highlights,
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
          const resolvedCategoryId = normalizeKnowledgeCategoryId(categoryId, prev.knowledgeCategories);

          const knowledgeId = createId("knowledge");
          const knowledgeItems: KnowledgeItem[] = [
            {
              id: knowledgeId,
              title: doc.title,
              type: "pdf_summary",
              sourceType: "outside_knowledge",
              tags: ["PDF"],
              content: doc.summary.trim() || `PDF 文件：${doc.fileName}`,
              attachments: [
                {
                  id: createId("attach"),
                  name: doc.fileName,
                  fileType: "pdf",
                  sizeKb: doc.fileSizeKb,
                },
              ],
              images: [],
              fileType: "pdf",
              categoryId: resolvedCategoryId,
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
          const synced = syncTaskKnowledgeState(prev.tasks, knowledgeItems, nowDate());

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
            tasks: synced.tasks,
            taskKnowledgeRelations: synced.taskKnowledgeRelations,
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


