import { ALL_CATEGORIES, CATEGORIES, CATEGORY_LABELS, DEFAULT_CATEGORY, isCategoryOf } from '../categories';
import { categorySplit, validateEntry, entryErrorMessage, type EntryInput } from '../rules';

describe('Choose a category when recording: the fixed lists', () => {
  it('Categories of the kind: expenses, in list order', () => {
    expect(CATEGORIES.expense.map((c) => CATEGORY_LABELS[c])).toEqual([
      'Housing',
      'Groceries',
      'Transport',
      'Eating out',
      'Leisure',
      'Health',
      'Subscriptions',
      'Other',
    ]);
  });

  it('Categories of the kind: income, in list order', () => {
    expect(CATEGORIES.income.map((c) => CATEGORY_LABELS[c])).toEqual(['Salary', 'Freelance', 'Benefits', 'Gifts', 'Other']);
  });

  it('Categories of the kind: savings, in list order', () => {
    expect(CATEGORIES.savings.map((c) => CATEGORY_LABELS[c])).toEqual([
      'Emergency fund',
      'Investments',
      'Travel',
      'Goal',
      'Other',
    ]);
  });

  it('Stored keys are the ones of the data model', () => {
    expect(CATEGORIES.expense).toEqual([
      'housing',
      'groceries',
      'transport',
      'eating_out',
      'leisure',
      'health',
      'subscriptions',
      'other',
    ]);
    expect(CATEGORIES.income).toEqual(['salary', 'freelance', 'benefits', 'gifts', 'other']);
    expect(CATEGORIES.savings).toEqual(['emergency_fund', 'investments', 'travel', 'goal', 'other']);
  });

  it('Default: Other, which is last in every kind', () => {
    expect(DEFAULT_CATEGORY).toBe('other');
    for (const kind of ['expense', 'income', 'savings'] as const) {
      expect(CATEGORIES[kind][CATEGORIES[kind].length - 1]).toBe('other');
    }
  });

  it('All categories lists every key once', () => {
    expect([...ALL_CATEGORIES].sort()).toEqual(
      [...new Set(Object.values(CATEGORIES).flat())].sort(),
    );
  });

  it('isCategoryOf accepts a category of the kind and refuses another kind, unknown values and labels', () => {
    expect(isCategoryOf('expense', 'groceries')).toBe(true);
    expect(isCategoryOf('income', 'salary')).toBe(true);
    expect(isCategoryOf('savings', 'goal')).toBe(true);
    expect(isCategoryOf('income', 'other')).toBe(true);
    expect(isCategoryOf('expense', 'salary')).toBe(false);
    expect(isCategoryOf('savings', 'housing')).toBe(false);
    expect(isCategoryOf('expense', 'Groceries')).toBe(false);
    expect(isCategoryOf('expense', 'pets')).toBe(false);
    expect(isCategoryOf('expense', undefined)).toBe(false);
    expect(isCategoryOf('expense', null)).toBe(false);
    expect(isCategoryOf('expense', 3)).toBe(false);
  });
});

describe('Validation and unreadable data: a category must belong to the kind', () => {
  const today = new Date(2026, 10, 13);
  const base: EntryInput = { date: '2026-11-10', kind: 'expense', amountCents: 1000, note: '', category: 'groceries' };

  it('accepts a category of the kind', () => {
    expect(validateEntry(base, today)).toEqual([]);
  });

  it.each([
    ['income category on an expense', { category: 'salary' as const }],
    ['unknown category', { category: 'pets' as never }],
    ['kind switched without changing the category', { kind: 'income' as const }],
  ] as [string, Partial<EntryInput>][])('rejects %s with category-invalid', (_label, change) => {
    expect(validateEntry({ ...base, ...change }, today)).toEqual(['category-invalid']);
  });

  it('the message is "Pick a category for this kind."', () => {
    expect(entryErrorMessage('category-invalid')).toBe('Pick a category for this kind.');
  });
});

