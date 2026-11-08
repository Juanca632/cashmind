/**
 * Expense domain logic. Pure functions, no React and no storage.
 * Dates are local-time day keys 'YYYY-MM-DD'; months are 'YYYY-MM'. Money is integer cents.
 */
import { BUCKETS, type Bucket } from '@/shared/buckets';
import { AMOUNT_TOO_LARGE, isValidCents } from '@/shared/money';
import { addDays, dayKey, formatDay, isValidDayKey } from '@/shared/days';
import { isValidMonthKey, monthKey, previousMonth } from '@/shared/months';

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

export type ExpenseError = 'amount-not-positive' | 'amount-too-large' | 'bucket-invalid' | 'date-not-editable';

export function validateExpense(input: ExpenseInput, today: Date): ExpenseError[] {
  const errors: ExpenseError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  else if (!isValidCents(input.amountCents)) errors.push('amount-too-large');
  if (!BUCKETS.includes(input.bucket)) errors.push('bucket-invalid');
  if (!isValidDayKey(input.date) || input.date < firstEditableDay(today) || input.date > dayKey(today)) {
    errors.push('date-not-editable');
  }
  return errors;
}

export const EXPENSE_MISSING = 'This expense no longer exists.';
export const MONTH_LOCKED = 'Expenses of this month can no longer be changed.';

export function expenseErrorMessage(error: ExpenseError, today: Date): string {
  switch (error) {
    case 'amount-not-positive':
      return 'The amount must be greater than 0 €.';
    case 'amount-too-large':
      return AMOUNT_TOO_LARGE;
    case 'bucket-invalid':
      return 'Pick one of the categories.';
    case 'date-not-editable':
      return `Pick a date between ${formatDay(firstEditableDay(today))} and today.`;
  }
}

/** Today, or the last day of the requested month when adding to the previous month during the grace period. */
export function defaultExpenseDate(month: string | undefined, today: Date): string {
  if (!isValidMonthKey(month) || month === monthKey(today) || !isExpenseMonthEditable(month, today)) {
    return dayKey(today);
  }
  return addDays(`${monthKey(today)}-01`, -1);
}

export function totalsByBucket(expenses: readonly Pick<Expense, 'bucket' | 'amountCents'>[]): Record<Bucket, number> {
  const totals: Record<Bucket, number> = { fixed: 0, leisure: 0, savings: 0 };
  for (const expense of expenses) totals[expense.bucket] += expense.amountCents;
  return totals;
}

