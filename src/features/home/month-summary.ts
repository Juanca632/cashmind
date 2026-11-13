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
 * income minus what was spent and minus the larger of the goal and what was saved.
 */
export function monthSummary(totals: Record<EntryKind, number>, savingsPercent: number): MonthSummary {
  const { income, savings: saved, expense: spent } = totals;
  const goal = savingsGoal(income, savingsPercent);
  return { income, saved, spent, goal, left: income - spent - Math.max(goal, saved) };
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