describe('See a kind split by category (rules)', () => {
  const e = (kind: 'income' | 'savings' | 'expense', category: string, amountCents: number) => ({
    kind,
    category: category as never,
    amountCents,
  });

  it('Split: 650 Housing, 320 Groceries, 230 Other, largest first with 54, 27 and 19 %', () => {
    const split = categorySplit(
      [e('expense', 'other', 23000), e('expense', 'groceries', 32000), e('expense', 'housing', 65000)],
      'expense',
    );

    expect(split).toEqual([
      { category: 'housing', cents: 65000, percent: 54 },
      { category: 'groceries', cents: 32000, percent: 27 },
      { category: 'other', cents: 23000, percent: 19 },
    ]);
  });

  it('Income and savings: 2.000 Salary and 300 Freelance are 87 % and 13 %', () => {
    const split = categorySplit([e('income', 'freelance', 30000), e('income', 'salary', 200000)], 'income');

    expect(split).toEqual([
      { category: 'salary', cents: 200000, percent: 87 },
      { category: 'freelance', cents: 30000, percent: 13 },
    ]);
  });

  it('Savings are split the same way', () => {
    const split = categorySplit([e('savings', 'goal', 100), e('savings', 'travel', 300)], 'savings');

    expect(split).toEqual([
      { category: 'travel', cents: 300, percent: 75 },
      { category: 'goal', cents: 100, percent: 25 },
    ]);
  });

  it('Only the entries of the asked kind count', () => {
    const split = categorySplit(
      [e('expense', 'other', 1000), e('income', 'other', 99999), e('savings', 'other', 500)],
      'expense',
    );

    expect(split).toEqual([{ category: 'other', cents: 1000, percent: 100 }]);
  });

  it('Entries of the same category are added up', () => {
    const split = categorySplit(
      [e('expense', 'groceries', 1000), e('expense', 'groceries', 2500), e('expense', 'health', 500)],
      'expense',
    );

    expect(split).toEqual([
      { category: 'groceries', cents: 3500, percent: 88 },
      { category: 'health', cents: 500, percent: 13 },
    ]);
  });

  it('Only used categories: the ones with no entries are not listed', () => {
    const split = categorySplit([e('expense', 'health', 100)], 'expense');

    expect(split.map((s) => s.category)).toEqual(['health']);
  });

  it('One category: it is 100 %', () => {
    expect(categorySplit([e('expense', 'groceries', 1234), e('expense', 'groceries', 1)], 'expense')).toEqual([
      { category: 'groceries', cents: 1235, percent: 100 },
    ]);
  });

  it('No entries of the kind: nothing to split', () => {
    expect(categorySplit([], 'expense')).toEqual([]);
    expect(categorySplit([e('income', 'salary', 100)], 'expense')).toEqual([]);
  });

  it('Same amount: the list order decides (Groceries before Health before Other)', () => {
    const split = categorySplit(
      [e('expense', 'other', 100), e('expense', 'health', 100), e('expense', 'groceries', 100)],
      'expense',
    );

    expect(split.map((s) => s.category)).toEqual(['groceries', 'health', 'other']);
  });

  it('Same amount: the list order wins over the order the entries were recorded in', () => {
    const split = categorySplit([e('income', 'other', 500), e('income', 'salary', 500)], 'income');

    expect(split.map((s) => s.category)).toEqual(['salary', 'other']);
  });

  it('Percentages round to the nearest whole number, half up', () => {
    // 1 of 8 = 12,5 % -> 13; 7 of 8 = 87,5 % -> 88 (they add up to 101 %)
    expect(
      categorySplit([e('expense', 'housing', 700), e('expense', 'other', 100)], 'expense').map((s) => s.percent),
    ).toEqual([88, 13]);
    // 1 of 3 = 33,33 -> 33, 2 of 3 = 66,67 -> 67
    expect(
      categorySplit([e('expense', 'housing', 200), e('expense', 'other', 100)], 'expense').map((s) => s.percent),
    ).toEqual([67, 33]);
    // 1 of 200 = 0,5 % -> 1; 199 of 200 = 99,5 % -> 100
    expect(
      categorySplit([e('expense', 'housing', 19900), e('expense', 'other', 100)], 'expense').map((s) => s.percent),
    ).toEqual([100, 1]);
  });

  it('Percentages may add up to 99 %', () => {
    const split = categorySplit(
      [e('expense', 'housing', 100), e('expense', 'health', 100), e('expense', 'other', 100)],
      'expense',
    );

    expect(split.map((s) => s.percent)).toEqual([33, 33, 33]);
  });

  it('Many categories: all the used ones are listed, none hidden', () => {
    const all = ['housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'];
    const split = categorySplit(all.map((c, i) => e('expense', c, (i + 1) * 100)), 'expense');

    expect(split).toHaveLength(8);
    expect(split.map((s) => s.category)).toEqual([...all].reverse());
  });
});
