import { addDays, formatDateLabel, fromDateKey, startOfWeek, toDateKey, todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { generateGoalSessions } from "@/lib/scheduler";
import {
  AppState,
  Goal,
  GoalSession,
  Idea,
  KnowledgeCategory,
  KnowledgeCourse,
  KnowledgeItem,
  KnowledgeNode,
  KnowledgeSubject,
  NewsItem,
  ParsedImportTask,
  PdfKnowledgeDocument,
  QuickNote,
  Task,
  TimelineItem,
  WeatherInfo,
  WeatherLocation,
  WeeklyPlan,
} from "@/lib/types";

const WEATHER_CONDITIONS = [
  {
    key: "shanghai",
    condition: "Cloudy",
    temperatureC: 23,
    humidity: 58,
    suggestion: "Good for focused study blocks before lunch.",
    outfitTip: "Light jacket for evening commute.",
  },
  {
    key: "beijing",
    condition: "Sunny",
    temperatureC: 19,
    humidity: 42,
    suggestion: "Great day for deep work sessions in the morning.",
    outfitTip: "Long sleeve top and sunglasses.",
  },
  {
    key: "guangzhou",
    condition: "Humid",
    temperatureC: 28,
    humidity: 73,
    suggestion: "Split study into shorter sessions to keep energy stable.",
    outfitTip: "Breathable T-shirt and water bottle.",
  },
  {
    key: "hangzhou",
    condition: "Light Rain",
    temperatureC: 21,
    humidity: 79,
    suggestion: "Prefer indoor reading and review tasks today.",
    outfitTip: "Carry a compact umbrella.",
  },
];

function pickWeatherByCity(city: string) {
  const lower = city.toLowerCase();
  return (
    WEATHER_CONDITIONS.find((item) => lower.includes(item.key)) ?? {
      key: "default",
      condition: "Partly Cloudy",
      temperatureC: 22,
      humidity: 55,
      suggestion: "Use your high-energy hours for key tasks.",
      outfitTip: "Layered outfit is enough.",
    }
  );
}

export function getMockWeatherByCity(city: string, date: string = todayKey()): WeatherInfo {
  const weather = pickWeatherByCity(city);
  return {
    date,
    location: city,
    condition: weather.condition,
    temperatureC: weather.temperatureC,
    humidity: weather.humidity,
    suggestion: weather.suggestion,
    outfitTip: weather.outfitTip,
  };
}

function createWeatherLocations(today: string): WeatherLocation[] {
  return [
    {
      id: "weather_shanghai",
      city: "Shanghai",
      label: "Shanghai",
      isDefault: true,
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "weather_beijing",
      city: "Beijing",
      label: "Beijing",
      isDefault: false,
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "weather_guangzhou",
      city: "Guangzhou",
      label: "Guangzhou",
      isDefault: false,
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createNewsItems(today: string): NewsItem[] {
  return [
    {
      id: "news_1",
      title: "Campus library extends exam season opening hours",
      summary: "Main campus library now opens until 23:30 on weekdays for the next three weeks.",
      source: "Campus Bulletin",
      publishedAt: `${today} 08:10`,
    },
    {
      id: "news_2",
      title: "Student dev challenge opens registration",
      summary: "Teams can register for the 7-day product challenge focused on AI learning tools.",
      source: "Student Tech Hub",
      publishedAt: `${today} 09:00`,
    },
    {
      id: "news_3",
      title: "Public transit updates evening schedule",
      summary: "Two major lines add extra departures after 22:00 this month.",
      source: "City Transit",
      publishedAt: `${today} 11:25`,
    },
    {
      id: "news_4",
      title: "Open lecture on focus and productivity this Friday",
      summary: "Psychology department hosts a free lecture on reducing procrastination during exam prep.",
      source: "University Events",
      publishedAt: `${today} 13:45`,
    },
  ];
}

function createTimelineItems(today: string): TimelineItem[] {
  return [
    {
      id: "timeline_manual_1",
      type: "manual_schedule",
      title: "Morning stretch and breakfast",
      date: today,
      startTime: "07:20",
      endTime: "07:50",
      status: "planned",
      notes: "Keep this slot low effort to save cognitive energy.",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "timeline_manual_2",
      type: "manual_schedule",
      title: "Commute and quick review cards",
      date: today,
      startTime: "08:10",
      endTime: "08:40",
      status: "planned",
      notes: "Use flashcards while commuting.",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createGoalTemplates(today: string): Goal[] {
  const baseDate = fromDateKey(today);

  return [
    {
      id: "goal_english_6",
      title: "CET-6 score above 560",
      description: "Build reading, listening and writing routine in 6 weeks.",
      smart: {
        specific: "3 reading sets + 2 listening sets + 2 writing practices each week.",
        measurable: "Track score every Sunday, move from 480 to 560.",
        achievable: "Keep 60-90 minute sessions per day.",
        relevant: "Supports scholarship and internship goals.",
        timeBound: "Reach target before 2026-04-25.",
      },
      deadline: toDateKey(addDays(baseDate, 40)),
      estimatedTotalHours: 42,
      suggestedSessionMinutes: 60,
      preferredTimeOfDay: "morning",
      priority: "high",
      includeInCalendar: true,
      progress: 26,
      status: "active",
      taskIds: [],
      sessionIds: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "goal_algo_final",
      title: "Data structure final grade A",
      description: "Review list/tree/graph and complexity with stable execution rhythm.",
      smart: {
        specific: "Finish 120 practice questions and build an error notebook.",
        measurable: "At least 25 new questions per week.",
        achievable: "Use one 90-minute deep work slot every evening.",
        relevant: "Core course grade affects ranking.",
        timeBound: "Finish 3 mock exams before 2026-05-08.",
      },
      deadline: toDateKey(addDays(baseDate, 53)),
      estimatedTotalHours: 56,
      suggestedSessionMinutes: 90,
      preferredTimeOfDay: "evening",
      priority: "high",
      includeInCalendar: true,
      progress: 14,
      status: "active",
      taskIds: [],
      sessionIds: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "goal_run_habit",
      title: "30-day running habit",
      description: "Build stable exercise habit to improve focus and sleep quality.",
      smart: {
        specific: "Run 4 days each week, 25-35 minutes each session.",
        measurable: "Track total minutes and completed days.",
        achievable: "Start from low intensity and avoid injury.",
        relevant: "Helps maintain learning energy.",
        timeBound: "Complete 30-day streak before 2026-05-20.",
      },
      deadline: toDateKey(addDays(baseDate, 65)),
      estimatedTotalHours: 20,
      suggestedSessionMinutes: 30,
      preferredTimeOfDay: "flexible",
      priority: "medium",
      includeInCalendar: true,
      progress: 45,
      status: "active",
      taskIds: [],
      sessionIds: [],
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createTasks(today: string): Task[] {
  const todayDate = fromDateKey(today);

  return [
    {
      id: "task_today_1",
      title: "Two CET-6 reading passages with annotation",
      description: "Mark vocabulary and long sentence structures.",
      completed: false,
      dueDate: today,
      priority: "high",
      planType: "today_top",
      order: 1,
      goalId: "goal_english_6",
      knowledgeItemIds: ["k_cet6_read_method"],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "task_today_2",
      title: "Rework 20 data-structure mistakes",
      description: "Focus on tree and graph traversal bugs.",
      completed: false,
      dueDate: today,
      priority: "high",
      planType: "today_secondary",
      order: 2,
      goalId: "goal_algo_final",
      knowledgeItemIds: ["k_algo_graph_mistake"],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "task_today_3",
      title: "Write one-page writing template",
      description: "Save reusable structure into method notes.",
      completed: false,
      dueDate: today,
      priority: "medium",
      planType: "today_secondary",
      order: 3,
      goalId: "goal_english_6",
      knowledgeItemIds: [],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "task_today_4",
      title: "Draft preview outline for next week classes",
      description: "Outline only, no heavy detail.",
      completed: false,
      dueDate: today,
      priority: "low",
      planType: "today_other",
      order: 4,
      knowledgeItemIds: [],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "task_week_1",
      title: "Complete one full CET-6 mock test",
      description: "Follow real exam time constraints.",
      completed: false,
      dueDate: toDateKey(addDays(todayDate, 5)),
      priority: "high",
      planType: "weekly",
      order: 1,
      goalId: "goal_english_6",
      knowledgeItemIds: ["k_cet6_topic_summary"],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "task_week_2",
      title: "Finish graph algorithm topic review",
      description: "Summarize three repeat mistakes.",
      completed: false,
      dueDate: toDateKey(addDays(todayDate, 4)),
      priority: "medium",
      planType: "weekly",
      order: 2,
      goalId: "goal_algo_final",
      knowledgeItemIds: ["k_algo_graph_mistake"],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createKnowledgeCategories(today: string): KnowledgeCategory[] {
  return [
    { id: "cat_note", name: "Course Notes", order: 1, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_method", name: "Method Library", order: 2, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_mistake", name: "Mistakes", order: 3, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_link", name: "Links", order: 4, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_pdf", name: "PDF Summary", order: 5, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_summary", name: "Summary", order: 6, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_exam", name: "Exam Sprint", order: 7, isSystem: false, createdAt: today, updatedAt: today },
    {
      id: "cat_math_exam",
      name: "Calculus Sprint",
      parentId: "cat_exam",
      order: 1,
      isSystem: false,
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createKnowledgeSubjects(): KnowledgeSubject[] {
  return [
    { id: "subj_math", name: "Math", description: "Calculus, Linear Algebra, Probability", order: 1 },
    { id: "subj_physics", name: "Physics", description: "Mechanics and experiments", order: 2 },
    { id: "subj_english", name: "English", description: "CET and academic reading", order: 3 },
  ];
}

function createKnowledgeCourses(today: string): KnowledgeCourse[] {
  return [
    {
      id: "course_calc",
      subjectId: "subj_math",
      name: "Calculus",
      description: "Limit, derivative, integral and series.",
      order: 1,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "course_physics1",
      subjectId: "subj_physics",
      name: "University Physics I",
      description: "Kinematics and Newtonian mechanics.",
      order: 1,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "course_cet6",
      subjectId: "subj_english",
      name: "CET-6",
      description: "Reading, listening, writing and translation.",
      order: 1,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createKnowledgeNodes(today: string): KnowledgeNode[] {
  return [
    {
      id: "node_calc_ch1",
      courseId: "course_calc",
      title: "Chapter 1 Limit and Continuity",
      type: "chapter",
      description: "Build core understanding for limits and continuity.",
      order: 1,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_calc_topic_integral",
      courseId: "course_calc",
      title: "Integral Techniques Topic",
      type: "topic",
      description: "Substitution, by-parts and parameter integration.",
      order: 2,
      status: "review_pending",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_calc_summary_mid",
      courseId: "course_calc",
      title: "Midterm Summary",
      type: "summary",
      description: "One-page recap by question type.",
      order: 3,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_phy_ch1",
      courseId: "course_physics1",
      title: "Chapter 1 Particle Kinematics",
      type: "chapter",
      description: "Displacement, velocity and acceleration patterns.",
      order: 1,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_phy_topic_lab",
      courseId: "course_physics1",
      title: "MATLAB Lab Topic",
      type: "topic",
      description: "Report structure and visualization templates.",
      order: 2,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_phy_summary_final",
      courseId: "course_physics1",
      title: "Final Review Summary",
      type: "summary",
      description: "Last-week recap for exam prep.",
      order: 3,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_en_topic_read",
      courseId: "course_cet6",
      title: "Reading Strategy Topic",
      type: "topic",
      description: "Locate, infer and eliminate options quickly.",
      order: 1,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_en_ch_listening",
      courseId: "course_cet6",
      title: "Listening Scenarios",
      type: "chapter",
      description: "Campus, interview and lecture contexts.",
      order: 2,
      status: "review_pending",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_en_summary_exam",
      courseId: "course_cet6",
      title: "Exam Sprint Summary",
      type: "summary",
      description: "Final week checklist by question type.",
      order: 3,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createPdfDocuments(today: string): PdfKnowledgeDocument[] {
  return [
    {
      id: "pdf_calc_lecture",
      title: "Calculus Chapter 1 Lecture Summary",
      fileName: "calc-limit-lecture.pdf",
      fileSizeKb: 2280,
      subjectId: "subj_math",
      courseId: "course_calc",
      nodeId: "node_calc_ch1",
      summary: "Covers limit operations, core limit forms and continuity checks.",
      keywords: ["limit", "continuity", "squeeze", "lhopital"],
      highlights: [
        "Check boundedness before selecting squeeze strategy.",
        "For piecewise functions, compare left and right limit first.",
      ],
      createdAt: today,
      updatedAt: today,
      savedAsKnowledgeItemId: "k_pdf_calc_summary",
    },
    {
      id: "pdf_phy_sheet",
      title: "Kinematics Exercise Sheet Summary",
      fileName: "physics-kinematics-sheet.pdf",
      fileSizeKb: 1560,
      subjectId: "subj_physics",
      courseId: "course_physics1",
      nodeId: "node_phy_ch1",
      summary: "Focuses on uniform acceleration and projectile setup patterns.",
      keywords: ["kinematics", "projectile", "equation", "force"],
      highlights: [
        "Draw motion sketch before writing equations.",
        "Split horizontal and vertical equations to reduce mistakes.",
      ],
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createQuickNotes(today: string): QuickNote[] {
  return [
    {
      id: "qn_calc_1",
      title: "Limit quick check",
      content: "For x->0 trigonometric limits, try equivalent transform before expansion.",
      tags: ["calculus", "limit"],
      categoryId: "cat_math_exam",
      subjectId: "subj_math",
      courseId: "course_calc",
      nodeId: "node_calc_ch1",
      status: "draft",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "qn_phy_1",
      title: "Projectile pitfall",
      content: "Do not force one formula for total time, check landing height condition first.",
      tags: ["physics", "projectile", "mistake"],
      categoryId: "cat_mistake",
      subjectId: "subj_physics",
      courseId: "course_physics1",
      nodeId: "node_phy_ch1",
      status: "imported",
      importedKnowledgeItemId: "k_quick_phy_import",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createKnowledge(today: string): KnowledgeItem[] {
  return [
    {
      id: "k_calc_limit_note",
      title: "Limit definition and common methods",
      type: "note",
      tags: ["calculus", "limit"],
      content: "Method order: substitution, factorization, rationalization, equivalent transform.",
      categoryId: "cat_note",
      subjectId: "subj_math",
      courseId: "course_calc",
      nodeId: "node_calc_ch1",
      relatedTaskIds: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_cet6_read_method",
      title: "CET-6 reading locate strategy",
      type: "method",
      tags: ["english", "reading", "strategy"],
      content: "Locate keyword -> identify paragraph intent -> eliminate options quickly.",
      categoryId: "cat_method",
      subjectId: "subj_english",
      courseId: "course_cet6",
      nodeId: "node_en_topic_read",
      relatedTaskIds: ["task_today_1"],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_algo_graph_mistake",
      title: "Graph traversal mistakes",
      type: "mistake",
      tags: ["algorithm", "bfs", "dfs"],
      content: "Visited timing is critical. Mark consistently when enqueueing.",
      categoryId: "cat_mistake",
      relatedTaskIds: ["task_today_2", "task_week_2"],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_math_link",
      title: "Integration visual guide",
      type: "link",
      tags: ["math", "integration", "visual"],
      content: "https://example.com/integration-visual-guide",
      categoryId: "cat_link",
      subjectId: "subj_math",
      courseId: "course_calc",
      nodeId: "node_calc_topic_integral",
      relatedTaskIds: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_pdf_calc_summary",
      title: "Calculus chapter 1 PDF summary",
      type: "pdf_summary",
      tags: ["pdf", "calculus", "limit"],
      content: "Core points: limit operations, classic forms, squeeze theorem and continuity check.",
      categoryId: "cat_pdf",
      subjectId: "subj_math",
      courseId: "course_calc",
      nodeId: "node_calc_ch1",
      sourceDocumentId: "pdf_calc_lecture",
      relatedTaskIds: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_cet6_topic_summary",
      title: "CET-6 reading topic summary",
      type: "topic_summary",
      tags: ["cet6", "topic-summary"],
      content: "Keep only three stable moves: locate, infer, eliminate.",
      categoryId: "cat_summary",
      subjectId: "subj_english",
      courseId: "course_cet6",
      nodeId: "node_en_topic_read",
      relatedTaskIds: ["task_week_1"],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_phy_chapter_summary",
      title: "Kinematics chapter summary",
      type: "chapter_summary",
      tags: ["physics", "chapter-summary"],
      content: "Write known/unknown first, then select kinematics or force-analysis path.",
      categoryId: "cat_summary",
      subjectId: "subj_physics",
      courseId: "course_physics1",
      nodeId: "node_phy_ch1",
      relatedTaskIds: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_quick_phy_import",
      title: "Projectile pitfall (imported from quick note)",
      type: "quick_note_import",
      tags: ["quick-note", "physics"],
      content: "Do not lock into one formula before checking landing condition.",
      categoryId: "cat_mistake",
      subjectId: "subj_physics",
      courseId: "course_physics1",
      nodeId: "node_phy_ch1",
      sourceQuickNoteId: "qn_phy_1",
      relatedTaskIds: [],
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createIdeas(today: string): Idea[] {
  return [
    {
      id: "idea_1",
      content: "Turn writing templates into flashcards for commuting review.",
      category: "study_inspiration",
      status: "unprocessed",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "idea_2",
      content: "Try 25+5 cadence for Wednesday evening study block.",
      category: "review_thought",
      status: "unprocessed",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "idea_3",
      content: "Build a shared dorm routine tracker.",
      category: "project_idea",
      status: "archived",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createWeeklyPlan(today: string): WeeklyPlan {
  const monday = startOfWeek(fromDateKey(today));
  return {
    id: "weekly_current",
    weekStartDate: toDateKey(monday),
    weekGoalIds: ["goal_english_6", "goal_algo_final"],
    executionLog: [
      `Monday update: completed 2 out of 3 key tasks on ${formatDateLabel(today)}.`,
      "Tuesday review: graph algorithm tasks overran expected time.",
    ],
    checkSummary: "Execution is more stable, but evening shutdown happens too late.",
    nextWeekOneImprovement: "One fix only: stop active study by 22:45 and start review.",
    updatedAt: today,
  };
}

function createReviews(today: string) {
  const todayDate = fromDateKey(today);
  return [
    {
      id: "review_1",
      date: toDateKey(addDays(todayDate, -1)),
      wins: "Finished two listening sets and consolidated mistakes.",
      wastedTime: "Short-video scrolling exceeded plan by 35 minutes.",
      improveOneThing: "Place phone on top shelf before study starts.",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "review_2",
      date: toDateKey(addDays(todayDate, -2)),
      wins: "Completed graph theory chapter recap.",
      wastedTime: "Spent too long preparing before study session.",
      improveOneThing: "Use 3-minute pre-study checklist only.",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createParsedImportTasks(): ParsedImportTask[] {
  return [];
}

export function createMockState(): AppState {
  const today = todayKey();
  const goals = createGoalTemplates(today);
  const sessions: GoalSession[] = goals.flatMap((goal) => generateGoalSessions(goal));
  const tasks = createTasks(today);

  const goalSessionMap = new Map<string, string[]>();
  sessions.forEach((session) => {
    const list = goalSessionMap.get(session.goalId) ?? [];
    list.push(session.id);
    goalSessionMap.set(session.goalId, list);
  });

  const goalTaskMap = new Map<string, string[]>();
  tasks.forEach((task) => {
    if (!task.goalId) {
      return;
    }
    const list = goalTaskMap.get(task.goalId) ?? [];
    list.push(task.id);
    goalTaskMap.set(task.goalId, list);
  });

  const goalsWithRelations = goals.map((goal) => ({
    ...goal,
    taskIds: goalTaskMap.get(goal.id) ?? [],
    sessionIds: goalSessionMap.get(goal.id) ?? [],
  }));

  const weatherLocations = createWeatherLocations(today);
  const selectedWeatherLocationId = weatherLocations.find((location) => location.isDefault)?.id ?? weatherLocations[0].id;
  const selectedCity = weatherLocations.find((location) => location.id === selectedWeatherLocationId)?.city ?? "Shanghai";

  return {
    user: {
      id: "user_demo",
      name: "Xiao Lin",
      role: "student",
      gradeLabel: "Junior - Computer Science",
      timezone: "Asia/Shanghai",
    },
    weather: getMockWeatherByCity(selectedCity, today),
    weatherLocations,
    selectedWeatherLocationId,
    timelineItems: createTimelineItems(today),
    newsItems: createNewsItems(today),
    goals: goalsWithRelations,
    goalSessions: sessions,
    weeklyPlans: [createWeeklyPlan(today)],
    tasks,
    knowledgeItems: createKnowledge(today),
    knowledgeCategories: createKnowledgeCategories(today),
    knowledgeSubjects: createKnowledgeSubjects(),
    knowledgeCourses: createKnowledgeCourses(today),
    knowledgeNodes: createKnowledgeNodes(today),
    quickNotes: createQuickNotes(today),
    pdfDocuments: createPdfDocuments(today),
    ideas: createIdeas(today),
    reviews: createReviews(today),
    parsedImportTasks: createParsedImportTasks(),
  };
}

export function createMockImportTasks(url: string): ParsedImportTask[] {
  const host = url.replace(/^https?:\/\//, "").split("/")[0] || "external source";
  return [
    {
      id: createId("import_task"),
      title: `Read one article from ${host} and extract 3 insights`,
      sourceUrl: url,
      selected: true,
    },
    {
      id: createId("import_task"),
      title: `Convert one ${host} idea into method notes`,
      sourceUrl: url,
      selected: true,
    },
    {
      id: createId("import_task"),
      title: `Create one review task based on ${host}`,
      sourceUrl: url,
      selected: false,
    },
  ];
}

export function createMockPdfSummary(fileName: string): {
  summary: string;
  keywords: string[];
  highlights: string[];
} {
  return {
    summary: `Mock summary for ${fileName}: core concepts, representative examples and review strategy extracted.`,
    keywords: ["core concept", "high-frequency pattern", "review strategy", "mistake recap"],
    highlights: [
      "Build concept map first, then attach example patterns.",
      "Convert repeat mistakes into checklist form.",
      "Generate one-page summary before exam week.",
    ],
  };
}