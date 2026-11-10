/** How a month is going against the plan. Pure logic, money in integer cents. */
import { savingsGoal } from '@/features/plan/rules';
import type { EntryBucket } from '@/shared/buckets';

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
export function monthSummary(totals: Record<EntryBucket, number>, savingsPercent: number): MonthSummary {
  const { income, savings: saved, expense: spent } = totals;
  const goal = savingsGoal(income, savingsPercent);
  return { income, saved, spent, goal, left: income - spent - Math.max(goal, saved) };
}
