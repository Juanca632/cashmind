/** The kinds of entry the user records each month, shared by every feature. */

export type EntryBucket = 'income' | 'savings' | 'expense';

export const ENTRY_BUCKETS: readonly EntryBucket[] = ['income', 'savings', 'expense'];

export const BUCKET_LABELS: Record<EntryBucket, string> = {
  income: 'Income',
  savings: 'Savings',
  expense: 'Expense',
};

export const BUCKET_DESCRIPTIONS: Record<EntryBucket, string> = {
  income: 'Money you received',
  savings: 'Money you set aside',
  expense: 'Rent, bills, shopping, going out',
};

/** The action that adds an entry of each kind: the form's title and its button. */
export const ADD_LABELS: Record<EntryBucket, string> = {
  income: 'Add income',
  savings: 'Add to savings',
  expense: 'Add expense',
};
