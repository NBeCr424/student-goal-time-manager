"use client";

import Link from "next/link";
import { downloadIcsFile, exportToICS, mapGoalSessionsToCalendarEvents } from "@/lib/calendar-sync";
import { formatDateLabel } from "@/lib/date";
import { getGoalScheduleStats } from "@/lib/scheduler";
import { GoalSession, PreferredTimeOfDay, SessionStatus } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const preferredTimeLabel: Record<PreferredTimeOfDay, string> = {
  morning: "\u4e0a\u5348",
  afternoon: "\u4e0b\u5348",
  evening: "\u665a\u4e0a",
  flexible: "\u7075\u6d3b\u5b89\u6392",
};

const goalStatusLabel = {
  not_started: "\u672a\u5f00\u59cb",
  active: "\u8fdb\u884c\u4e2d",
  paused: "\u6682\u505c",
  completed: "\u5df2\u5b8c\u6210",
} as const;

const goalPriorityLabel = {
  high: "\u9ad8\u4f18\u5148\u7ea7",
  medium: "\u4e2d\u4f18\u5148\u7ea7",
  low: "\u4f4e\u4f18\u5148\u7ea7",
} as const;

const sessionStatusLabel: Record<SessionStatus, string> = {
  planned: "\u5df2\u8ba1\u5212",
  done: "\u5df2\u5b8c\u6210",
  missed: "\u672a\u5b8c\u6210",
};

function toHourText(minutes: number): string {
  return `${(minutes / 60).toFixed(1)} \u5c0f\u65f6`;
}

