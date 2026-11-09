/**
 * Income plan domain logic. Pure functions, no React and no storage.
 * All money is integer cents (250000 = 2500,00 €).
 *
 * A plan has a recurring income, fixed expenses and one "kept" bucket (leisure or savings),
 * each entered in euros or as a percentage of the income. The other bucket is automatic:
 * it gets whatever is left.
 */
import { BUCKET_LABELS, otherFlexible, type Bucket, type FlexibleBucket, type Targets } from '@/shared/buckets';
import { AMOUNT_TOO_LARGE, MAX_CENTS, formatEuros, isValidCents } from '@/shared/money';

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
    ? isValidCents(amount.cents)
    : Number.isInteger(amount.pct) && amount.pct >= 0 && amount.pct <= 100;
}

/** Euro targets on the plan's own recurring income. The automatic bucket may be negative if the plan doesn't fit. */
export function planTargets(plan: IncomePlan): Record<Bucket, number> {
  const fixed = resolveAmount(plan.fixed, plan.incomeCents);
  const kept = resolveAmount(plan.keptAmount, plan.incomeCents);
  const auto = plan.incomeCents - fixed - kept;
  return { fixed, [plan.kept]: kept, [otherFlexible(plan.kept)]: auto } as Record<Bucket, number>;
}

export type PlanError = 'income-not-positive' | 'income-too-large' | 'fixed-invalid' | 'kept-invalid' | 'over-income';

export function validatePlan(plan: IncomePlan): PlanError[] {
  const errors: PlanError[] = [];
  if (!Number.isInteger(plan.incomeCents) || plan.incomeCents <= 0) errors.push('income-not-positive');
  else if (!isValidCents(plan.incomeCents)) errors.push('income-too-large');
  if (!isValidAmount(plan.fixed) || resolveAmount(plan.fixed, plan.incomeCents) > plan.incomeCents) {
    errors.push('fixed-invalid');
  }
  if (!isValidAmount(plan.keptAmount)) errors.push('kept-invalid');
  if (errors.length === 0 && planExcessCents(plan) > 0) errors.push('over-income');
  return errors;
}

export const INCOME_INVALID = 'Income must be greater than 0 €.';

export function isValidMonthIncome(incomeCents: number): boolean {
  return isValidCents(incomeCents) && incomeCents > 0;
}

export function incomeErrorMessage(incomeCents: number): string {
  return incomeCents > MAX_CENTS ? AMOUNT_TOO_LARGE : INCOME_INVALID;
}

export function planErrorMessage(error: PlanError, plan: IncomePlan): string {
  switch (error) {
    case 'income-not-positive':
      return INCOME_INVALID;
    case 'income-too-large':
      return AMOUNT_TOO_LARGE;
    case 'fixed-invalid':
      return 'Needs must be a valid amount and cannot exceed your income.';
    case 'kept-invalid':
      return `${BUCKET_LABELS[plan.kept]} must be an amount in euros or a whole percentage from 0 to 100.`;
    case 'over-income':
      return `Needs and ${BUCKET_LABELS[plan.kept].toLowerCase()} are ${formatEuros(planExcessCents(plan))} over your income.`;
  }
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

