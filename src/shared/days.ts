/** Days are local-time keys 'YYYY-MM-DD'. */
import { monthKey } from '@/shared/months';

export function dayKey(date: Date): string {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The local date of a day key, at midnight. */
export function dayToDate(day: string): Date {
  return new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
}

export function isValidDayKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayKey(dayToDate(value)) === value;
}

export function addDays(day: string, days: number): string {
  const date = dayToDate(day);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

const dayFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** 'Mon 3 Nov' */
export function formatDay(day: string): string {
  return dayFormatter.format(dayToDate(day));
}