function sortSessions(a: GoalSession, b: GoalSession): number {
  return `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
}

export function GoalDetailPage({ goalId }: { goalId: string }) {
  const { state, actions } = useAppStore();

  const goal = state.goals.find((item) => item.id === goalId);

  if (!goal) {
    return (
      <section className="card-surface p-6 text-center">
        <h2 className="text-lg font-semibold text-ink">\u76ee\u6807\u4e0d\u5b58\u5728</h2>
        <p className="mt-2 text-sm text-ink/70">\u53ef\u80fd\u5df2\u88ab\u5220\u9664\uff0c\u6216\u5f53\u524d\u94fe\u63a5\u5df2\u5931\u6548\u3002</p>
        <Link href="/plan" className="mt-4 inline-flex rounded-xl bg-ink px-4 py-2 text-sm text-white">
          \u8fd4\u56de\u8ba1\u5212\u9875
        </Link>
      </section>
    );
  }

  const currentGoal = goal;
  const sessions = state.goalSessions.filter((session) => session.goalId === currentGoal.id).sort(sortSessions);
  const stats = getGoalScheduleStats(currentGoal, sessions);
  const goalTitleById = new Map(state.goals.map((item) => [item.id, item.title]));

  function exportGoalSchedule() {
    if (sessions.length === 0) {
      return;
    }

    const events = mapGoalSessionsToCalendarEvents(sessions, goalTitleById);
    const ics = exportToICS(events, `${currentGoal.title} \u6267\u884c\u8ba1\u5212`);
    downloadIcsFile(`goal-${currentGoal.id}-sessions.ics`, ics);
    actions.markGoalSessionsSyncedToCalendar(
      events.map((eventItem) => eventItem.sourceId),
      true,
    );
  }

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="soft-label">\u76ee\u6807\u8be6\u60c5</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{currentGoal.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink/75">{currentGoal.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge border-ink/15 bg-white text-ink/70">{goalPriorityLabel[currentGoal.priority]}</span>
            <span className="badge border-mint/45 bg-mint/15 text-ink/70">{goalStatusLabel[currentGoal.status]}</span>
          </div>
        </div>

        <div className="mt-4 h-2 rounded-full bg-ink/10">
          <div className="h-2 rounded-full bg-mint" style={{ width: `${currentGoal.progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-ink/60">\u8fdb\u5ea6 {currentGoal.progress}%</p>

        <div className="mt-4 grid gap-2 text-xs text-ink/75 sm:grid-cols-2 lg:grid-cols-3">
          <p className="rounded-lg bg-white p-3">\u622a\u6b62\u65e5\u671f\uff1a{currentGoal.deadline}</p>
          <p className="rounded-lg bg-white p-3">\u9884\u8ba1\u603b\u65f6\u957f\uff1a{currentGoal.estimatedTotalHours} \u5c0f\u65f6</p>
          <p className="rounded-lg bg-white p-3">\u5efa\u8bae\u5355\u6b21\u6295\u5165\uff1a{currentGoal.suggestedSessionMinutes} \u5206\u949f</p>
          <p className="rounded-lg bg-white p-3">\u504f\u597d\u65f6\u6bb5\uff1a{preferredTimeLabel[currentGoal.preferredTimeOfDay]}</p>
          <p className="rounded-lg bg-white p-3">\u5df2\u5b89\u6392\uff1a{toHourText(stats.scheduledMinutes)}</p>
          <p className="rounded-lg bg-white p-3">\u672a\u5b89\u6392\uff1a{toHourText(stats.unscheduledMinutes)}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => actions.regenerateGoalSessions(currentGoal.id)}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white"
          >
            \u4e3a\u6211\u5b89\u6392\u65f6\u95f4
          </button>
          <Link
            href="/plan?tab=calendar"
            className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink/80"
          >
            \u5728\u65e5\u5386\u4e2d\u67e5\u770b
          </Link>
          <button
            type="button"
            onClick={exportGoalSchedule}
            disabled={sessions.length === 0}
            className="rounded-xl bg-sky px-4 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            \u540c\u6b65\u8be5\u76ee\u6807\u5b89\u6392\u5230\u65e5\u5386 (.ics)
          </button>
        </div>

        <p className="mt-3 rounded-xl border border-sky/40 bg-sky/15 p-3 text-xs text-ink/75">
          \u9ec4\u91d1\u65f6\u6bb5\u5165\u53e3\u5df2\u9884\u7559\uff0c\u540e\u7eed\u53ef\u6839\u636e\u9ad8\u6548\u65f6\u6bb5\u4f18\u5148\u5b89\u6392\u9ad8\u4ef7\u503c\u4efb\u52a1\u3002
        </p>
      </section>

      <section className="card-surface p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title">\u65f6\u95f4\u5b89\u6392\u533a</h3>
          <span className="badge border-ink/15 bg-white text-ink/65">{sessions.length} \u4e2a session</span>
        </div>

        {sessions.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {sessions.map((session) => (
              <li key={session.id} className="rounded-xl border border-ink/10 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{session.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="badge border-ink/15 bg-white text-ink/65">{sessionStatusLabel[session.status]}</span>
                    <span
                      className={`badge ${
                        session.syncedToCalendar
                          ? "border-sky/40 bg-sky/15 text-ink/75"
                          : "border-ink/15 bg-white text-ink/60"
                      }`}
                    >
                      {session.syncedToCalendar ? "\u5df2\u540c\u6b65\u65e5\u5386" : "\u672a\u540c\u6b65\u65e5\u5386"}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink/70">
                  {formatDateLabel(session.date)} \u00b7 {session.startTime} - {session.endTime} \u00b7 {session.durationMinutes} \u5206\u949f
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink/60">
            \u6682\u65e0 session\uff0c\u70b9\u51fb\u201c\u4e3a\u6211\u5b89\u6392\u65f6\u95f4\u201d\u5373\u53ef\u81ea\u52a8\u62c6\u5206\u4e3a\u53ef\u6267\u884c\u65f6\u95f4\u5757\u3002
          </p>
        )}
      </section>

      <section className="card-surface p-4 md:p-5">
        <h3 className="section-title">SMART \u5185\u5bb9</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80">
            <strong>S:</strong> {currentGoal.smart.specific || "\u672a\u586b\u5199"}
          </p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80">
            <strong>M:</strong> {currentGoal.smart.measurable || "\u672a\u586b\u5199"}
          </p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80">
            <strong>A:</strong> {currentGoal.smart.achievable || "\u672a\u586b\u5199"}
          </p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80">
            <strong>R:</strong> {currentGoal.smart.relevant || "\u672a\u586b\u5199"}
          </p>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/80 md:col-span-2">
            <strong>T:</strong> {currentGoal.smart.timeBound || "\u672a\u586b\u5199"}
          </p>
        </div>
      </section>
    </div>
  );
}
