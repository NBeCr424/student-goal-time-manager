"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { calcStreak, fromDateKey, getWeekDates, todayKey } from "@/lib/date";
import { useAppStore } from "@/store/app-store";

function toText(value: string | undefined): string {
  const clean = value?.trim() ?? "";
  return clean || "未填写";
}

export function ProfilePage() {
  const { state, actions } = useAppStore();
  const searchParams = useSearchParams();
  const today = todayKey();
  const weekDates = getWeekDates(fromDateKey(today));
  const reviewSectionRef = useRef<HTMLElement | null>(null);

  const todayCompleted = state.tasks.filter((task) => task.dueDate === today && task.completed).length;
  const weekCompleted = state.tasks.filter((task) => weekDates.includes(task.dueDate) && task.completed).length;
  const reviewStreak = calcStreak(state.reviews.map((entry) => entry.date));
  const todayReview = state.reviews.find((entry) => entry.date === today);
  const reviewHistory = useMemo(() => [...state.reviews].sort((a, b) => b.date.localeCompare(a.date)), [state.reviews]);
  const reviewTabActive = searchParams.get("tab") === "review";
  const todayReviewWins = todayReview?.wins ?? "";
  const todayReviewWasted = todayReview?.wastedTime ?? "";
  const todayReviewImprove = todayReview?.improveOneThing ?? "";

  const [reviewExpanded, setReviewExpanded] = useState(reviewTabActive);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [winsDraft, setWinsDraft] = useState("");
  const [wastedDraft, setWastedDraft] = useState("");
  const [improveDraft, setImproveDraft] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (!reviewTabActive) {
      return;
    }
    setReviewExpanded(true);
    requestAnimationFrame(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [reviewTabActive]);

  useEffect(() => {
    setWinsDraft(todayReviewWins);
    setWastedDraft(todayReviewWasted);
    setImproveDraft(todayReviewImprove);
  }, [todayReviewImprove, todayReviewWasted, todayReviewWins]);

  const visibleHistory = showAllHistory ? reviewHistory : reviewHistory.slice(0, 3);

  function submitTodayReview(event: FormEvent) {
    event.preventDefault();
    if (!winsDraft.trim() && !wastedDraft.trim() && !improveDraft.trim()) {
      setHint("至少填写一项再保存。");
      return;
    }
    actions.addReview(winsDraft, wastedDraft, improveDraft);
    setHint("今日复盘已保存。");
  }

  return (
    <div className="space-y-4">
      <section ref={reviewSectionRef} className="card-surface p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="section-title">今日复盘</h2>
            <p className="mt-1 text-sm text-ink/70">
              状态：<span className="font-medium text-ink">{todayReview ? "已完成" : "未完成"}</span>
            </p>
          </div>
          <span className={`badge ${todayReview ? "border-mint/40 bg-mint/15 text-ink" : "border-amber-300 bg-amber-50 text-amber-700"}`}>
            {todayReview ? "已完成" : "待完成"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {!todayReview ? (
            <Link href="/profile?tab=review" className="flex-1 rounded-xl bg-ink px-4 py-2 text-center text-sm font-medium text-white">
              去复盘
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setReviewExpanded(false);
                  setHint("");
                }}
                className="flex-1 rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/75"
              >
                查看复盘
              </button>
              <Link href="/profile?tab=review" className="flex-1 rounded-xl bg-ink px-4 py-2 text-center text-sm font-medium text-white">
                修改复盘
              </Link>
            </>
          )}
        </div>

        {todayReview && !reviewExpanded && (
          <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/55">今日记录</p>
            <p className="mt-1 text-sm text-ink/80">做成：{toText(todayReview.wins)}</p>
            <p className="mt-1 text-sm text-ink/80">浪费：{toText(todayReview.wastedTime)}</p>
            <p className="mt-1 text-sm text-ink/80">明日改进：{toText(todayReview.improveOneThing)}</p>
          </div>
        )}

        {reviewExpanded && (
          <form onSubmit={submitTodayReview} className="mt-3 space-y-2 rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">直接在这里填写今日复盘</p>
            <textarea
              value={winsDraft}
              onChange={(event) => setWinsDraft(event.target.value)}
              rows={3}
              placeholder="今天做成了什么"
              className="w-full resize-none rounded-xl border border-ink/15 px-3 py-2 text-sm"
            />
            <textarea
              value={wastedDraft}
              onChange={(event) => setWastedDraft(event.target.value)}
              rows={3}
              placeholder="今天哪里浪费了时间"
              className="w-full resize-none rounded-xl border border-ink/15 px-3 py-2 text-sm"
            />
            <textarea
              value={improveDraft}
              onChange={(event) => setImproveDraft(event.target.value)}
              rows={3}
              placeholder="明天只改进一件事"
              className="w-full resize-none rounded-xl border border-ink/15 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">
                保存今日复盘
              </button>
              <button
                type="button"
                onClick={() => setReviewExpanded(false)}
                className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink/70"
              >
                收起
              </button>
            </div>
          </form>
        )}

        {hint && <p className="mt-2 text-xs text-ink/60">{hint}</p>}
      </section>

      <section className="card-surface p-4">
        <h3 className="section-title">成长摘要</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/55">今日完成</p>
            <p className="mt-1 text-lg font-semibold text-ink">{todayCompleted}</p>
          </article>
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/55">本周完成</p>
            <p className="mt-1 text-lg font-semibold text-ink">{weekCompleted}</p>
          </article>
          <article className="rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/55">连续复盘</p>
            <p className="mt-1 text-lg font-semibold text-ink">{reviewStreak} 天</p>
          </article>
        </div>
      </section>

      <section className="card-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">复盘历史</h3>
          <span className="badge border-ink/15 bg-white text-ink/60">共 {reviewHistory.length} 条</span>
        </div>

        {reviewHistory.length === 0 ? (
          <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-sm text-ink/65">还没有复盘记录，今晚先完成第一条。</p>
            <Link href="/profile?tab=review" className="mt-2 inline-flex rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink/70">
              去复盘
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-3 space-y-2">
              {visibleHistory.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-ink/10 bg-white p-3">
                  <p className="text-xs text-ink/55">{entry.date}</p>
                  <p className="mt-1 text-sm text-ink/80 line-clamp-1">做成：{toText(entry.wins)}</p>
                  <p className="mt-1 text-sm text-ink/80 line-clamp-1">明日改进：{toText(entry.improveOneThing)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex gap-2">
              <Link href="/profile?tab=review" className="flex-1 rounded-xl border border-ink/15 bg-white py-2 text-center text-xs text-ink/70">
                去复盘
              </Link>
              {reviewHistory.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllHistory((prev) => !prev)}
                  className="flex-1 rounded-xl border border-ink/15 bg-white py-2 text-xs text-ink/70"
                >
                  {showAllHistory ? "收起" : "查看全部"}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <section className="card-surface p-4">
        <button
          type="button"
          onClick={() => setShowSettings((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="section-title">设置与数据</h3>
          <span className="text-sm text-ink/55">{showSettings ? "收起" : "展开"}</span>
        </button>

        {showSettings && (
          <div className="mt-3 space-y-2">
            <article className="rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink/70">
              <p>当前为纯本地模式，数据保存在本设备浏览器。</p>
              <p className="mt-1">项目已移除 Supabase 相关能力。</p>
            </article>

            <div className="flex gap-2">
              <Link href="/plan?tab=import" className="flex-1 rounded-xl border border-ink/15 bg-white py-2 text-center text-xs text-ink/70">
                外部任务导入
              </Link>
              <Link href="/profile/integrations" className="flex-1 rounded-xl border border-ink/15 bg-white py-2 text-center text-xs text-ink/70">
                集成说明
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
