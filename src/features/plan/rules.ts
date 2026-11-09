/**
 * Income plan domain logic. Pure functions, no React and no storage.
 * All money is integer cents (250000 = 2500,00 €).
 *
 * A plan has a list of fixed expenses in euros and one "kept" bucket (leisure or savings), a share
 * of each month's income. The other bucket is automatic: it gets what is left.
 */
import {
  BUCKET_LABELS,
  otherFlexible,
  type FlexibleBucket,
  type Targets,
} from '@/shared/buckets';
import { formatEuros, isValidCents } from '@/shared/money';

/** A kept share: a whole percentage of the income. Euros remain only in plans saved by older versions. */
export type Amount = { unit: 'eur'; cents: number } | { unit: 'pct'; pct: number };

export type FixedItem = { name: string; amountCents: number };

export const MAX_ITEM_NAME_LENGTH = 40;

export type IncomePlan = {
  fixedItems: FixedItem[];
  /** The bucket the user entered; the other flexible bucket is automatic. */
  kept: FlexibleBucket;
  keptAmount: Amount;
};

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

export type PlanError = 'item-invalid' | 'kept-invalid';

export function validatePlan(plan: IncomePlan): PlanError[] {
  const errors: PlanError[] = [];
  if (!plan.fixedItems.every(isValidFixedItem)) errors.push('item-invalid');
  if (!isValidAmount(plan.keptAmount)) errors.push('kept-invalid');
  return errors;
}

export const ITEM_INVALID = 'Every fixed expense needs a name and an amount greater than 0 €.';

export function planErrorMessage(error: PlanError, plan: IncomePlan): string {
  switch (error) {
    case 'item-invalid':
      return ITEM_INVALID;
    case 'kept-invalid':
      return `${BUCKET_LABELS[plan.kept]} must be a whole percentage from 0 to 100.`;
  }
}

/** Says how far a trial income falls short of the plan, or null when it covers it. */
export function trialShortfallMessage(plan: IncomePlan, incomeCents: number): string | null {
  const fixed = fixedTotal(plan.fixedItems);
  if (fixed > incomeCents) return `Fixed expenses are ${formatEuros(fixed - incomeCents)} over this income.`;
  const excess = fixed + resolveAmount(plan.keptAmount, incomeCents) - incomeCents;
  if (excess > 0) return `Fixed expenses and ${BUCKET_LABELS[plan.kept].toLowerCase()} are ${formatEuros(excess)} over this income.`;
  return null;
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

