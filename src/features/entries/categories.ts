/** The fixed categories of each kind of entry. Pure data: stored as their key; names come with the app. */
import type { EntryKind } from '@/shared/kinds';

export type EntryCategory =
  | 'housing'
  | 'groceries'
  | 'transport'
  | 'eating_out'
  | 'leisure'
  | 'health'
  | 'subscriptions'
  | 'salary'
  | 'freelance'
  | 'benefits'
  | 'gifts'
  | 'emergency_fund'
  | 'investments'
  | 'travel'
  | 'goal'
  | 'other';

/** Each kind's categories in the order the form shows them; Other is always last. */
export const CATEGORIES: Record<EntryKind, readonly EntryCategory[]> = {
  expense: ['housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'],
  income: ['salary', 'freelance', 'benefits', 'gifts', 'other'],
  savings: ['emergency_fund', 'investments', 'travel', 'goal', 'other'],
};

export const ALL_CATEGORIES: readonly EntryCategory[] = [
  ...new Set([...CATEGORIES.expense, ...CATEGORIES.income, ...CATEGORIES.savings]),
];

export const DEFAULT_CATEGORY: EntryCategory = 'other';

export const CATEGORY_LABELS: Record<EntryCategory, string> = {
  housing: 'Housing',
  groceries: 'Groceries',
  transport: 'Transport',
  eating_out: 'Eating out',
  leisure: 'Leisure',
  health: 'Health',
  subscriptions: 'Subscriptions',
  salary: 'Salary',
  freelance: 'Freelance',
  benefits: 'Benefits',
  gifts: 'Gifts',
  emergency_fund: 'Emergency fund',
  investments: 'Investments',
  travel: 'Travel',
  goal: 'Goal',
  other: 'Other',
};

export function isCategoryOf(kind: EntryKind, category: unknown): category is EntryCategory {
  return (CATEGORIES[kind] as readonly unknown[]).includes(category);
}
