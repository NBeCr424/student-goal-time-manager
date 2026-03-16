"use client";

import { calcStreak, fromDateKey, getWeekDates, todayKey } from "@/lib/date";
import { useAppStore } from "@/store/app-store";

export function ProfilePage() {
  const { state } = useAppStore();
  const today = todayKey();

  const todayCompleted = state.tasks.filter((task) => task.dueDate === today && task.completed).length;

  const weekDates = getWeekDates(fromDateKey(today));
  const weekCompleted = state.tasks.filter((task) => weekDates.includes(task.dueDate) && task.completed).length;

  const reviewStreak = calcStreak(state.reviews.map((entry) => entry.date));
  const todayReview = state.reviews.find((entry) => entry.date === today);
  const reviewHistory = [...state.reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <h2 className="section-title">我的</h2>
        <p className="mt-1 text-sm text-ink/70">跟踪执行数据，保持稳定节奏。</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">今日完成数</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{todayCompleted}</p>
          </article>

          <article className="rounded-2xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">本周完成数</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{weekCompleted}</p>
          </article>

          <article className="rounded-2xl border border-ink/10 bg-white p-3">
            <p className="text-xs text-ink/60">连续复盘天数</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{reviewStreak}</p>
          </article>
        </div>

        <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink/75">
          今日复盘状态：{todayReview ? "已完成" : "未完成"}
        </div>
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title">复盘历史</h3>
          <span className="badge border-ink/15 bg-white text-ink/60">最近 {reviewHistory.length} 条</span>
        </div>

        <ul className="mt-3 space-y-2">
          {reviewHistory.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-ink/10 bg-white p-3">
              <p className="text-xs text-ink/55">{entry.date}</p>
              <p className="mt-1 text-sm text-ink/80">做成：{entry.wins || "-"}</p>
              <p className="mt-1 text-sm text-ink/80">浪费：{entry.wastedTime || "-"}</p>
              <p className="mt-1 text-sm text-ink/80">明日改进：{entry.improveOneThing || "-"}</p>
            </li>
          ))}
        </ul>

        {reviewHistory.length === 0 && <p className="mt-3 text-sm text-ink/60">还没有复盘记录，建议今晚先完成一条。</p>}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="card-surface p-4">
          <p className="soft-label">未来预留</p>
          <h3 className="mt-1 text-base font-semibold text-ink">黄金时段分析</h3>
          <p className="mt-2 text-sm text-ink/70">后续可分析你在哪个时段完成率更高，用于自动排程。</p>
        </article>

        <article className="card-surface p-4">
          <p className="soft-label">未来预留</p>
          <h3 className="mt-1 text-base font-semibold text-ink">数据同步</h3>
          <p className="mt-2 text-sm text-ink/70">后续可支持账号登录、多设备同步与备份恢复。</p>
        </article>

        <article className="card-surface p-4">
          <p className="soft-label">未来预留</p>
          <h3 className="mt-1 text-base font-semibold text-ink">提醒设置</h3>
          <p className="mt-2 text-sm text-ink/70">后续可配置学习提醒、截止预警与晚间复盘提醒。</p>
        </article>
      </section>
    </div>
  );
}
