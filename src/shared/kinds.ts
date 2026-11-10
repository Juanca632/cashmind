/** The kinds of entry the user records each month, shared by every feature. */

export type EntryKind = 'income' | 'savings' | 'expense';

export const ENTRY_KINDS: readonly EntryKind[] = ['income', 'savings', 'expense'];

export const KIND_LABELS: Record<EntryKind, string> = {
  income: 'Income',
  savings: 'Savings',
  expense: 'Expense',
};

export const KIND_DESCRIPTIONS: Record<EntryKind, string> = {
  income: 'Money you received',
  savings: 'Money you set aside',
  expense: 'Rent, bills, shopping, going out',
};

/** The action that adds an entry of each kind: the form's title and its button. */
export const ADD_LABELS: Record<EntryKind, string> = {
  income: 'Add income',
  savings: 'Add to savings',
  expense: 'Add expense',
};
