/**
 * Expense domain logic. Pure functions, no React and no storage.
 * Dates are local-time day keys 'YYYY-MM-DD'; months are 'YYYY-MM'. Money is integer cents.
 */
import { ENTRY_BUCKETS, type EntryBucket } from '@/shared/buckets';
import { AMOUNT_TOO_LARGE, isValidCents } from '@/shared/money';
import { dayKey, isValidDayKey } from '@/shared/days';
import { isValidMonthKey, monthKey } from '@/shared/months';

export type Expense = {
  id: number;
  date: string;
  bucket: EntryBucket;
  amountCents: number;
  note: string;
};

export type ExpenseInput = Omit<Expense, 'id'>;

export type ExpenseError = 'amount-not-positive' | 'amount-too-large' | 'bucket-invalid' | 'date-invalid';

export function validateExpense(input: ExpenseInput, today: Date): ExpenseError[] {
  const errors: ExpenseError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  else if (!isValidCents(input.amountCents)) errors.push('amount-too-large');
  if (!ENTRY_BUCKETS.includes(input.bucket)) errors.push('bucket-invalid');
  if (!isValidDayKey(input.date) || input.date > dayKey(today)) errors.push('date-invalid');
  return errors;
}

export const EXPENSE_MISSING = 'This entry no longer exists.';

export function expenseErrorMessage(error: ExpenseError): string {
  switch (error) {
    case 'amount-not-positive':
      return 'The amount must be greater than 0 €.';
    case 'amount-too-large':
      return AMOUNT_TOO_LARGE;
    case 'bucket-invalid':
      return 'Pick income, savings or expense.';
    case 'date-invalid':
      return 'Pick a date that is not in the future.';
  }
}

/** Last day of a month 'YYYY-MM'. */
export function lastDayOfMonth(month: string): string {
  return dayKey(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0));
}

/** Today, or the last day of the requested month when adding to a past month. */
export function defaultExpenseDate(month: string | undefined, today: Date): string {
  return isValidMonthKey(month) && month < monthKey(today) ? lastDayOfMonth(month) : dayKey(today);
}

export function totalsByBucket(expenses: readonly Pick<Expense, 'bucket' | 'amountCents'>[]): Record<EntryBucket, number> {
  const totals: Record<EntryBucket, number> = { income: 0, savings: 0, expense: 0 };
  for (const expense of expenses) totals[expense.bucket] += expense.amountCents;
  return totals;
}

