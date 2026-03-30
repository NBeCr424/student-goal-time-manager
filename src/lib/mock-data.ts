import { todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { AppState, ParsedImportTask, WeatherInfo } from "@/lib/types";

const WEATHER_PRESETS: Record<
  string,
  {
    condition: string;
    temperatureC: number;
    humidity: number;
    suggestion: string;
    outfitTip: string;
  }
> = {
  default: {
    condition: "多云",
    temperatureC: 23,
    humidity: 58,
    suggestion: "先看清今天最重要的任务，再开始执行。",
    outfitTip: "可按体感增减外套。",
  },
  上海: {
    condition: "多云",
    temperatureC: 23,
    humidity: 58,
    suggestion: "上午适合推进高优先级任务。",
    outfitTip: "短袖加薄外套更稳妥。",
  },
  北京: {
    condition: "晴",
    temperatureC: 19,
    humidity: 45,
    suggestion: "下午安排复盘和整理更合适。",
    outfitTip: "长袖或薄卫衣更舒适。",
  },
  广州: {
    condition: "闷热",
    temperatureC: 28,
    humidity: 72,
    suggestion: "任务尽量拆小，避免长时间高负荷。",
    outfitTip: "轻薄透气并注意补水。",
  },
};

function pickWeather(city: string) {
  if (city.includes("上海")) {
    return WEATHER_PRESETS.上海;
  }
  if (city.includes("北京")) {
    return WEATHER_PRESETS.北京;
  }
  if (city.includes("广州")) {
    return WEATHER_PRESETS.广州;
  }
  return WEATHER_PRESETS.default;
}

export function getMockWeatherByCity(city: string, date: string = todayKey()): WeatherInfo {
  const picked = pickWeather(city);
  return {
    date,
    location: city,
    condition: picked.condition,
    temperatureC: picked.temperatureC,
    humidity: picked.humidity,
    suggestion: picked.suggestion,
    outfitTip: picked.outfitTip,
  };
}

function createWeatherLocations(today: string): AppState["weatherLocations"] {
  return [{ id: "weather_shanghai", city: "上海", label: "上海", isDefault: true, createdAt: today, updatedAt: today }];
}

function createKnowledgeCategories(today: string): AppState["knowledgeCategories"] {
  return [
    { id: "cat_uncategorized", name: "未分类", order: 1, isSystem: true, createdAt: today, updatedAt: today },
    { id: "cat_note", name: "课堂笔记", order: 2, isSystem: false, createdAt: today, updatedAt: today },
    { id: "cat_method", name: "方法总结", order: 3, isSystem: false, createdAt: today, updatedAt: today },
  ];
}

function createFinanceCategories(today: string): AppState["financeCategories"] {
  return [
    { id: "fin_expense_food", name: "饮食", type: "expense", order: 1, isSystem: true, createdAt: today, updatedAt: today },
    {
      id: "fin_expense_transport",
      name: "交通",
      type: "expense",
      order: 2,
      isSystem: true,
      createdAt: today,
      updatedAt: today,
    },
    { id: "fin_expense_study", name: "学习", type: "expense", order: 3, isSystem: true, createdAt: today, updatedAt: today },
    { id: "fin_expense_other", name: "其他", type: "expense", order: 4, isSystem: true, createdAt: today, updatedAt: today },
    {
      id: "fin_income_allowance",
      name: "生活费",
      type: "income",
      order: 1,
      isSystem: true,
      createdAt: today,
      updatedAt: today,
    },
    { id: "fin_income_parttime", name: "兼职", type: "income", order: 2, isSystem: true, createdAt: today, updatedAt: today },
    { id: "fin_income_other", name: "其他收入", type: "income", order: 3, isSystem: true, createdAt: today, updatedAt: today },
  ];
}

export function createMockState(): AppState {
  const today = todayKey();
  const weatherLocations = createWeatherLocations(today);
  const selectedWeatherLocationId = weatherLocations[0].id;
  const selectedCity = weatherLocations[0].city;

  return {
    user: {
      id: "user_default",
      name: "同学",
      role: "student",
      gradeLabel: "未设置",
      timezone: "Asia/Shanghai",
    },
    weather: getMockWeatherByCity(selectedCity, today),
    weatherLocations,
    selectedWeatherLocationId,
    timelineItems: [],
    eventMemos: [],
    goals: [],
    goalTemplates: [],
    goalSessions: [],
    weeklyPlans: [],
    tasks: [],
    knowledgeItems: [],
    knowledgeCategories: createKnowledgeCategories(today),
    knowledgeSubjects: [],
    knowledgeCourses: [],
    knowledgeNodes: [],
    quickNotes: [],
    pdfDocuments: [],
    ideas: [],
    reviews: [],
    financeCategories: createFinanceCategories(today),
    financeRecords: [],
    budgetPlans: [],
    specialBudgets: [],
    specialBudgetRecords: [],
    parsedImportTasks: [],
    taskImportInbox: [],
    urlImportProviders: [{ id: "provider_mock", name: "Mock Parser", type: "mock", enabled: true, note: "本地解析示例" }],
    urlImportJobs: [],
    taskKnowledgeRelations: [],
    focusPresets: [
      { id: "focus_preset_25", label: "番茄 25 分钟", minutes: 25, isSystem: true },
      { id: "focus_preset_45", label: "专注 45 分钟", minutes: 45, isSystem: true },
      { id: "focus_preset_90", label: "冲刺 90 分钟", minutes: 90, isSystem: true },
    ],
    focusSessions: [],
  };
}

export function createMockImportTasks(url: string): ParsedImportTask[] {
  const host = url.replace(/^https?:\/\//, "").split("/")[0] || "网页来源";
  return [
    {
      id: createId("import_task"),
      title: `从 ${host} 提取 3 个可执行任务`,
      sourceUrl: url,
      selected: true,
    },
    {
      id: createId("import_task"),
      title: `把 ${host} 的关键信息整理到知识库`,
      sourceUrl: url,
      selected: true,
    },
    {
      id: createId("import_task"),
      title: "生成一条本周复盘提醒",
      sourceUrl: url,
      selected: false,
    },
  ];
}
