/** How a month is going against the plan. Pure logic, money in integer cents. */
import { savingsGoal } from '@/features/plan/rules';
import type { EntryKind } from '@/shared/kinds';
import { monthKey } from '@/shared/months';

export type MonthSummary = {
  income: number;
  saved: number;
  spent: number;
  /** What the plan asks to save this month. */
  goal: number;
  /** What can still be spent: negative when more was spent than there is. */
  left: number;
};

/**
 * One rule for every month: the goal is the percentage of the income, and left to spend is the
 * income plus what was moved into Main from pockets, minus what was spent and minus the larger of
 * the goal and what was saved. Moved money is neither income nor savings, so the goal does not
 * change (specs/028-move-money).
 */
export function monthSummary(totals: Record<EntryKind, number>, savingsPercent: number, movedInCents = 0): MonthSummary {
  const { income, savings: saved, expense: spent } = totals;
  const goal = savingsGoal(income, savingsPercent);
  return { income, saved, spent, goal, left: income + movedInCents - spent - Math.max(goal, saved) };
}

/** What can be spent each remaining day of the current month, today included. */
export type DailyAllowance = { cents: number; daysLeft: number };

/**
 * Left to spend shared over the days left in the month, today included, rounded down to the cent
 * so following it never overspends. Null in other months than today's or with nothing left.
 */
export function dailyAllowance(leftCents: number, today: Date, month: string): DailyAllowance | null {
  if (month !== monthKey(today) || leftCents <= 0) return null;
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - today.getDate() + 1;
  return { cents: Math.floor(leftCents / daysLeft), daysLeft };
}

/** The month's spending day by day against the plan's pace. Money in cents; days are 1-based. */
export type SpendingPace = {
  daysInMonth: number;
  /** The last day drawn: today in the current month, else the month's last day. */
  lastDay: number;
  /** Expenses added up to the end of each day, from the 1st to `lastDay`. */
  steps: { day: number; cents: number }[];
  /** Where the pace line starts: the month's expenses that repeat every month. */
  startCents: number;
  /** Where it ends: what the month can spend, never below the start. */
  endCents: number;
  /** Spent up to `lastDay`. */
  spentCents: number;
  /** The pace at the end of today; null in a past month. */
  paceTodayCents: number | null;
};

type PaceEntry = { date: string; kind: EntryKind; amountCents: number; recurringId: number | null };

/** The pace line at the end of day `day`: a straight line from the start to the end of the month. */
export function paceAt(pace: Pick<SpendingPace, 'startCents' | 'endCents' | 'daysInMonth'>, day: number): number {
  return pace.startCents + Math.floor(((pace.endCents - pace.startCents) * day) / pace.daysInMonth);
}

/**
 * One rule for the curve and the line: both start from the expenses that repeat every month (they
 * are recorded on the 1st), so fixed costs never make the month look ahead of its pace. The line
 * ends at what the month can spend: the income minus the larger of the goal and what was saved.
 */
export function spendingPace(entries: readonly PaceEntry[], spendableCents: number, month: string, today: Date): SpendingPace {
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const isCurrent = month === monthKey(today);
  const lastDay = isCurrent ? today.getDate() : daysInMonth;

  const byDay = new Array<number>(daysInMonth + 1).fill(0);
  let startCents = 0;
  for (const entry of entries) {
    if (entry.kind !== 'expense' || entry.date.slice(0, 7) !== month) continue;
    byDay[Number(entry.date.slice(8, 10))] += entry.amountCents;
    if (entry.recurringId !== null) startCents += entry.amountCents;
  }

  const steps: SpendingPace['steps'] = [];
  let total = 0;
  for (let day = 1; day <= lastDay; day++) {
    total += byDay[day];
    steps.push({ day, cents: total });
  }

  const endCents = Math.max(startCents, spendableCents);
  const pace = { startCents, endCents, daysInMonth };
  return {
    daysInMonth,
    lastDay,
    steps,
    startCents,
    endCents,
    spentCents: total,
    paceTodayCents: isCurrent ? paceAt(pace, lastDay) : null,
  };
}

/** Spent so far against the pace, in neutral words. */
export function paceSentence(spentCents: number, paceCents: number, format: (cents: number) => string): string {
  if (spentCents === paceCents) return 'Right on your pace';
  return spentCents > paceCents
    ? `${format(spentCents - paceCents)} over your pace`
    : `${format(paceCents - spentCents)} under your pace`;
}
