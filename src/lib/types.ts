export type GoalStatus = "not_started" | "active" | "paused" | "completed";
export type GoalPriority = "high" | "medium" | "low";
export type PreferredTimeOfDay = "morning" | "afternoon" | "evening" | "flexible";

export type TaskPriority = "high" | "medium" | "low";
export type TaskPlanType = "today_top" | "today_secondary" | "today_other" | "weekly";

export type IdeaStatus = "unprocessed" | "archived" | "converted_task" | "converted_knowledge";
export type IdeaCategory = "study_inspiration" | "temporary_todo" | "review_thought" | "project_idea" | "life_note";
export type EventMemoStatus = "not_started" | "in_progress" | "completed" | "paused";

export type KnowledgeItemType =
  | "note"
  | "method"
  | "mistake"
  | "link"
  | "pdf_summary"
  | "quick_note_import"
  | "topic_summary"
  | "chapter_summary";

export type KnowledgeNodeType = "chapter" | "topic" | "summary" | "resource";

export type KnowledgeLearningStatus = "not_started" | "learning" | "mastered" | "review_pending";

export type QuickNoteStatus = "draft" | "imported";
export type KnowledgeSourceType = "today_note" | "outside_knowledge";

export type SessionStatus = "planned" | "done" | "missed";
export type FinanceRecordType = "expense" | "income";

export type CalendarViewMode = "month" | "week";
export type CalendarSyncStatus = "not_synced" | "synced";
export type TaskImportTarget = "today" | "weekly" | "inbox";
export type UrlImportJobStatus = "queued" | "parsing" | "success" | "failed";
export type UrlImportProviderType = "mock" | "web_parser_api";
export type TaskImportInboxStatus = "unprocessed" | "imported";
export type FocusMode = "pomodoro" | "custom";
export type FocusSessionStatus = "running" | "completed" | "interrupted" | "cancelled";

export interface User {
  id: string;
  name: string;
  role: "student";
  gradeLabel: string;
  timezone: string;
}

