import { fixedCostsCents, validateRecurring } from '../rules';

describe('Recurring entries: validation (FR-007)', () => {
  const rent = { category: 'housing', amountCents: 90000, note: 'Rent' } as const;

  it('accepts a valid amount, category of its kind and note', () => {
    expect(validateRecurring('expense', rent)).toEqual([]);
    expect(validateRecurring('income', { category: 'salary', amountCents: 200000, note: '' })).toEqual([]);
    expect(validateRecurring('savings', { category: 'goal', amountCents: 1, note: '' })).toEqual([]);
  });

  it.each([
    ['zero', 0],
    ['negative', -100],
    ['fractional', 12.5],
  ])('refuses an amount that is %s', (_name, amountCents) => {
    expect(validateRecurring('expense', { ...rent, amountCents })).toEqual(['amount-not-positive']);
  });

  it('refuses an amount above the limit like an entry', () => {
    expect(validateRecurring('expense', { ...rent, amountCents: 90_000_000_001 })).toEqual(['amount-too-large']);
    expect(validateRecurring('expense', { ...rent, amountCents: 90_000_000_000 })).toEqual([]);
  });

  it('refuses a category that does not belong to the kind', () => {
    expect(validateRecurring('expense', { ...rent, category: 'salary' })).toEqual(['category-invalid']);
    expect(validateRecurring('income', { ...rent, category: 'housing' })).toEqual(['category-invalid']);
    expect(validateRecurring('savings', { ...rent, category: 'housing' })).toEqual(['category-invalid']);
  });

  it('reports a bad amount and a bad category together', () => {
    expect(validateRecurring('expense', { ...rent, amountCents: 0, category: 'salary' }).sort()).toEqual([
      'amount-not-positive',
      'category-invalid',
    ]);
  });
});

describe('Review what repeats: Fixed costs total (US3 scenario 2)', () => {
  it('adds only the repeating expenses: 900,00 + 12,99 = 912,99, ignoring income', () => {
    expect(
      fixedCostsCents([
        { kind: 'income', amountCents: 200000, active: true },
        { kind: 'expense', amountCents: 90000, active: true },
        { kind: 'expense', amountCents: 1299, active: true },
      ]),
    ).toBe(91299);
  });

  it('does not count savings', () => {
    expect(fixedCostsCents([{ kind: 'savings', amountCents: 5000, active: true }])).toBe(0);
  });

  it('does not count stopped items', () => {
    expect(
      fixedCostsCents([
        { kind: 'expense', amountCents: 90000, active: false },
        { kind: 'expense', amountCents: 1299, active: true },
      ]),
    ).toBe(1299);
  });

  it('is 0 with nothing repeating', () => {
    expect(fixedCostsCents([])).toBe(0);
  });
});
