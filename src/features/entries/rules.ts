/**
 * Entry domain logic. Pure functions, no React and no storage.
 * Dates are local-time day keys 'YYYY-MM-DD'; months are 'YYYY-MM'. Money is integer cents.
 */
import { CATEGORIES, CATEGORY_LABELS, isCategoryOf, type EntryCategory } from '@/features/entries/categories';
import { ENTRY_KINDS, KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { AMOUNT_TOO_LARGE, isValidCents } from '@/shared/money';
import { addDays, dayKey, dayToDate, isValidDayKey } from '@/shared/days';
import { isValidMonthKey, monthKey } from '@/shared/months';

export type Entry = {
  id: number;
  date: string;
  kind: EntryKind;
  amountCents: number;
  note: string;
  category: EntryCategory;
  /** The monthly item this entry was recorded by or marked from; null when it never repeated. */
  recurringId: number | null;
};

export type EntryInput = Omit<Entry, 'id' | 'recurringId'>;

/** An entry that is recorded again on the 1st of every new month until it is stopped. */
export type RecurringItem = {
  id: number;
  kind: EntryKind;
  category: EntryCategory;
  amountCents: number;
  note: string;
  active: boolean;
  /** The latest month 'YYYY-MM' that already has this item's entry. */
  lastMonth: string;
};

/** What can change on a monthly item; its kind is fixed. */
export type RecurringInput = Pick<RecurringItem, 'category' | 'amountCents' | 'note'>;

export const RECURRING_MISSING = 'This monthly entry no longer exists.';

/** The same amount and category checks as an entry, for the item's fixed kind. */
export function validateRecurring(kind: EntryKind, input: RecurringInput): EntryError[] {
  const errors: EntryError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  else if (!isValidCents(input.amountCents)) errors.push('amount-too-large');
  if (!isCategoryOf(kind, input.category)) errors.push('category-invalid');
  return errors;
}

/** What the monthly expenses add up to; repeating income and savings are not costs. */
export function fixedCostsCents(items: readonly Pick<RecurringItem, 'kind' | 'amountCents' | 'active'>[]): number {
  return items.reduce((sum, item) => (item.active && item.kind === 'expense' ? sum + item.amountCents : sum), 0);
}

export type EntryError = 'amount-not-positive' | 'amount-too-large' | 'kind-invalid' | 'date-invalid' | 'category-invalid';

export function validateEntry(input: EntryInput, today: Date): EntryError[] {
  const errors: EntryError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  else if (!isValidCents(input.amountCents)) errors.push('amount-too-large');
  if (!ENTRY_KINDS.includes(input.kind)) errors.push('kind-invalid');
  else if (!isCategoryOf(input.kind, input.category)) errors.push('category-invalid');
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
    case 'category-invalid':
      return 'Pick a category for this kind.';
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

/** One category's part of a kind's total for the month. */
export type CategoryShare = { category: EntryCategory; cents: number; percent: number };

/**
 * A kind's entries added up by category, largest first (ties in list order), with each one's whole
 * percentage of the kind's total rounded to the nearest. Empty when the kind has no entries.
 */
export function categorySplit(entries: readonly Pick<Entry, 'kind' | 'amountCents' | 'category'>[], kind: EntryKind): CategoryShare[] {
  const order = CATEGORIES[kind];
  const cents = new Map<EntryCategory, number>();
  let total = 0;
  for (const entry of entries) {
    if (entry.kind !== kind) continue;
    cents.set(entry.category, (cents.get(entry.category) ?? 0) + entry.amountCents);
    total += entry.amountCents;
  }
  return [...cents]
    .map(([category, sum]) => ({ category, cents: sum, percent: Math.round((sum * 100) / total) }))
    .sort((a, b) => b.cents - a.cents || order.indexOf(a.category) - order.indexOf(b.category));
}

/** What a row is called: its note, else its category, else (Other) its kind. */
export function entryTitle(entry: Pick<Entry, 'kind' | 'category' | 'note'>): string {
  if (entry.note) return entry.note;
  return entry.category === 'other' ? KIND_LABELS[entry.kind] : CATEGORY_LABELS[entry.category];
}

/** How far back the form looks for expenses to suggest, in days including today. */
export const QUICK_ADD_DAYS = 60;
/** How many times an expense must have been recorded in that period to be suggested. */
export const QUICK_ADD_MIN = 2;
/** How many suggestions the form shows at most. */
export const QUICK_ADD_MAX = 4;

/** An expense the user records often: the values the form is filled with, and how often it was recorded. */
export type QuickAddSuggestion = Pick<Entry, 'category' | 'amountCents' | 'note'> & { count: number; lastDate: string };

/**
 * The expenses recorded at least QUICK_ADD_MIN times in the last QUICK_ADD_DAYS days (same category,
 * amount and exact note), most often first, then most recent; at most QUICK_ADD_MAX. Entries recorded
 * by a monthly repeat are left out, since the app records them by itself.
 */
export function quickAddSuggestions(entries: readonly Entry[], today: Date): QuickAddSuggestion[] {
  const last = dayKey(today);
  const first = addDays(last, -(QUICK_ADD_DAYS - 1));
  const groups = new Map<string, QuickAddSuggestion>();
  for (const entry of entries) {
    if (entry.kind !== 'expense' || entry.recurringId !== null || entry.date < first || entry.date > last) continue;
    const key = JSON.stringify([entry.category, entry.amountCents, entry.note]);
    const group = groups.get(key);
    if (group) {
      group.count += 1;
      if (entry.date > group.lastDate) group.lastDate = entry.date;
    } else {
      groups.set(key, { category: entry.category, amountCents: entry.amountCents, note: entry.note, count: 1, lastDate: entry.date });
    }
  }
  return [...groups.values()]
    .filter((group) => group.count >= QUICK_ADD_MIN)
    .sort((a, b) => b.count - a.count || (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0))
    .slice(0, QUICK_ADD_MAX);
}

/** The months ('YYYY-MM') that hold the days quickAddSuggestions looks at. */
export function quickAddRange(today: Date): { from: string; to: string } {
  return { from: monthKey(dayToDate(addDays(dayKey(today), -(QUICK_ADD_DAYS - 1)))), to: monthKey(today) };
}