export interface SmartFields {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

export interface GoalBreakdownItem {
  id: string;
  title: string;
  completed: boolean;
  distributedCount: number;
  lastDistributedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  smart: SmartFields;
  deadline: string;
  estimatedTotalHours: number;
  suggestedSessionMinutes: number;
  preferredTimeOfDay: PreferredTimeOfDay;
  priority: GoalPriority;
  includeInCalendar: boolean;
  progress: number;
  status: GoalStatus;
  taskIds: string[];
  sessionIds: string[];
  breakdownItems: GoalBreakdownItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalSession {
  id: string;
  goalId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: SessionStatus;
  syncedToCalendar?: boolean;
}

export interface WeeklyPlan {
  id: string;
  weekStartDate: string;
  weekGoalIds: string[];
  executionLog: string[];
  checkSummary: string;
  nextWeekOneImprovement: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  isScheduled?: boolean;
  syncedToCalendar?: boolean;
  priority: TaskPriority;
  planType: TaskPlanType;
  order: number;
  goalId?: string;
  goalBreakdownItemId?: string;
  knowledgeItemIds: string[];
  source: "manual" | "imported" | "idea";
  createdAt: string;
  updatedAt: string;
}

export interface GoalTemplate {
  id: string;
  name: string;
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  estimatedTotalHours: number;
  priority: GoalPriority;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  parentId?: string;
  order: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSubject {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface KnowledgeCourse {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  order: number;
  status: KnowledgeLearningStatus;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeNode {
  id: string;
  courseId: string;
  parentNodeId?: string;
  title: string;
  type: KnowledgeNodeType;
  description: string;
  order: number;
  status: KnowledgeLearningStatus;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeItemType;
  sourceType?: KnowledgeSourceType;
  tags: string[];
  content: string;
  attachments?: KnowledgeAttachment[];
  images?: string[];
  fileType?: string;
  categoryId?: string;
  subjectId?: string;
  courseId?: string;
  nodeId?: string;
  sourceDocumentId?: string;
  sourceQuickNoteId?: string;
  relatedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeAttachment {
  id: string;
  name: string;
  fileType: string;
  sizeKb: number;
}

export interface QuickNote {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  categoryId?: string;
  subjectId?: string;
  courseId?: string;
  nodeId?: string;
  status: QuickNoteStatus;
  importedKnowledgeItemId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PdfKnowledgeDocument {
  id: string;
  title: string;
  fileName: string;
  fileSizeKb: number;
  subjectId?: string;
  courseId?: string;
  nodeId?: string;
  summary: string;
  keywords: string[];
  highlights: string[];
  createdAt: string;
  updatedAt: string;
  savedAsKnowledgeItemId?: string;
}

export interface Idea {
  id: string;
  content: string;
  category: IdeaCategory;
  status: IdeaStatus;
  linkedTaskId?: string;
  linkedKnowledgeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventMemoStep {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventMemo {
  id: string;
  title: string;
  description: string;
  status: EventMemoStatus;
  deadline?: string;
  targetOutcome?: string;
  why?: string;
  nextAction: string;
  blockedReason?: string;
  notes?: string;
  completionSummary?: string;
  nextTimeTip?: string;
  relatedKnowledgeItemIds: string[];
  linkedTaskIds: string[];
  steps: EventMemoStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WeatherInfo {
  date: string;
  location: string;
  condition: string;
  temperatureC: number;
  humidity: number;
  suggestion: string;
  outfitTip: string;
}

export interface WeatherLocation {
  id: string;
  city: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TimelineItemType = "goal_session" | "task" | "manual_schedule" | "review_reminder";
export type TimelineItemStatus = "planned" | "done";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  sourceGoalId?: string;
  sourceTaskId?: string;
  status: TimelineItemStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEntry {
  id: string;
  date: string;
  wins: string;
  wastedTime: string;
  improveOneThing: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: FinanceRecordType;
  order: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceRecord {
  id: string;
  type: FinanceRecordType;
  amount: number;
  categoryId: string;
  note?: string;
  date: string;
  source: "manual" | "imported";
  relatedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetPlan {
  id: string;
  monthKey: string;
  monthlyBudget: number;
  categoryBudgets?: Record<string, number>;
  saveTargetAmount?: number;
  updatedAt: string;
}

export interface FinanceSummary {
  todayExpense: number;
  todayIncome: number;
  monthExpense: number;
  monthIncome: number;
  monthBudget: number;
  monthRemaining: number;
  topExpenseCategoryId?: string;
}

export interface SpecialBudget {
  id: string;
  name: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  note?: string;
}

export interface SpecialBudgetRecord {
  id: string;
  specialBudgetId: string;
  amount: number;
  categoryId: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  sourceType: "task" | "goal_session" | "goal_deadline";
  sourceId: string;
  syncStatus: CalendarSyncStatus;
}

export interface CalendarDaySummary {
  date: string;
  goalSessionCount: number;
  taskCount: number;
  dense: boolean;
  hasDeadline: boolean;
  urgentDeadlineGoalTitles: string[];
}

export interface ParsedImportTask {
  id: string;
  title: string;
  sourceUrl: string;
  selected: boolean;
}

export interface UrlImportProvider {
  id: string;
  name: string;
  type: UrlImportProviderType;
  endpoint?: string;
  enabled: boolean;
  note?: string;
}

export interface UrlImportJob {
  id: string;
  sourceUrl: string;
  providerId: string;
  requestedAt: string;
  status: UrlImportJobStatus;
  parsedCount: number;
  errorMessage?: string;
}

export interface TaskImportInboxItem {
  id: string;
  title: string;
  sourceUrl: string;
  createdAt: string;
  status: TaskImportInboxStatus;
  importedTaskId?: string;
  note?: string;
}

export interface TaskKnowledgeRelation {
  id: string;
  taskId: string;
  knowledgeItemId: string;
  source: "task_side" | "knowledge_side" | "auto";
  createdAt: string;
  updatedAt: string;
}

export interface FocusPreset {
  id: string;
  label: string;
  minutes: number;
  isSystem: boolean;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  goalId?: string;
  mode: FocusMode;
  plannedMinutes: number;
  actualMinutes: number;
  status: FocusSessionStatus;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  user: User;
  weather: WeatherInfo;
  weatherLocations: WeatherLocation[];
  selectedWeatherLocationId: string;
  timelineItems: TimelineItem[];
  eventMemos: EventMemo[];
  goals: Goal[];
  goalTemplates: GoalTemplate[];
  goalSessions: GoalSession[];
  weeklyPlans: WeeklyPlan[];
  tasks: Task[];
  knowledgeItems: KnowledgeItem[];
  knowledgeCategories: KnowledgeCategory[];
  knowledgeSubjects: KnowledgeSubject[];
  knowledgeCourses: KnowledgeCourse[];
  knowledgeNodes: KnowledgeNode[];
  quickNotes: QuickNote[];
  pdfDocuments: PdfKnowledgeDocument[];
  ideas: Idea[];
  reviews: ReviewEntry[];
  financeCategories: FinanceCategory[];
  financeRecords: FinanceRecord[];
  budgetPlans: BudgetPlan[];
  specialBudgets: SpecialBudget[];
  specialBudgetRecords: SpecialBudgetRecord[];
  parsedImportTasks: ParsedImportTask[];
  taskImportInbox: TaskImportInboxItem[];
  urlImportProviders: UrlImportProvider[];
  urlImportJobs: UrlImportJob[];
  taskKnowledgeRelations: TaskKnowledgeRelation[];
  focusPresets: FocusPreset[];
  focusSessions: FocusSession[];
}

export interface KnowledgeItemInput {
  title: string;
  type: KnowledgeItemType;
  sourceType?: KnowledgeSourceType;
  tags: string[];
  content: string;
  attachments?: KnowledgeAttachment[];
  images?: string[];
  fileType?: string;
  categoryId?: string;
  subjectId?: string;
  courseId?: string;
  nodeId?: string;
  sourceDocumentId?: string;
  sourceQuickNoteId?: string;
  relatedTaskIds: string[];
}

export interface QuickNoteInput {
  title?: string;
  content: string;
  tags: string[];
  categoryId?: string;
  subjectId?: string;
  courseId?: string;
  nodeId?: string;
}

export interface PdfUploadInput {
  title: string;
  fileName: string;
  fileSizeKb: number;
  subjectId?: string;
  courseId?: string;
  nodeId?: string;
}

export interface EventMemoInput {
  title: string;
  description?: string;
  deadline?: string;
  targetOutcome?: string;
  why?: string;
  nextAction?: string;
}

export interface NewGoalInput {
  title: string;
  description: string;
  smart: SmartFields;
  deadline: string;
  estimatedTotalHours: number;
  suggestedSessionMinutes: number;
  preferredTimeOfDay: PreferredTimeOfDay;
  priority: GoalPriority;
  includeInCalendar: boolean;
}

export interface FinanceRecordInput {
  type: FinanceRecordType;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
}

export interface SpecialBudgetInput {
  name: string;
  totalAmount: number;
  startDate?: string;
  endDate?: string;
  note?: string;
}

export interface SpecialBudgetRecordInput {
  specialBudgetId: string;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
}

export type DataMode = "local" | "cloud";
export type SyncPhase = "idle" | "syncing" | "error";

export interface AuthUserInfo {
  id: string;
  email: string;
}

export interface DataSyncStatus {
  mode: DataMode;
  phase: SyncPhase;
  lastSyncedAt?: string;
  message?: string;
}

export interface UserSettings {
  id: string;
  user: User;
  weatherLocations: WeatherLocation[];
  selectedWeatherLocationId: string;
  focusPresets: FocusPreset[];
  urlImportProviders: UrlImportProvider[];
}
