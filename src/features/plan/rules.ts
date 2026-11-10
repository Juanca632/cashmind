/**
 * Plan domain logic. Pure functions, no React and no storage. Money is integer cents.
 *
 * The plan is one number: the whole percentage of each month's income the user wants to save.
 */

/** The savings share every month uses until the user saves a plan. */
export const DEFAULT_SAVINGS_PERCENT = 20;

/** A savings percentage that applies from `effectiveMonth` ('YYYY-MM') until the next version. */
export type PlanVersion = { effectiveMonth: string; savingsPercent: number };

export const PERCENT_INVALID = 'The savings goal must be a whole percentage from 0 to 100.';

export function isValidPercent(percent: number): boolean {
  return Number.isInteger(percent) && percent >= 0 && percent <= 100;
}

/** The percentage that applied in `month`: the latest version not after it, otherwise the default. */
export function savingsPercentFor(versions: readonly PlanVersion[], month: string): number {
  let match: PlanVersion | null = null;
  for (const version of versions) {
    if (version.effectiveMonth <= month && (!match || version.effectiveMonth > match.effectiveMonth)) {
      match = version;
    }
  }
  return match ? match.savingsPercent : DEFAULT_SAVINGS_PERCENT;
}

/** The savings goal for an income, rounded down to the cent. */
export function savingsGoal(incomeCents: number, percent: number): number {
  return Math.floor((incomeCents * percent) / 100);
}
