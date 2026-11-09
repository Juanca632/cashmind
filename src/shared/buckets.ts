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

export const BUCKET_LABELS: Record<Bucket, string> = {
  fixed: 'Fixed',
  leisure: 'Wants',
  savings: 'Savings',
};

export const BUCKET_DESCRIPTIONS: Record<Bucket, string> = {
  fixed: 'Rent, bills, groceries',
  leisure: 'Going out, hobbies, treats',
  savings: 'Money you set aside',
};

/** The savings share of the 50/30/20 reference, shown as a suggestion only. */
export const SUGGESTED_SAVINGS_PERCENT = 20;

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
