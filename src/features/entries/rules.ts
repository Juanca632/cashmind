/**
 * Entry domain logic. Pure functions, no React and no storage.
 * Dates are local-time day keys 'YYYY-MM-DD'; months are 'YYYY-MM'. Money is integer cents.
 */
import { ENTRY_KINDS, type EntryKind } from '@/shared/kinds';
import { AMOUNT_TOO_LARGE, isValidCents } from '@/shared/money';
import { dayKey, isValidDayKey } from '@/shared/days';
import { isValidMonthKey, monthKey } from '@/shared/months';

export type Entry = {
  id: number;
  date: string;
  kind: EntryKind;
  amountCents: number;
  note: string;
};

export type EntryInput = Omit<Entry, 'id'>;

export type EntryError = 'amount-not-positive' | 'amount-too-large' | 'kind-invalid' | 'date-invalid';

export function validateEntry(input: EntryInput, today: Date): EntryError[] {
  const errors: EntryError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  else if (!isValidCents(input.amountCents)) errors.push('amount-too-large');
  if (!ENTRY_KINDS.includes(input.kind)) errors.push('kind-invalid');
  if (!isValidDayKey(input.date) || input.date > dayKey(today)) errors.push('date-invalid');
  return errors;
}

export const ENTRY_MISSING = 'This entry no longer exists.';

export function entryErrorMessage(error: EntryError): string {
  switch (error) {
    case 'amount-not-positive':
      return 'The amount must be greater than 0 €.';
    case 'amount-too-large':
      return AMOUNT_TOO_LARGE;
    case 'kind-invalid':
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
export function defaultEntryDate(month: string | undefined, today: Date): string {
  return isValidMonthKey(month) && month < monthKey(today) ? lastDayOfMonth(month) : dayKey(today);
}

export function totalsByKind(entries: readonly Pick<Entry, 'kind' | 'amountCents'>[]): Record<EntryKind, number> {
  const totals: Record<EntryKind, number> = { income: 0, savings: 0, expense: 0 };
  for (const entry of entries) totals[entry.kind] += entry.amountCents;
  return totals;
}

/** How many entries home lists before linking to the whole month. */
export const HOME_LIST_SIZE = 5;

/** The entries of one kind, in the same order; null keeps every entry. */
export function entriesOfKind<T extends Pick<Entry, 'kind'>>(entries: readonly T[], kind: EntryKind | null): T[] {
  return kind === null ? [...entries] : entries.filter((entry) => entry.kind === kind);
}

/** The first `size` entries and how many there are in all. */
export function firstEntries<T>(entries: readonly T[], size: number): { shown: T[]; total: number } {
  return { shown: entries.slice(0, size), total: entries.length };
}

/** True for a kind of entry; used to read a kind from route params. */
export function isEntryKind(value: unknown): value is EntryKind {
  return typeof value === 'string' && (ENTRY_KINDS as readonly string[]).includes(value);
}

/** What a list filtered to one kind says when the month has none of it. */
export const EMPTY_KIND_TEXTS: Record<EntryKind, string> = {
  income: 'No income this month.',
  savings: 'No savings this month.',
  expense: 'No expenses this month.',
};
