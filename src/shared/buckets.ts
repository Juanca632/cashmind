/** The three budget categories, shared by the plan and expenses features. */

export type Bucket = 'fixed' | 'leisure' | 'savings';

export const BUCKETS: readonly Bucket[] = ['fixed', 'leisure', 'savings'];

export type FlexibleBucket = 'leisure' | 'savings';

export type Targets = Record<Bucket, number> & {
  /** How much the income is below the fixed expenses (0 when it covers them). */
  shortfall: number;
};

export function otherFlexible(bucket: FlexibleBucket): FlexibleBucket {
  return bucket === 'leisure' ? 'savings' : 'leisure';
}

/** Recorded amount as a whole percentage of its target, or null when the target is 0. */
export function progressPercent(spentCents: number, targetCents: number): number | null {
  return targetCents > 0 ? Math.round((spentCents * 100) / targetCents) : null;
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  fixed: 'Needs',
  leisure: 'Wants',
  savings: 'Savings',
};

export const BUCKET_DESCRIPTIONS: Record<Bucket, string> = {
  fixed: 'Rent, bills, groceries',
  leisure: 'Going out, hobbies, treats',
  savings: 'Money you set aside',
};

/** The 50/30/20 starting point, shown as a suggestion only. */
export const SUGGESTED_PERCENT: Record<Bucket, number> = { fixed: 50, leisure: 30, savings: 20 };

export type BucketProgress = {
  spent: number;
  target: number;
  /** What is left to spend (fixed, leisure) or to save (savings). */
  left: number;
  /** How much the recorded amount is above the target. */
  over: number;
};

export function bucketProgress(spent: number, target: number): BucketProgress {
  return { spent, target, left: Math.max(target - spent, 0), over: Math.max(spent - target, 0) };
}
