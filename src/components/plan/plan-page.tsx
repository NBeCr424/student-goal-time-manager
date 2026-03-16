"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPanel } from "@/components/plan/calendar-panel";
import { GoalsPanel } from "@/components/plan/goals-panel";
import { ImportPanel } from "@/components/plan/import-panel";
import { TodayPanel } from "@/components/plan/today-panel";
import { WeeklyPanel } from "@/components/plan/weekly-panel";

type PlanTab = "today" | "weekly" | "goals" | "calendar" | "import";

const tabs: Array<{ id: PlanTab; label: string; hint: string }> = [
  { id: "today", label: "今日任务", hint: "先排今天" },
  { id: "weekly", label: "本周任务", hint: "再看本周" },
  { id: "goals", label: "长期目标", hint: "最后看长期" },
  { id: "calendar", label: "日历", hint: "全局视角" },
  { id: "import", label: "导入任务", hint: "外部输入" },
];

export function PlanPage() {
  const [activeTab, setActiveTab] = useState<PlanTab>("today");

  useEffect(() => {
    const queryTab = new URLSearchParams(window.location.search).get("tab") as PlanTab | null;
    if (queryTab && tabs.some((tab) => tab.id === queryTab)) {
      setActiveTab(queryTab);
    }
  }, []);

  const tabContent = useMemo(() => {
    if (activeTab === "today") {
      return <TodayPanel />;
    }
    if (activeTab === "weekly") {
      return <WeeklyPanel />;
    }
    if (activeTab === "goals") {
      return <GoalsPanel />;
    }
    if (activeTab === "calendar") {
      return <CalendarPanel />;
    }
    return <ImportPanel />;
  }, [activeTab]);

  return (
    <div className="space-y-4">
      <section className="card-surface p-2">
        <div className="flex gap-2 overflow-x-auto px-1 pb-1 pt-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id ? "bg-ink text-white" : "bg-white text-ink/70"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1 text-[11px] opacity-75">{tab.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {tabContent}
    </div>
  );
}
