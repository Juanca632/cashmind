/**
 * Income plan domain logic. Pure functions, no React and no storage.
 * All money is integer cents (250000 = 2500,00 €).
 *
 * A plan has a recurring income, a list of fixed expenses in euros and one "kept" bucket
 * (leisure or savings), a share of the income. The other bucket is automatic: it gets what is left.
 */
import {
  BUCKET_LABELS,
  SUGGESTED_SAVINGS_PERCENT,
  otherFlexible,
  type Bucket,
  type FlexibleBucket,
  type Targets,
} from '@/shared/buckets';
import { AMOUNT_TOO_LARGE, MAX_CENTS, formatEuros, isValidCents } from '@/shared/money';

/** What the user typed for a bucket: euros (in cents) or a whole percentage of the income. */
export type Amount = { unit: 'eur'; cents: number } | { unit: 'pct'; pct: number };

export type FixedItem = { name: string; amountCents: number };

export const MAX_ITEM_NAME_LENGTH = 40;

export type IncomePlan = {
  incomeCents: number;
  fixedItems: FixedItem[];
  /** The bucket the user entered; the other flexible bucket is automatic. */
  kept: FlexibleBucket;
  keptAmount: Amount;
};

/** Income overrides keyed by month, e.g. { '2026-11': 300000 }. */
export type MonthOverrides = Record<string, number>;

export function fixedTotal(items: readonly FixedItem[]): number {
  return items.reduce((sum, item) => sum + item.amountCents, 0);
}

export function isValidFixedItem(item: FixedItem): boolean {
  const name = item.name.trim();
  return name.length >= 1 && name.length <= MAX_ITEM_NAME_LENGTH && isValidCents(item.amountCents) && item.amountCents > 0;
}

/** Euro value of an amount on a given income. Percentages round down to the cent. */
export function resolveAmount(amount: Amount, incomeCents: number): number {
  return amount.unit === 'eur' ? amount.cents : Math.floor((incomeCents * amount.pct) / 100);
}

/** The amount as a whole percentage of the income, rounded to the nearest and at most 100. */
export function wholePercent(amount: Amount, incomeCents: number): number {
  if (amount.unit === 'pct') return amount.pct;
  return incomeCents > 0 ? Math.min(Math.round((amount.cents * 100) / incomeCents), 100) : 0;
}

function isValidAmount(amount: Amount): boolean {
  return amount.unit === 'eur'
    ? isValidCents(amount.cents)
    : Number.isInteger(amount.pct) && amount.pct >= 0 && amount.pct <= 100;
}

/** Euro targets on the plan's own recurring income. The automatic bucket may be negative if the plan doesn't fit. */
export function planTargets(plan: IncomePlan): Record<Bucket, number> {
  const fixed = fixedTotal(plan.fixedItems);
  const kept = resolveAmount(plan.keptAmount, plan.incomeCents);
  const auto = plan.incomeCents - fixed - kept;
  return { fixed, [plan.kept]: kept, [otherFlexible(plan.kept)]: auto } as Record<Bucket, number>;
}

export type PlanError =
  | 'income-not-positive'
  | 'income-too-large'
  | 'item-invalid'
  | 'fixed-over-income'
  | 'kept-invalid'
  | 'over-income';

export function validatePlan(plan: IncomePlan): PlanError[] {
  const errors: PlanError[] = [];
  if (!Number.isInteger(plan.incomeCents) || plan.incomeCents <= 0) errors.push('income-not-positive');
  else if (!isValidCents(plan.incomeCents)) errors.push('income-too-large');
  if (!plan.fixedItems.every(isValidFixedItem)) errors.push('item-invalid');
  else if (errors.length === 0 && fixedTotal(plan.fixedItems) > plan.incomeCents) errors.push('fixed-over-income');
  if (!isValidAmount(plan.keptAmount)) errors.push('kept-invalid');
  if (errors.length === 0 && planExcessCents(plan) > 0) errors.push('over-income');
  return errors;
}

export const ITEM_INVALID = 'Every fixed expense needs a name and an amount greater than 0 €.';

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
    case 'item-invalid':
      return ITEM_INVALID;
    case 'fixed-over-income':
      return `Fixed expenses are ${formatEuros(fixedTotal(plan.fixedItems) - plan.incomeCents)} over your income.`;
    case 'kept-invalid':
      return `${BUCKET_LABELS[plan.kept]} must be a whole percentage from 0 to 100.`;
    case 'over-income':
      return `Fixed expenses and ${BUCKET_LABELS[plan.kept].toLowerCase()} are ${formatEuros(planExcessCents(plan))} over your income.`;
  }
}

/** How much fixed expenses plus the kept bucket exceed the income (0 when they fit). */
export function planExcessCents(plan: IncomePlan): number {
  const { fixed } = planTargets(plan);
  return Math.max(fixed + resolveAmount(plan.keptAmount, plan.incomeCents) - plan.incomeCents, 0);
}

/**
 * Targets for a month with `monthIncomeCents`, the same rule for every month: fixed expenses stay
 * as listed, the kept bucket is its share of that month's income (never above what is left) and
 * the other bucket takes the rest.
 */
export function targetsFor(plan: IncomePlan, monthIncomeCents: number): Targets {
  const fixed = fixedTotal(plan.fixedItems);
  const remainder = monthIncomeCents - fixed;
  if (remainder < 0) {
    return { fixed, leisure: 0, savings: 0, shortfall: -remainder };
  }

  const kept = Math.min(resolveAmount(plan.keptAmount, monthIncomeCents), remainder);
  return { fixed, [plan.kept]: kept, [otherFlexible(plan.kept)]: remainder - kept, shortfall: 0 } as Targets;
}

/** The 50/30/20 reference: savings is 20 % of the income, never above what is left; wants is the rest. */
export function suggestedSplit(incomeCents: number, fixedCents: number): Record<FlexibleBucket, number> {
  const left = Math.max(incomeCents - fixedCents, 0);
  const savings = Math.min(Math.floor((incomeCents * SUGGESTED_SAVINGS_PERCENT) / 100), left);
  return { savings, leisure: left - savings };
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

