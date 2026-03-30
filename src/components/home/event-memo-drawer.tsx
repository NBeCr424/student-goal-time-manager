"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { EventMemo, EventMemoStatus } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

interface EventMemoDrawerProps {
  open: boolean;
  onClose: () => void;
}

type DrawerTab = "in_progress" | "not_started" | "completed";

const tabs: Array<{ id: DrawerTab; label: string }> = [
  { id: "in_progress", label: "进行中" },
  { id: "not_started", label: "待规划" },
  { id: "completed", label: "已完成" },
];

const statusText: Record<EventMemoStatus, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  paused: "暂停",
  completed: "已完成",
};

function progressOf(eventMemo: EventMemo): number {
  if (eventMemo.steps.length === 0) {
    if (eventMemo.status === "completed") {
      return 100;
    }
    if (eventMemo.status === "in_progress") {
      return 35;
    }
    return 0;
  }

  const doneCount = eventMemo.steps.filter((step) => step.completed).length;
  return Math.round((doneCount / eventMemo.steps.length) * 100);
}

function nextActionText(eventMemo: EventMemo): string {
  return eventMemo.nextAction?.trim() || "继续推进下一步";
}

export function EventMemoDrawer({ open, onClose }: EventMemoDrawerProps) {
  const { state, actions } = useAppStore();
  const [activeTab, setActiveTab] = useState<DrawerTab>("in_progress");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDeadline, setQuickDeadline] = useState("");

  const counts = useMemo(
    () => ({
      in_progress: state.eventMemos.filter((item) => item.status === "in_progress").length,
      not_started: state.eventMemos.filter((item) => item.status === "not_started" || item.status === "paused").length,
      completed: state.eventMemos.filter((item) => item.status === "completed").length,
    }),
    [state.eventMemos],
  );

  const activeList = useMemo(() => {
    if (activeTab === "not_started") {
      return state.eventMemos
        .filter((item) => item.status === "not_started" || item.status === "paused")
        .sort((a, b) => `${b.updatedAt}-${b.createdAt}`.localeCompare(`${a.updatedAt}-${a.createdAt}`));
    }

    return state.eventMemos
      .filter((item) => item.status === activeTab)
      .sort((a, b) => `${b.updatedAt}-${b.createdAt}`.localeCompare(`${a.updatedAt}-${a.createdAt}`));
  }, [activeTab, state.eventMemos]);

  function submitQuickCreate(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = quickTitle.trim();
    if (!cleanTitle) {
      return;
    }

    actions.addEventMemo({
      title: cleanTitle,
      deadline: quickDeadline || undefined,
      nextAction: "第一步",
    });

    setQuickTitle("");
    setQuickDeadline("");
    setActiveTab("not_started");
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/35" aria-label="关闭事件备忘抽屉" />

      <section className="relative z-10 max-h-[90vh] w-full rounded-t-3xl border border-ink/10 bg-paper pb-4 shadow-card md:mx-auto md:max-w-xl">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-ink/20" />

        <header className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-ink">事件备忘</h3>
            <p className="text-xs text-ink/60">先记一件事，再逐步推进。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70"
          >
            关闭
          </button>
        </header>

        <div className="px-4">
          <form onSubmit={submitQuickCreate} className="space-y-2 rounded-2xl border border-ink/10 bg-white p-3">
            <input
              value={quickTitle}
              onChange={(event) => setQuickTitle(event.target.value)}
              placeholder="事件标题（例：准备周五展示）"
              className="w-full rounded-xl border border-ink/15 bg-paper px-3 py-2 text-sm outline-none ring-mint/50 focus:ring"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={quickDeadline}
                onChange={(event) => setQuickDeadline(event.target.value)}
                className="flex-1 rounded-xl border border-ink/15 bg-paper px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-xl bg-ink px-3 py-2 text-sm font-medium text-white">
                记录
              </button>
            </div>
          </form>
        </div>

        <div className="mt-3 px-4">
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  activeTab === tab.id ? "bg-ink text-white" : "text-ink/70"
                }`}
              >
                {tab.label}
                <span className="ml-1 text-[10px] opacity-80">({counts[tab.id]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 max-h-[54vh] overflow-y-auto px-4">
          <div className="space-y-2 pb-2">
            {activeList.map((item) => {
              const progress = progressOf(item);
              return (
                <article key={item.id} className="rounded-2xl border border-ink/10 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium text-ink">{item.title}</p>
                    <span className="badge border-ink/15 bg-paper text-ink/65">{statusText[item.status]}</span>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[11px] text-ink/60">
                      <span>进度</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-ink/10">
                      <div className="h-1.5 rounded-full bg-mint" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-1 text-xs text-ink/65">下一步：{nextActionText(item)}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => actions.moveEventMemoToPlan(item.id, "today")}
                      className="rounded-full border border-ink/15 bg-white px-2 py-1 text-[11px] text-ink/70"
                    >
                      转入今日
                    </button>
                    <Link
                      href={`/events/${item.id}`}
                      onClick={onClose}
                      className="rounded-full border border-ink/15 bg-white px-2 py-1 text-[11px] text-ink/70"
                    >
                      查看详情
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {activeList.length === 0 && (
            <p className="rounded-2xl border border-dashed border-ink/20 bg-white/70 py-6 text-center text-sm text-ink/55">
              当前分组还没有事件，先快速记录一件事。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}