"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarPanel } from "@/components/plan/calendar-panel";
import { GoalsPanel } from "@/components/plan/goals-panel";
import { ImportPanel } from "@/components/plan/import-panel";
import { TodayPanel } from "@/components/plan/today-panel";
import { WeeklyPanel } from "@/components/plan/weekly-panel";

type PlanTab = "goals" | "weekly" | "today" | "calendar" | "import";

const tabs: Array<{ id: PlanTab; label: string }> = [
  { id: "goals", label: "长期目标" },
  { id: "weekly", label: "本周计划" },
  { id: "today", label: "今日任务" },
  { id: "calendar", label: "日历" },
  { id: "import", label: "导入任务" },
];

export function PlanPage() {
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab") as PlanTab | null;

  const [activeTab, setActiveTab] = useState<PlanTab>(queryTab ?? "goals");

  useEffect(() => {
    if (queryTab && tabs.some((tab) => tab.id === queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const tabContent = useMemo(() => {
    if (activeTab === "goals") {
      return <GoalsPanel />;
    }
    if (activeTab === "weekly") {
      return <WeeklyPanel />;
    }
    if (activeTab === "today") {
      return <TodayPanel />;
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
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {tabContent}
    </div>
  );
}
