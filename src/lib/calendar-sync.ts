import { addDays, addMinutes, fromDateKey, toDateKey, todayKey } from "@/lib/date";
import { CalendarEvent, Goal, GoalSession, Task } from "@/lib/types";

function pad(value: number): string {
  return `${value}`.padStart(2, "0");
}

function dateTimeFrom(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function toIcsDateTime(dateTime: string): string {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function createUid(event: CalendarEvent): string {
  return `${event.sourceType}-${event.sourceId}-${event.id}@student-goal-time-manager`;
}

function inferTaskTime(task: Task): { startTime: string; endTime: string; isPlaceholder: boolean } {
  if (task.startTime && task.endTime) {
    return {
      startTime: task.startTime,
      endTime: task.endTime,
      isPlaceholder: false,
    };
  }

  const duration = task.durationMinutes ?? 45;
  const defaultStart = task.planType === "weekly" ? "19:00" : "18:00";
  return {
    startTime: defaultStart,
    endTime: addMinutes(defaultStart, duration),
    isPlaceholder: true,
  };
}

export function mapTasksToCalendarEvents(
  tasks: Task[],
  options: {
    includeUnscheduled?: boolean;
    titlePrefix?: string;
  } = {},
): CalendarEvent[] {
  const includeUnscheduled = options.includeUnscheduled ?? false;
  const titlePrefix = options.titlePrefix ? `${options.titlePrefix} ` : "";

  return tasks
    .filter((task) => (includeUnscheduled ? true : Boolean(task.isScheduled && task.startTime && task.endTime)))
    .map((task) => {
      const timing = inferTaskTime(task);
      const descriptionLines = [
        task.description || "",
        `planType: ${task.planType}`,
        timing.isPlaceholder
          ? "MVP note: no explicit task time was set, so a default slot is used in this export."
          : "",
      ].filter(Boolean);

      return {
        id: `evt_task_${task.id}`,
        title: `${titlePrefix}${task.title}`,
        startDateTime: dateTimeFrom(task.dueDate, timing.startTime),
        endDateTime: dateTimeFrom(task.dueDate, timing.endTime),
        description: descriptionLines.join("\n"),
        sourceType: "task",
        sourceId: task.id,
        syncStatus: task.syncedToCalendar ? "synced" : "not_synced",
      };
    });
}

export function mapGoalSessionsToCalendarEvents(
  sessions: GoalSession[],
  goalTitleById: Map<string, string>,
): CalendarEvent[] {
  return sessions.map((session) => ({
    id: `evt_session_${session.id}`,
    title: session.title,
    startDateTime: dateTimeFrom(session.date, session.startTime),
    endDateTime: dateTimeFrom(session.date, session.endTime),
    description: `Goal: ${goalTitleById.get(session.goalId) ?? session.goalId}`,
    sourceType: "goal_session",
    sourceId: session.id,
    syncStatus: session.syncedToCalendar ? "synced" : "not_synced",
  }));
}

export function buildGoalDeadlineReminderEvents(goals: Goal[]): CalendarEvent[] {
  const today = fromDateKey(todayKey());

  return goals
    .filter((goal) => goal.status !== "completed")
    .map((goal) => {
      const deadline = fromDateKey(goal.deadline);
      const reminderDate = deadline > today ? toDateKey(addDays(deadline, -1)) : goal.deadline;

      return {
        id: `evt_deadline_${goal.id}`,
        title: `Deadline Reminder: ${goal.title}`,
        startDateTime: dateTimeFrom(reminderDate, "20:00"),
        endDateTime: dateTimeFrom(reminderDate, "20:15"),
        description: `Goal deadline: ${goal.deadline}`,
        sourceType: "goal_deadline",
        sourceId: goal.id,
        syncStatus: "not_synced",
      };
    });
}

export function exportToICS(events: CalendarEvent[], calendarName: string): string {
  const nowStamp = toIcsDateTime(new Date().toISOString());
  const body = events
    .map((event) => {
      const lines = [
        "BEGIN:VEVENT",
        `UID:${createUid(event)}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${toIcsDateTime(event.startDateTime)}`,
        `DTEND:${toIcsDateTime(event.endDateTime)}`,
        `SUMMARY:${escapeIcsText(event.title)}`,
      ];

      if (event.description) {
        lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
      }

      if (event.location) {
        lines.push(`LOCATION:${escapeIcsText(event.location)}`);
      }

      lines.push("END:VEVENT");
      return lines.join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Student Goal Time Manager//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    body,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(fileName: string, icsContent: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".ics") ? fileName : `${fileName}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);

  // Future extension: replace file export with direct Google/Apple/Outlook Calendar API sync.
}
