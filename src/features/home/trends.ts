/** The last months side by side, for the Trends screen. Pure logic, money in integer cents. */
import type { EntryCategory } from '@/features/entries/categories';
import { savingsGoal, savingsPercentFor, type PlanVersion } from '@/features/plan/rules';
import type { EntryKind } from '@/shared/kinds';

/** How many months Trends shows, the current one included. */
export const TREND_MONTHS = 6;

/** The pills of Trends, in order; Spent is selected when the screen opens. */
export const TREND_PILLS: readonly { kind: EntryKind; label: string }[] = [
  { kind: 'expense', label: 'Spent' },
  { kind: 'savings', label: 'Saved' },
  { kind: 'income', label: 'Income' },
];

type TrendEntry = { date: string; kind: EntryKind; amountCents: number; category: EntryCategory };

export type MonthTotal = { month: string; cents: number };

/** Each month's total of one kind, or of one of its categories, in the order of `months`. */
export function monthTotals(entries: readonly TrendEntry[], months: readonly string[], kind: EntryKind, category?: EntryCategory): MonthTotal[] {
  const cents = new Map(months.map((month) => [month, 0]));
  for (const entry of entries) {
    if (entry.kind !== kind || (category !== undefined && entry.category !== category)) continue;
    const month = entry.date.slice(0, 7);
    const sum = cents.get(month);
    if (sum !== undefined) cents.set(month, sum + entry.amountCents);
  }
  return months.map((month) => ({ month, cents: cents.get(month) ?? 0 }));
}

/** The months that have at least one entry of any kind: the months the app was in use. */
export function monthsInUse(entries: readonly Pick<TrendEntry, 'date'>[]): Set<string> {
  return new Set(entries.map((entry) => entry.date.slice(0, 7)));
}

/**
 * One rule for every average: the months before the current one that were in use, added up and
 * shared, rounded down to the cent. The unfinished current month and the months before the user
 * started are left out. Null when there is no such month or the average is 0.
 */
export function trendAverage(totals: readonly MonthTotal[], inUse: ReadonlySet<string>, currentMonth: string): number | null {
  const counted = totals.filter((total) => total.month < currentMonth && inUse.has(total.month));
  if (counted.length === 0) return null;
  const average = Math.floor(counted.reduce((sum, total) => sum + total.cents, 0) / counted.length);
  return average > 0 ? average : null;
}

/**
 * A month against the average, in neutral words: "X more than your average", "X less than usual",
 * or "About your average" when the difference is at most 5 % of the average. In the current month
 * it starts with "So far, ".
 */
export function averageSentence(
  cents: number,
  average: number,
  isCurrent: boolean,
  format: (cents: number) => string,
  word: 'your average' | 'usual',
): string {
  const difference = cents - average;
  const text =
    Math.abs(difference) * 20 <= average
      ? `About ${word}`
      : `${format(Math.abs(difference))} ${difference > 0 ? 'more' : 'less'} than ${word}`;
  return isCurrent ? `So far, ${text.charAt(0).toLowerCase()}${text.slice(1)}` : text;
}

/** A month's savings goal: null when the month has no income or a 0 % plan. */
export type MonthGoal = { month: string; goal: number | null; reached: boolean };

/** Each month's goal, by the same rule as home: its plan percentage of its income. */
export function savingsGoals(
  entries: readonly TrendEntry[],
  months: readonly string[],
  versions: readonly PlanVersion[],
  unitCents = 1,
): MonthGoal[] {
  const income = monthTotals(entries, months, 'income');
  const saved = monthTotals(entries, months, 'savings');
  return months.map((month, i) => {
    const goal = savingsGoal(income[i].cents, savingsPercentFor(versions, month), unitCents);
    return goal > 0 ? { month, goal, reached: saved[i].cents >= goal } : { month, goal: null, reached: false };
  });
}

/** How many of the months with a goal reached it: a count, never a streak. */
export function goalCount(goals: readonly MonthGoal[]): { reached: number; of: number } {
  const withGoal = goals.filter((goal) => goal.goal !== null);
  return { reached: withGoal.filter((goal) => goal.reached).length, of: withGoal.length };
}
