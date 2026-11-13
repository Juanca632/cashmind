/** The kinds of entry the user records each month, shared by every feature. */

export type EntryKind = 'income' | 'savings' | 'expense';

export const ENTRY_KINDS: readonly EntryKind[] = ['income', 'savings', 'expense'];

export const KIND_LABELS: Record<EntryKind, string> = {
  income: 'Income',
  savings: 'Savings',
  expense: 'Expense',
};

/** The example in the note field of the entry form. */
export const NOTE_EXAMPLES: Record<EntryKind, string> = {
  income: 'Salary',
  savings: 'Emergency fund',
  expense: 'Cinema',
};

/** The action that adds an entry of each kind: the form's title and its button. */
export const ADD_LABELS: Record<EntryKind, string> = {
  income: 'Add income',
  savings: 'Add to savings',
  expense: 'Add expense',
};
