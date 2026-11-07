/**
 * Income plan domain logic. Pure functions, no React and no storage.
 * All money is integer cents (250000 = 2500,00 €).
 */

export type Bucket = 'fixed' | 'leisure' | 'savings';

export const BUCKETS: readonly Bucket[] = ['fixed', 'leisure', 'savings'];

export type Percentages = Record<Bucket, number>;

export type IncomePlan = {
  incomeCents: number;
  percentages: Percentages;
};

/** Income overrides keyed by month, e.g. { '2026-11': 300000 }. */
export type MonthOverrides = Record<string, number>;

export type Targets = Record<Bucket, number>;

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function formatEuros(cents: number): string {
  return euroFormatter.format(cents / 100);
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

export type PlanError = 'income-not-positive' | 'percentage-out-of-range' | 'total-not-100';

export function percentageTotal(percentages: Percentages): number {
  return BUCKETS.reduce((sum, bucket) => sum + percentages[bucket], 0);
}

export function validatePlan(plan: IncomePlan): PlanError[] {
  const errors: PlanError[] = [];
  if (!Number.isInteger(plan.incomeCents) || plan.incomeCents <= 0) {
    errors.push('income-not-positive');
  }
  const outOfRange = BUCKETS.some((bucket) => {
    const pct = plan.percentages[bucket];
    return !Number.isInteger(pct) || pct < 0 || pct > 100;
  });
  if (outOfRange) {
    errors.push('percentage-out-of-range');
  } else if (percentageTotal(plan.percentages) !== 100) {
    errors.push('total-not-100');
  }
  return errors;
}

/**
 * Euro target per bucket. Leisure and savings are rounded down; fixed expenses
 * take the remainder so the three targets always add up exactly to the income.
 */
export function targetsFor(incomeCents: number, percentages: Percentages): Targets {
  const leisure = Math.floor((incomeCents * percentages.leisure) / 100);
  const savings = Math.floor((incomeCents * percentages.savings) / 100);
  return { fixed: incomeCents - leisure - savings, leisure, savings };
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
