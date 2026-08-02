/**
 * Date Utilities for Calorify (Local YYYY-MM-DD formatting)
 */

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateString(date);
}

export function formatDisplayDate(dateStr: string): string {
  const today = getTodayDateString();
  const yesterday = addDays(today, -1);

  if (dateStr === today) {
    return "Today";
  }
  if (dateStr === yesterday) {
    return "Yesterday";
  }

  const date = parseDateString(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatFullDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function isFutureDate(dateStr: string): boolean {
  return dateStr > getTodayDateString();
}

/**
 * Returns last N days up to today as an array of YYYY-MM-DD strings
 */
export function getLastNDays(n: number = 7, endDateStr?: string): string[] {
  const end = endDateStr || getTodayDateString();
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(addDays(end, -i));
  }
  return dates;
}
