import { differenceInCalendarDays, format, isToday, isTomorrow, isYesterday } from "date-fns";

export function formatTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE LLL d");
}

export function relativeDue(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = differenceInCalendarDays(d, now);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return `${days}d`;
  return `${Math.abs(days)}d ago`;
}

export function formatPRAge(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const ms = now.getTime() - d.getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}
