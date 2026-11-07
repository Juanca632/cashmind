/**
 * Income plan domain logic. Pure functions, no React and no storage.
 * All money is integer cents (250000 = 2500,00 €).
 *
 * A plan has a recurring income, a fixed-expenses amount and a savings percentage
 * of the income. Leisure is always what is left.
 */

export type Bucket = 'fixed' | 'leisure' | 'savings';

export const BUCKETS: readonly Bucket[] = ['fixed', 'leisure', 'savings'];

export type IncomePlan = {
  incomeCents: number;
  fixedCents: number;
  /** Whole-number percentage of the recurring income. */
  savingsPct: number;
};

/** Income overrides keyed by month, e.g. { '2026-11': 300000 }. */
export type MonthOverrides = Record<string, number>;

export type Targets = Record<Bucket, number> & {
  /** How much the income is below the fixed expenses (0 when it covers them). */
  shortfall: number;
};

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const percentFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function formatEuros(cents: number): string {
  return euroFormatter.format(cents / 100);
}

/** Share of `totalCents` as a display string like "37 %" or "37,5 %". */
export function formatPercentOf(cents: number, totalCents: number): string {
  const pct = totalCents > 0 ? (cents / totalCents) * 100 : 0;
  return `${percentFormatter.format(pct)} %`;
}

/**
 * Parses user input like "2500", "2500,5", "2 500,50" or "2500.50" into cents.
 * Returns null when the text is not a valid non-negative amount with at most 2 decimals.
 */
export function parseEurosToCents(text: string): number | null {
  const normalized = text.replace(/[\s  €]/g, '').replace(',', '.');
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(normalized);
  if (!match) return null;
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  return euros * 100 + cents;
}

/** Highest whole savings percentage that still fits after fixed expenses. */
export function maxSavingsPct(incomeCents: number, fixedCents: number): number {
  if (incomeCents <= 0) return 0;
  return Math.floor(((incomeCents - fixedCents) * 100) / incomeCents);
}

export type PlanError = 'income-not-positive' | 'fixed-invalid' | 'savings-invalid' | 'savings-too-high';

export function validatePlan(plan: IncomePlan): PlanError[] {
  const errors: PlanError[] = [];
  if (!Number.isInteger(plan.incomeCents) || plan.incomeCents <= 0) {
    errors.push('income-not-positive');
  }
  if (!Number.isInteger(plan.fixedCents) || plan.fixedCents < 0 || plan.fixedCents > plan.incomeCents) {
    errors.push('fixed-invalid');
  }
  if (!Number.isInteger(plan.savingsPct) || plan.savingsPct < 0) {
    errors.push('savings-invalid');
  } else if (errors.length === 0 && planSavingsCents(plan) > plan.incomeCents - plan.fixedCents) {
    errors.push('savings-too-high');
  }
  return errors;
}

function planSavingsCents(plan: IncomePlan): number {
  return Math.floor((plan.incomeCents * plan.savingsPct) / 100);
}

/**
 * Targets for a month with `monthIncomeCents`. Fixed expenses stay the same; the rest is
 * shared between leisure and savings in the plan's proportion. Leisure absorbs rounding.
 */
export function targetsFor(plan: IncomePlan, monthIncomeCents: number): Targets {
  const fixed = plan.fixedCents;
  const remainder = monthIncomeCents - fixed;
  if (remainder < 0) {
    return { fixed, leisure: 0, savings: 0, shortfall: -remainder };
  }

  const planRemainder = plan.incomeCents - plan.fixedCents;
  const savings =
    planRemainder <= 0 ? remainder : Math.floor((remainder * planSavingsCents(plan)) / planRemainder);
  return { fixed, leisure: remainder - savings, savings, shortfall: 0 };
}

/** Month key in the device's local time zone, e.g. '2026-11'. */
export function monthKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

export function incomeForMonth(
  plan: IncomePlan,
  overrides: MonthOverrides,
  month: string,
): { incomeCents: number; isOverride: boolean } {
  const override = overrides[month];
  if (override !== undefined) return { incomeCents: override, isOverride: true };
  return { incomeCents: plan.incomeCents, isOverride: false };
}
