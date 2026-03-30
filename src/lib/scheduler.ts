import { addDays, addMinutes, diffInDays, fromDateKey, toDateKey, todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { Goal, GoalSession, PreferredTimeOfDay } from "@/lib/types";

const START_TIME_MAP: Record<PreferredTimeOfDay, string> = {
  morning: "08:00",
  afternoon: "14:00",
  evening: "19:00",
  flexible: "18:00",
};

export interface GoalScheduleStats {
  scheduledMinutes: number;
  unscheduledMinutes: number;
  totalMinutes: number;
}

/**
 * MVP 排程规则（后续可替换为更细化规则）：
 * 1. 依据总时长和单次时长拆分 session
 * 2. 按截止日前可用天数尽量均匀分布
 * 3. 按偏好时段给默认开始时间
 */
export function generateGoalSessions(goal: Goal): GoalSession[] {
  const totalMinutes = Math.max(0, Math.round(goal.estimatedTotalHours * 60));
  const perSession = Math.max(15, goal.suggestedSessionMinutes || 60);

  if (totalMinutes <= 0) {
    return [];
  }

  const sessionCount = Math.ceil(totalMinutes / perSession);
  const deadlineDate = fromDateKey(goal.deadline);
  const todayDate = fromDateKey(todayKey());
  const availableDays = Math.max(1, diffInDays(todayDate, deadlineDate) + 1);
  const dayStep = Math.max(1, Math.floor(availableDays / sessionCount));

  let consumed = 0;
  const sessions: GoalSession[] = [];

  for (let index = 0; index < sessionCount; index += 1) {
    const plannedDate = addDays(todayDate, Math.min(index * dayStep, availableDays - 1));
    const date = toDateKey(plannedDate);
    const durationMinutes = Math.min(perSession, totalMinutes - consumed);
    consumed += durationMinutes;

    const startTime = START_TIME_MAP[goal.preferredTimeOfDay || "evening"];
    const endTime = addMinutes(startTime, durationMinutes);

    sessions.push({
      id: createId("session"),
      goalId: goal.id,
      title: `${goal.title} 专注时段 ${index + 1}`,
      date,
      startTime,
      endTime,
      durationMinutes,
      status: "planned",
      syncedToCalendar: false,
    });
  }

  return sessions;
}

export function getGoalScheduleStats(goal: Goal, sessions: GoalSession[]): GoalScheduleStats {
  const totalMinutes = Math.max(0, Math.round(goal.estimatedTotalHours * 60));
  const scheduledMinutes = sessions
    .filter((session) => session.goalId === goal.id)
    .reduce((sum, session) => sum + session.durationMinutes, 0);

  return {
    totalMinutes,
    scheduledMinutes,
    unscheduledMinutes: Math.max(0, totalMinutes - scheduledMinutes),
  };
}
