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
  ParsedImportTask,
  PdfKnowledgeDocument,
  QuickNote,
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
      knowledgeItemIds: ["k_cet6_read_method"],
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
      knowledgeItemIds: ["k_algo_graph_mistake"],
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
      knowledgeItemIds: ["k_cet6_topic_summary"],
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
      knowledgeItemIds: ["k_algo_graph_mistake"],
      source: "manual",
      createdAt: today,
      updatedAt: today,
    },
  ];
}

function createKnowledgeCategories(today: string): KnowledgeCategory[] {
  return [
    { id: "cat_note", name: "课程笔记", order: 1, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_method", name: "方法库", order: 2, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_mistake", name: "错题整理", order: 3, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_link", name: "链接收藏", order: 4, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_pdf", name: "PDF 摘要", order: 5, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_summary", name: "总结沉淀", order: 6, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_exam", name: "考前冲刺", order: 7, isSystem: false, createdAt: today, updatedAt: today },
    {
      id: "cat_math_exam",
      name: "高数冲刺",
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
    { id: "subj_math", name: "数学", description: "微积分、线代、概率统计", order: 1 },
    { id: "subj_physics", name: "物理", description: "力学、电磁学、实验", order: 2 },
    { id: "subj_english", name: "英语", description: "四六级与学术英语", order: 3 },
  ];
}

function createKnowledgeCourses(today: string): KnowledgeCourse[] {
  return [
    {
      id: "course_calc",
      subjectId: "subj_math",
      name: "高等数学",
      description: "主线：极限、导数、积分、级数。",
      order: 1,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "course_physics1",
      subjectId: "subj_physics",
      name: "大学物理 I",
      description: "主线：质点运动学、牛顿定律、动量与能量。",
      order: 1,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "course_cet6",
      subjectId: "subj_english",
      name: "英语六级",
      description: "主线：阅读、听力、写作、翻译。",
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
      title: "第1章 极限与连续",
      type: "chapter",
      description: "建立极限定义、无穷小比较、连续性判断。",
      order: 1,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_calc_topic_integral",
      courseId: "course_calc",
      title: "积分技巧专题",
      type: "topic",
      description: "换元、分部积分与参数积分技巧归纳。",
      order: 2,
      status: "review_pending",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_calc_summary_mid",
      courseId: "course_calc",
      title: "期中复习总结",
      type: "summary",
      description: "按题型整理可复用步骤和坑点。",
      order: 3,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_phy_ch1",
      courseId: "course_physics1",
      title: "第1章 质点运动学",
      type: "chapter",
      description: "位移、速度、加速度和抛体运动。",
      order: 1,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_phy_topic_lab",
      courseId: "course_physics1",
      title: "MATLAB 实验报告专题",
      type: "topic",
      description: "数据可视化和实验误差分析模板。",
      order: 2,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_phy_summary_final",
      courseId: "course_physics1",
      title: "考前总复盘",
      type: "summary",
      description: "按知识模块进行闭环复习。",
      order: 3,
      status: "not_started",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_en_topic_read",
      courseId: "course_cet6",
      title: "阅读技巧专题",
      type: "topic",
      description: "定位法、段落主旨法和选项排除法。",
      order: 1,
      status: "learning",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_en_ch_listening",
      courseId: "course_cet6",
      title: "听力高频场景",
      type: "chapter",
      description: "校园、求职、学术讲座高频词块。",
      order: 2,
      status: "review_pending",
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "node_en_summary_exam",
      courseId: "course_cet6",
      title: "考前冲刺总结",
      type: "summary",
      description: "四类题型最后一周策略。",
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
      title: "高数第1章讲义摘要",
      fileName: "calc-limit-lecture.pdf",
      fileSizeKb: 2280,
      subjectId: "subj_math",
      courseId: "course_calc",
      nodeId: "node_calc_ch1",
      summary: "讲义重点覆盖极限四则运算、重要极限、夹逼准则和连续函数性质。",
      keywords: ["极限", "连续", "夹逼准则", "洛必达"],
      highlights: [
        "先判断函数是否有界，再选择夹逼或等价替换。",
        "分段函数连续性题优先检查连接点左右极限。",
      ],
      createdAt: today,
      updatedAt: today,
      savedAsKnowledgeItemId: "k_pdf_calc_summary",
    },
    {
      id: "pdf_phy_sheet",
      title: "质点运动习题讲义摘要",
      fileName: "physics-kinematics-sheet.pdf",
      fileSizeKb: 1560,
      subjectId: "subj_physics",
      courseId: "course_physics1",
      nodeId: "node_phy_ch1",
      summary: "讲义整理了匀变速直线和抛体运动题型，强调受力分析与方程选择。",
      keywords: ["匀加速", "抛体", "位移方程", "受力分析"],
      highlights: [
        "先画运动示意图，再设坐标系。",
        "拆分水平和竖直方向方程可减少错误。",
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
      title: "极限题速记",
      content: "遇到 x→0 的三角函数极限，先尝试等价替换和泰勒前两项。",
      tags: ["高数", "极限"],
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
      title: "抛体运动误区",
      content: "总时间不要直接套公式，先看竖直方向回到同一高度还是不同高度。",
      tags: ["物理", "抛体", "错题"],
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
      title: "极限定义与常见判别",
      type: "note",
      tags: ["高数", "极限"],
      content: "先判断趋近点，再选方法：代入/因式分解/有理化/等价替换。",
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
      title: "六级阅读定位法模板",
      type: "method",
      tags: ["英语", "阅读", "技巧"],
      content: "题干关键词定位 -> 段落主旨 -> 选项排除。限时 18 分钟。",
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
      title: "图遍历错题归纳",
      type: "mistake",
      tags: ["算法", "BFS", "DFS"],
      content: "visited 初始化时机错误会导致重复计数；先入队再标记。",
      categoryId: "cat_mistake",
      relatedTaskIds: ["task_today_2", "task_week_2"],
      createdAt: today,
      updatedAt: today,
    },
    {
      id: "k_math_link",
      title: "积分技巧可视化链接",
      type: "link",
      tags: ["数学", "积分", "可视化"],
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
      title: "高数第1章 PDF 摘要",
      type: "pdf_summary",
      tags: ["PDF", "高数", "极限"],
      content: "讲义重点：极限四则、重要极限、夹逼准则、分段函数连续。",
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
      title: "六级阅读专题总结",
      type: "topic_summary",
      tags: ["六级", "专题总结"],
      content: "本专题只保留 3 个稳定动作：定位、主旨、排除，避免反复换策略。",
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
      title: "质点运动学章节总结",
      type: "chapter_summary",
      tags: ["物理", "章节总结"],
      content: "每道题都先写已知与待求，再判断用运动学方程还是受力分析。",
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
      title: "抛体运动误区（由速记导入）",
      type: "quick_note_import",
      tags: ["速记导入", "物理"],
      content: "总时间不要先套公式，先判断回落高度。",
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

export function createMockPdfSummary(fileName: string): {
  summary: string;
  keywords: string[];
  highlights: string[];
} {
  return {
    summary: `已基于 ${fileName} 生成 mock 摘要：文档核心围绕概念定义、典型例题和复习策略。`,
    keywords: ["核心概念", "高频题型", "复习策略", "错题回看"],
    highlights: [
      "先建立知识框架，再补充细节例题。",
      "优先把错题归入可复用模板。",
      "考前按章节做一页总结。",
    ],
  };
}