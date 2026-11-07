/**
 * Income plan domain logic. Pure functions, no React and no storage.
 * All money is integer cents (250000 = 2500,00 €).
 *
 * A plan has a recurring income, fixed expenses and one "kept" bucket (leisure or savings),
 * each entered in euros or as a percentage of the income. The other bucket is automatic:
 * it gets whatever is left.
 */

export type Bucket = 'fixed' | 'leisure' | 'savings';

export const BUCKETS: readonly Bucket[] = ['fixed', 'leisure', 'savings'];

export type FlexibleBucket = 'leisure' | 'savings';

/** What the user typed for a bucket: euros (in cents) or a whole percentage of the income. */
export type Amount = { unit: 'eur'; cents: number } | { unit: 'pct'; pct: number };

export type IncomePlan = {
  incomeCents: number;
  fixed: Amount;
  /** The bucket the user entered; the other flexible bucket is automatic. */
  kept: FlexibleBucket;
  keptAmount: Amount;
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
  const normalized = text.replace(/[\s\u00a0\u202f€]/g, '').replace(',', '.');
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(normalized);
  if (!match) return null;
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  return euros * 100 + cents;
}

/** Parses a whole percentage 0–100 ("30", "30 %"); null otherwise. */
export function parsePercent(text: string): number | null {
  const normalized = text.replace(/[\s%]/g, '');
  if (!/^\d{1,3}$/.test(normalized)) return null;
  const pct = Number(normalized);
  return pct <= 100 ? pct : null;
}

/** Euro value of an amount on a given income. Percentages round down to the cent. */
export function resolveAmount(amount: Amount, incomeCents: number): number {
  return amount.unit === 'eur' ? amount.cents : Math.floor((incomeCents * amount.pct) / 100);
}

/** The same amount in the other unit (percent rounds to the nearest whole number). */
export function convertAmount(amount: Amount, incomeCents: number): Amount {
  if (amount.unit === 'pct') return { unit: 'eur', cents: resolveAmount(amount, incomeCents) };
  const pct = incomeCents > 0 ? Math.min(Math.round((amount.cents * 100) / incomeCents), 100) : 0;
  return { unit: 'pct', pct };
}

function isValidAmount(amount: Amount): boolean {
  return amount.unit === 'eur'
    ? Number.isInteger(amount.cents) && amount.cents >= 0
    : Number.isInteger(amount.pct) && amount.pct >= 0 && amount.pct <= 100;
}

export function otherFlexible(bucket: FlexibleBucket): FlexibleBucket {
  return bucket === 'leisure' ? 'savings' : 'leisure';
}

/** Euro targets on the plan's own recurring income. The automatic bucket may be negative if the plan doesn't fit. */
export function planTargets(plan: IncomePlan): Record<Bucket, number> {
  const fixed = resolveAmount(plan.fixed, plan.incomeCents);
  const kept = resolveAmount(plan.keptAmount, plan.incomeCents);
  const auto = plan.incomeCents - fixed - kept;
  return { fixed, [plan.kept]: kept, [otherFlexible(plan.kept)]: auto } as Record<Bucket, number>;
}

export type PlanError = 'income-not-positive' | 'fixed-invalid' | 'kept-invalid' | 'over-income';

export function validatePlan(plan: IncomePlan): PlanError[] {
  const errors: PlanError[] = [];
  if (!Number.isInteger(plan.incomeCents) || plan.incomeCents <= 0) errors.push('income-not-positive');
  if (!isValidAmount(plan.fixed) || resolveAmount(plan.fixed, plan.incomeCents) > plan.incomeCents) {
    errors.push('fixed-invalid');
  }
  if (!isValidAmount(plan.keptAmount)) errors.push('kept-invalid');
  if (errors.length === 0 && planExcessCents(plan) > 0) errors.push('over-income');
  return errors;
}

/** How much fixed expenses plus the kept bucket exceed the income (0 when they fit). */
export function planExcessCents(plan: IncomePlan): number {
  const { fixed } = planTargets(plan);
  return Math.max(fixed + resolveAmount(plan.keptAmount, plan.incomeCents) - plan.incomeCents, 0);
}

/**
 * Targets for a month with `monthIncomeCents`. Fixed expenses stay as in the plan; the rest is
 * shared between leisure and savings in the plan's proportion. Leisure absorbs rounding.
 */
export function targetsFor(plan: IncomePlan, monthIncomeCents: number): Targets {
  const base = planTargets(plan);
  const fixed = base.fixed;
  const remainder = monthIncomeCents - fixed;
  if (remainder < 0) {
    return { fixed, leisure: 0, savings: 0, shortfall: -remainder };
  }

  const planRemainder = plan.incomeCents - fixed;
  const savings = planRemainder <= 0 ? remainder : Math.floor((remainder * base.savings) / planRemainder);
  return { fixed, leisure: remainder - savings, savings, shortfall: 0 };
}

/** Recorded amount as a whole percentage of its target, or null when the target is 0. */
export function progressPercent(spentCents: number, targetCents: number): number | null {
  return targetCents > 0 ? Math.round((spentCents * 100) / targetCents) : null;
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

/** A plan that applies from `effectiveMonth` ('YYYY-MM') until the next version. */
export type PlanVersion = IncomePlan & { effectiveMonth: string };

/** The plan that applied in `month`: the latest version whose effective month is not after it. */
export function planForMonth(versions: readonly PlanVersion[], month: string): IncomePlan | null {
  let match: PlanVersion | null = null;
  for (const version of versions) {
    if (version.effectiveMonth <= month && (!match || version.effectiveMonth > match.effectiveMonth)) {
      match = version;
    }
  }
  if (!match) return null;
  const { effectiveMonth: _effectiveMonth, ...plan } = match;
  return plan;
}

/** First month with a plan, or null when there is none. */
export function firstPlanMonth(versions: readonly PlanVersion[]): string | null {
  return versions.reduce<string | null>(
    (first, version) => (first === null || version.effectiveMonth < first ? version.effectiveMonth : first),
    null,
  );
}

export function isPastMonth(month: string, currentMonth: string): boolean {
  return month < currentMonth;
}

export function isValidMonthKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function yearOf(month: string): number {
  return Number(month.slice(0, 4));
}

/** The twelve month keys of a year, January first. */
export function monthsOfYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

/** Local date for the first day of a month key, for display. */
export function monthStart(month: string): Date {
  return new Date(yearOf(month), Number(month.slice(5, 7)) - 1, 1);
}

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'November 2026' */
export function formatMonth(month: string): string {
  return monthFormatter.format(monthStart(month));
}

/** 'Nov' */
export function formatShortMonth(month: string): string {
  return SHORT_MONTHS[Number(month.slice(5, 7)) - 1];
}
