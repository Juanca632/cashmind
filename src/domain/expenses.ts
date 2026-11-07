/**
 * Expense domain logic. Pure functions, no React and no storage.
 * Dates are local-time day keys 'YYYY-MM-DD'; months are 'YYYY-MM'. Money is integer cents.
 */
import { BUCKETS, monthKey, type Bucket } from '@/domain/income-plan';

export type Expense = {
  id: number;
  date: string;
  bucket: Bucket;
  amountCents: number;
  note: string;
};

export type ExpenseInput = Omit<Expense, 'id'>;

/** Days at the start of a month during which the previous month's expenses can still be changed. */
export const GRACE_DAYS = 5;

export function dayKey(date: Date): string {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayToDate(day: string): Date {
  return new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
}

export function addDays(day: string, days: number): string {
  const date = dayToDate(day);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

export function previousMonth(month: string): string {
  return monthKey(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 2, 1));
}

/** 'Mon 3 Nov' */
export function formatDay(day: string): string {
  return dayFormatter.format(dayToDate(day));
}

const dayFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** Expenses can change in the current month, and in the previous one during the first days of the month. */
export function isExpenseMonthEditable(month: string, today: Date): boolean {
  const current = monthKey(today);
  if (month === current) return true;
  return month === previousMonth(current) && today.getDate() <= GRACE_DAYS;
}

/** First day an expense can be dated today (1st of the previous month during the grace period). */
export function firstEditableDay(today: Date): string {
  const current = monthKey(today);
  const firstMonth = isExpenseMonthEditable(previousMonth(current), today) ? previousMonth(current) : current;
  return `${firstMonth}-01`;
}

export type ExpenseError = 'amount-not-positive' | 'bucket-invalid' | 'date-not-editable';

export function validateExpense(input: ExpenseInput, today: Date): ExpenseError[] {
  const errors: ExpenseError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  if (!BUCKETS.includes(input.bucket)) errors.push('bucket-invalid');
  const isRealDay = /^\d{4}-\d{2}-\d{2}$/.test(input.date) && dayKey(dayToDate(input.date)) === input.date;
  if (!isRealDay || input.date < firstEditableDay(today) || input.date > dayKey(today)) {
    errors.push('date-not-editable');
  }
  return errors;
}

export function totalsByBucket(expenses: readonly Pick<Expense, 'bucket' | 'amountCents'>[]): Record<Bucket, number> {
  const totals: Record<Bucket, number> = { fixed: 0, leisure: 0, savings: 0 };
  for (const expense of expenses) totals[expense.bucket] += expense.amountCents;
  return totals;
}

export type BucketProgress = {
  spent: number;
  target: number;
  /** What is left to spend (fixed, leisure) or to save (savings). */
  left: number;
  /** How much the recorded amount is above the target. */
  over: number;
};

export function bucketProgress(spent: number, target: number): BucketProgress {
  return { spent, target, left: Math.max(target - spent, 0), over: Math.max(spent - target, 0) };
}
