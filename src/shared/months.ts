/** Months are local-time keys 'YYYY-MM'. */

/** Month key in the device's local time zone, e.g. '2026-11'. */
export function monthKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

export function isPastMonth(month: string, currentMonth: string): boolean {
  return month < currentMonth;
}

export function isValidMonthKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function yearOf(month: string): number {
  return Number(month.slice(0, 4));
}

/** The twelve month keys of a year, January first. */
export function monthsOfYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

/** Local date for the first day of a month key, for display. */
export function monthStart(month: string): Date {
  return new Date(yearOf(month), Number(month.slice(5, 7)) - 1, 1);
}

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'November 2026' */
export function formatMonth(month: string): string {
  return monthFormatter.format(monthStart(month));
}

/** 'Nov' */
export function formatShortMonth(month: string): string {
  return SHORT_MONTHS[Number(month.slice(5, 7)) - 1];
}

export function previousMonth(month: string): string {
  return monthKey(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 2, 1));
}
