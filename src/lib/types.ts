export type GoalStatus = "not_started" | "active" | "paused" | "completed";
export type GoalPriority = "high" | "medium" | "low";
export type PreferredTimeOfDay = "morning" | "afternoon" | "evening" | "flexible";

export type TaskPriority = "high" | "medium" | "low";
export type TaskPlanType = "today_top" | "today_secondary" | "today_other" | "weekly";

export type IdeaStatus = "unprocessed" | "archived" | "converted_task" | "converted_knowledge";
export type IdeaCategory = "study_inspiration" | "temporary_todo" | "review_thought" | "project_idea" | "life_note";

export type KnowledgeCategory = "course_notes" | "method_library" | "wrong_question" | "link_collection";

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

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  tags: string[];
  content: string;
  relatedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
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

export interface ReviewEntry {
  id: string;
  date: string;
  wins: string;
  wastedTime: string;
  improveOneThing: string;
  createdAt: string;
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
  goals: Goal[];
  goalSessions: GoalSession[];
  weeklyPlans: WeeklyPlan[];
  tasks: Task[];
  knowledgeItems: KnowledgeItem[];
  ideas: Idea[];
  reviews: ReviewEntry[];
  parsedImportTasks: ParsedImportTask[];
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
