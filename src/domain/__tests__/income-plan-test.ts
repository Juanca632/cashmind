import {
  formatEuros,
  incomeForMonth,
  monthKey,
  parseEurosToCents,
  percentageTotal,
  targetsFor,
  validatePlan,
  type IncomePlan,
} from '../income-plan';

const plan: IncomePlan = {
  incomeCents: 250000,
  percentages: { fixed: 50, leisure: 30, savings: 20 },
};

describe('parseEurosToCents', () => {
  it.each([
    ['2500', 250000],
    ['2500,5', 250050],
    ['2500.50', 250050],
    ['2 500,50', 250050],
    ['1000,01 €', 100001],
    ['0', 0],
  ])('parses %p as %p cents', (text, cents) => {
    expect(parseEurosToCents(text)).toBe(cents);
  });

  it.each(['', '   ', '-10', 'abc', '10,123', '1,2,3'])('rejects %p', (text) => {
    expect(parseEurosToCents(text)).toBeNull();
  });
});

describe('formatEuros', () => {
  it('formats cents as French euros', () => {
    // fr-FR uses narrow no-break spaces; normalize them for the assertion.
    expect(formatEuros(250050).replace(/\s/g, ' ')).toBe('2 500,50 €');
  });
});

describe('validatePlan', () => {
  it('accepts a valid 50/30/20 plan', () => {
    expect(validatePlan(plan)).toEqual([]);
  });

  it.each([0, -100])('rejects income %p', (incomeCents) => {
    expect(validatePlan({ ...plan, incomeCents })).toContain('income-not-positive');
  });

  it.each([
    [{ fixed: 50, leisure: 30, savings: 10 }, 90],
    [{ fixed: 50, leisure: 30, savings: 30 }, 110],
  ])('rejects percentages that do not add up to 100', (percentages, total) => {
    expect(validatePlan({ ...plan, percentages })).toEqual(['total-not-100']);
    expect(percentageTotal(percentages)).toBe(total);
  });

  it('rejects non-integer or out-of-range percentages', () => {
    expect(validatePlan({ ...plan, percentages: { fixed: 49.5, leisure: 30.5, savings: 20 } })).toEqual([
      'percentage-out-of-range',
    ]);
    expect(validatePlan({ ...plan, percentages: { fixed: 120, leisure: -20, savings: 0 } })).toEqual([
      'percentage-out-of-range',
    ]);
  });
});

describe('targetsFor', () => {
  it('splits 2500,00 € as 50/30/20', () => {
    expect(targetsFor(250000, plan.percentages)).toEqual({
      fixed: 125000,
      leisure: 75000,
      savings: 50000,
    });
  });

  it('updates savings from 200 € to 500 € on 2000 € when going from 10 % to 25 %', () => {
    expect(targetsFor(200000, { fixed: 60, leisure: 30, savings: 10 }).savings).toBe(20000);
    expect(targetsFor(200000, { fixed: 45, leisure: 30, savings: 25 }).savings).toBe(50000);
  });

  it('always adds up exactly to the income (1000,01 €)', () => {
    const targets = targetsFor(100001, plan.percentages);
    expect(targets.fixed + targets.leisure + targets.savings).toBe(100001);
    expect(targets).toEqual({ fixed: 50001, leisure: 30000, savings: 20000 });
  });
});

describe('incomeForMonth', () => {
  it('uses the recurring income when the month has no override', () => {
    expect(incomeForMonth(plan, {}, '2026-12')).toEqual({ incomeCents: 250000, isOverride: false });
  });

  it('uses the override only for its month', () => {
    const overrides = { '2026-11': 300000 };
    expect(incomeForMonth(plan, overrides, '2026-11')).toEqual({ incomeCents: 300000, isOverride: true });
    expect(incomeForMonth(plan, overrides, '2026-12')).toEqual({ incomeCents: 250000, isOverride: false });
    expect(targetsFor(300000, plan.percentages)).toEqual({ fixed: 150000, leisure: 90000, savings: 60000 });
  });

  it('returns to the recurring income once the override is removed', () => {
    const { '2026-11': _removed, ...overrides } = { '2026-11': 300000 };
    expect(incomeForMonth(plan, overrides, '2026-11').incomeCents).toBe(250000);
  });
});

describe('monthKey', () => {
  it('pads the month', () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe('2026-01');
    expect(monthKey(new Date(2026, 10, 7))).toBe('2026-11');
  });
});
