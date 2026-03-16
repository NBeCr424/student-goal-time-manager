export type GoalStatus = "not_started" | "active" | "paused" | "completed";
export type GoalPriority = "high" | "medium" | "low";
export type PreferredTimeOfDay = "morning" | "afternoon" | "evening" | "flexible";

export type TaskPriority = "high" | "medium" | "low";
export type TaskPlanType = "today_top" | "today_secondary" | "today_other" | "weekly";

export type IdeaStatus = "unprocessed" | "archived" | "converted_task" | "converted_knowledge";
export type IdeaCategory = "study_inspiration" | "temporary_todo" | "review_thought" | "project_idea" | "life_note";

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

export type SessionStatus = "planned" | "done" | "missed";

export type CalendarViewMode = "month" | "week";

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
  priority: TaskPriority;
  planType: TaskPlanType;
  order: number;
  goalId?: string;
  knowledgeItemIds: string[];
  source: "manual" | "imported" | "idea";
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
  tags: string[];
  content: string;
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

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
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

export interface AppState {
  user: User;
  weather: WeatherInfo;
  weatherLocations: WeatherLocation[];
  selectedWeatherLocationId: string;
  timelineItems: TimelineItem[];
  newsItems: NewsItem[];
  goals: Goal[];
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
  parsedImportTasks: ParsedImportTask[];
}

export interface KnowledgeItemInput {
  title: string;
  type: KnowledgeItemType;
  tags: string[];
  content: string;
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
