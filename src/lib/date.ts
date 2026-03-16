const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(date: Date, offset: number): Date {
  return new Date(date.getTime() + offset * DAY_MS);
}

export function diffInDays(start: Date, end: Date): number {
  const startSafe = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endSafe = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endSafe.getTime() - startSafe.getTime()) / DAY_MS);
}

export function formatDateLabel(dateKey: string): string {
  const date = fromDateKey(dateKey);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function formatFullDate(dateKey: string): string {
  const date = fromDateKey(dateKey);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(copy, mondayOffset);
}

export function getWeekDates(baseDate: Date): string[] {
  const monday = startOfWeek(baseDate);
  return Array.from({ length: 7 }).map((_, index) => toDateKey(addDays(monday, index)));
}

export function getMonthGrid(baseDate: Date): string[] {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const firstWeekDay = firstDay.getDay();
  const offset = firstWeekDay === 0 ? 6 : firstWeekDay - 1;
  const gridStart = addDays(firstDay, -offset);

  return Array.from({ length: 42 }).map((_, index) => toDateKey(addDays(gridStart, index)));
}

export function isSameMonth(dateKey: string, baseDate: Date): boolean {
  const date = fromDateKey(dateKey);
  return date.getMonth() === baseDate.getMonth() && date.getFullYear() === baseDate.getFullYear();
}

export function addMinutes(time: string, durationMinutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const totalMinutes = hour * 60 + minute + durationMinutes;
  const safeHour = Math.floor(totalMinutes / 60) % 24;
  const safeMinute = totalMinutes % 60;
  return `${`${safeHour}`.padStart(2, "0")}:${`${safeMinute}`.padStart(2, "0")}`;
}

export function sortByDate<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}

export function calcStreak(dates: string[]): number {
  const unique = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let cursor = new Date();

  for (const dateKey of unique) {
    const expected = toDateKey(cursor);
    if (dateKey !== expected) {
      break;
    }
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
