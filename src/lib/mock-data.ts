import { addDays, formatDateLabel, fromDateKey, startOfWeek, toDateKey, todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { generateGoalSessions } from "@/lib/scheduler";
import {
  AppState,
  Goal,
  GoalSession,
  Idea,
  KnowledgeItem,
  ParsedImportTask,
  Task,
  WeeklyPlan,
} from "@/lib/types";

function createGoalTemplates(today: string): Goal[] {
  const baseDate = fromDateKey(today);

  return [
    {
      id: "goal_english_6",
      title: "英语六级 560+",
      description: "在 6 周内完成阅读、听力、写作三轮强化，并在模拟考试达到 560 分以上。",
      smart: {
        specific: "每周完成 3 套阅读 + 2 套听力 + 2 篇作文。",
        measurable: "每周日记录得分，目标从 480 提升到 560。",
        achievable: "每天安排 60-90 分钟，不追求超长学习时段。",
        relevant: "提升英语能力并满足奖学金申请要求。",
        timeBound: "2026-04-25 前达到目标分数。",
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
      title: "数据结构期末 A",
      description: "通过系统复习链表、树、图与复杂度分析，期末拿到 A。",
      smart: {
        specific: "完成课堂题库 120 题，整理错题本。",
        measurable: "每周至少新增 25 道题并复盘。",
        achievable: "晚间安排 90 分钟深度学习时段。",
        relevant: "核心专业课成绩影响保研排名。",
        timeBound: "2026-05-08 前完成 3 次全真模拟。",
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
      title: "晨跑习惯 30 天",
      description: "建立稳定晨跑习惯，提升专注力和精力稳定性。",
      smart: {
        specific: "每周至少跑步 4 天，每次 25-35 分钟。",
        measurable: "打卡总时长与完成天数。",
        achievable: "从低强度开始，避免受伤。",
        relevant: "改善学习状态与睡眠质量。",
        timeBound: "2026-05-20 前完成 30 天累计打卡。",
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
      title: "英语阅读真题 2 篇 + 精读标注",
      description: "完成后记录生词与长难句。",
      completed: false,
      dueDate: today,
      priority: "high",
      planType: "today_top",
      order: 1,
      goalId: "goal_english_6",
      knowledgeItemIds: ["k_method_reading"],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "task_today_2",
      title: "数据结构错题 20 题复刷",
      description: "重点关注树与图遍历题。",
      completed: false,
      dueDate: today,
      priority: "high",
      planType: "today_secondary",
      order: 2,
      goalId: "goal_algo_final",
      knowledgeItemIds: ["k_wrong_algo"],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "task_today_3",
      title: "整理一页作文模板",
      description: "输出到方法库，便于复用。",
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
      title: "给下周课程做预习提纲",
      description: "只写提纲，不求完整笔记。",
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
      title: "周末完成一次英语模考",
      description: "按正式考试流程计时。",
      completed: false,
      dueDate: toDateKey(addDays(todayDate, 5)),
      priority: "high",
      planType: "weekly",
      order: 1,
      goalId: "goal_english_6",
      knowledgeItemIds: [],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "task_week_2",
      title: "完成图算法专题复盘",
      description: "归纳 3 个易错点。",
      completed: false,
      dueDate: toDateKey(addDays(todayDate, 4)),
      priority: "medium",
      planType: "weekly",
      order: 2,
      goalId: "goal_algo_final",
      knowledgeItemIds: ["k_wrong_algo"],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createKnowledge(today: string): KnowledgeItem[] {
  return [
    {
      id: "k_course_os",
      title: "操作系统-进程通信速记",
      category: "course_notes",
      tags: ["OS", "IPC", "期末"],
      content: "管道、消息队列、共享内存与信号量适用场景对比。",
      relatedTaskIds: [],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_method_reading",
      title: "英语阅读定位法模板",
      category: "method_library",
      tags: ["英语", "阅读", "方法"],
      content: "题干关键词定位 -> 段落主旨 -> 选项对照排除，限时 18 分钟。",
      relatedTaskIds: ["task_today_1"],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_wrong_algo",
      title: "数据结构错题-图遍历",
      category: "wrong_question",
      tags: ["图", "BFS", "DFS"],
      content: "常见错误：visited 初始化时机错误导致重复计数。",
      relatedTaskIds: ["task_today_2", "task_week_2"],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_link_math",
      title: "线性代数可视化课程",
      category: "link_collection",
      tags: ["数学", "可视化", "推荐"],
      content: "https://example.com/linear-algebra-visual-course",
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
      content: "把英语作文模板做成 Anki 卡片，碎片时间复习。",
      category: "study_inspiration",
      status: "unprocessed",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "idea_2",
      content: "周三晚自习容易分神，试试 25+5 专注节奏。",
      category: "review_thought",
      status: "unprocessed",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "idea_3",
      content: "做一个寝室共享的作息打卡表。",
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
      `周一已完成：${formatDateLabel(today)} 的三件事中 2 件。`,
      "周二晚间复盘：图算法题目耗时过长，已补充模板。",
    ],
    checkSummary: "本周开始执行更稳定，但晚上学习容易拖延到 23:30 后。",
    nextWeekOneImprovement: "下周只改一个问题：22:45 前结束学习并开始复盘。",
    updatedAt: today,
  };
}

function createReviews(today: string) {
  const todayDate = fromDateKey(today);
  return [
    {
      id: "review_1",
      date: toDateKey(addDays(todayDate, -1)),
      wins: "完成了英语听力 2 套并整理了错题。",
      wastedTime: "刷短视频超出计划 35 分钟。",
      improveOneThing: "学习前先把手机放到书柜顶层。",
      createdAt: today,
    },
    {
      id: "review_2",
      date: toDateKey(addDays(todayDate, -2)),
      wins: "数据结构图论章节复盘完毕。",
      wastedTime: "下午自习前准备时间过长。",
      improveOneThing: "自习开始前 3 分钟只做清单确认。",
      createdAt: today,
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


  return {
    user: {
      id: "user_demo",
      name: "小林",
      role: "student",
      gradeLabel: "大三 · 计算机科学",
      timezone: "Asia/Shanghai",
    },
    weather: {
      date: today,
      location: "上海",
      condition: "多云",
      temperatureC: 23,
      humidity: 58,
      suggestion: "适合 45 分钟学习冲刺，午后安排中等强度任务。",
      outfitTip: "薄外套 + 透气上衣，晚间注意保暖。",
    },
    goals: goalsWithRelations,
    goalSessions: sessions,
    weeklyPlans: [createWeeklyPlan(today)],
    tasks,
    knowledgeItems: createKnowledge(today),
    ideas: createIdeas(today),
    reviews: createReviews(today),
    parsedImportTasks: createParsedImportTasks(),
  };
}

export function createMockImportTasks(url: string): ParsedImportTask[] {
  const host = url.replace(/^https?:\/\//, "").split("/")[0] || "外部网页";
  return [
    {
      id: createId("import_task"),
      title: `阅读 ${host} 文章并提炼 3 条要点`,
      sourceUrl: url,
      selected: true,
    },
    {
      id: createId("import_task"),
      title: `将 ${host} 的案例整理到方法库`,
      sourceUrl: url,
      selected: true,
    },
    {
      id: createId("import_task"),
      title: `为 ${host} 相关主题创建 1 个复习任务`,
      sourceUrl: url,
      selected: false,
    },
  ];
}
