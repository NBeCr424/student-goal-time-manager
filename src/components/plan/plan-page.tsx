"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPlanPanel } from "@/components/plan/day-plan-panel";
import { GoalsPanel } from "@/components/plan/goals-panel";
import { PlanHubPanel } from "@/components/plan/plan-hub-panel";
import { WeeklyPanel } from "@/components/plan/weekly-panel";

type PlanTab = "day" | "weekly" | "goals";

const mainTabs: Array<{ id: PlanTab; label: string }> = [
  { id: "day", label: "日计划" },
  { id: "weekly", label: "本周计划" },
  { id: "goals", label: "长期目标" },
];

function normalizeQueryTab(value: string | null): PlanTab | null {
  if (!value) {
    return null;
  }
  if (value === "today" || value === "day") {
    return "day";
  }
  if (value === "weekly" || value === "week") {
    return "weekly";
  }
  if (value === "goals" || value === "goal") {
    return "goals";
  }
  return null;
}

export function PlanPage() {
  const [activeTab, setActiveTab] = useState<PlanTab>("day");
  const [showHub, setShowHub] = useState(true);

  useEffect(() => {
    const queryTab = normalizeQueryTab(new URLSearchParams(window.location.search).get("tab"));
    if (queryTab) {
      setActiveTab(queryTab);
      setShowHub(false);
      return;
    }
    setShowHub(true);
  }, []);

  const tabContent = useMemo(() => {
    if (activeTab === "day") {
      return <DayPlanPanel />;
    }
    if (activeTab === "weekly") {
      return <WeeklyPanel />;
    }
    return <GoalsPanel />;
  }, [activeTab]);

  if (showHub) {
    return <PlanHubPanel onNavigate={(target) => {
      setActiveTab(target);
      setShowHub(false);
    }} />;
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-2">
        <div className="flex gap-1 px-1">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                activeTab === tab.id ? "bg-ink text-white" : "bg-white text-ink/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowHub(true)}
            className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink/65"
          >
            入口
          </button>
        </div>
      </section>

      {tabContent}
    </div>
  );
}
