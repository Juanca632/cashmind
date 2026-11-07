import {
  firstPlanMonth,
  formatEuros,
  formatMonth,
  formatShortMonth,
  formatPercentOf,
  incomeForMonth,
  isPastMonth,
  isValidMonthKey,
  maxSavingsPct,
  monthKey,
  monthsOfYear,
  monthStart,
  parseEurosToCents,
  planForMonth,
  targetsFor,
  validatePlan,
  yearOf,
  type IncomePlan,
  type PlanVersion,
} from '../income-plan';

/** 2000 € income, 1000 € fixed (50 %), savings 30 % → leisure 20 %. */
const plan: IncomePlan = { incomeCents: 200000, fixedCents: 100000, savingsPct: 30 };

const normalizeSpaces = (text: string) => text.replace(/\s/g, ' ');

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

describe('formatting', () => {
  it('formats cents as French euros', () => {
    expect(normalizeSpaces(formatEuros(250050))).toBe('2 500,50 €');
  });

  it('formats a share of the income with up to one decimal', () => {
    expect(normalizeSpaces(formatPercentOf(100000, 200000))).toBe('50 %');
    expect(normalizeSpaces(formatPercentOf(100000, 270000))).toBe('37 %');
    expect(normalizeSpaces(formatPercentOf(37500, 100000))).toBe('37,5 %');
    expect(normalizeSpaces(formatPercentOf(100, 0))).toBe('0 %');
  });
});

describe('validatePlan', () => {
  it('accepts 2000 € income, 1000 € fixed and savings 30 %', () => {
    expect(validatePlan(plan)).toEqual([]);
  });

  it.each([0, -100])('rejects income %p', (incomeCents) => {
    expect(validatePlan({ ...plan, incomeCents })).toContain('income-not-positive');
  });

  it('rejects fixed expenses above the income', () => {
    expect(validatePlan({ ...plan, fixedCents: 210000 })).toEqual(['fixed-invalid']);
  });

  it('accepts fixed expenses of 0 € and equal to the income', () => {
    expect(validatePlan({ ...plan, fixedCents: 0 })).toEqual([]);
    expect(validatePlan({ ...plan, fixedCents: 200000, savingsPct: 0 })).toEqual([]);
  });

  it('rejects savings above what is left after fixed expenses', () => {
    expect(validatePlan({ ...plan, savingsPct: 60 })).toEqual(['savings-too-high']);
    expect(validatePlan({ ...plan, savingsPct: 50 })).toEqual([]);
    expect(maxSavingsPct(200000, 100000)).toBe(50);
    expect(maxSavingsPct(270000, 100000)).toBe(62);
  });

  it('rejects non-integer or negative savings', () => {
    expect(validatePlan({ ...plan, savingsPct: 12.5 })).toEqual(['savings-invalid']);
    expect(validatePlan({ ...plan, savingsPct: -1 })).toEqual(['savings-invalid']);
    expect(validatePlan({ ...plan, savingsPct: Number.NaN })).toEqual(['savings-invalid']);
  });
});

describe('targetsFor', () => {
  it('gives the plan numbers for the recurring income', () => {
    expect(targetsFor(plan, 200000)).toEqual({ fixed: 100000, leisure: 40000, savings: 60000, shortfall: 0 });
  });

  it('updates savings 200 € → 500 € and leisure 800 € → 500 € when savings goes 10 % → 25 %', () => {
    expect(targetsFor({ ...plan, savingsPct: 10 }, 200000)).toMatchObject({ leisure: 80000, savings: 20000 });
    expect(targetsFor({ ...plan, savingsPct: 25 }, 200000)).toMatchObject({ leisure: 50000, savings: 50000 });
  });

  it('keeps fixed and shares a higher income proportionally (2500 €)', () => {
    expect(targetsFor(plan, 250000)).toEqual({ fixed: 100000, leisure: 60000, savings: 90000, shortfall: 0 });
  });

  it('warns about a shortfall when income is below fixed expenses (800 €)', () => {
    expect(targetsFor(plan, 80000)).toEqual({ fixed: 100000, leisure: 0, savings: 0, shortfall: 20000 });
  });

  it('saves all extra money when the plan leaves nothing after fixed expenses', () => {
    const tight: IncomePlan = { incomeCents: 200000, fixedCents: 200000, savingsPct: 0 };
    expect(targetsFor(tight, 250000)).toEqual({ fixed: 200000, leisure: 0, savings: 50000, shortfall: 0 });
  });

  it('always adds up exactly to the income (1000,01 €)', () => {
    const odd: IncomePlan = { incomeCents: 100001, fixedCents: 50000, savingsPct: 20 };
    const targets = targetsFor(odd, 100001);
    expect(targets.fixed + targets.leisure + targets.savings).toBe(100001);
  });

  it('adds up exactly for an override with an awkward amount', () => {
    const targets = targetsFor(plan, 233333);
    expect(targets.fixed + targets.leisure + targets.savings).toBe(233333);
  });
});

describe('incomeForMonth', () => {
  it('uses the recurring income when the month has no override', () => {
    expect(incomeForMonth(plan, {}, '2026-12')).toEqual({ incomeCents: 200000, isOverride: false });
  });

  it('uses the override only for its month', () => {
    const overrides = { '2026-11': 250000 };
    expect(incomeForMonth(plan, overrides, '2026-11')).toEqual({ incomeCents: 250000, isOverride: true });
    expect(incomeForMonth(plan, overrides, '2026-12')).toEqual({ incomeCents: 200000, isOverride: false });
  });

  it('returns to the recurring income once the override is removed', () => {
    const { '2026-11': _removed, ...overrides } = { '2026-11': 250000 };
    expect(incomeForMonth(plan, overrides, '2026-11').incomeCents).toBe(200000);
  });
});

describe('monthKey', () => {
  it('pads the month', () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe('2026-01');
    expect(monthKey(new Date(2026, 10, 7))).toBe('2026-11');
  });
});

describe('plan history', () => {
  const july: PlanVersion = { effectiveMonth: '2026-07', incomeCents: 200000, fixedCents: 100000, savingsPct: 30 };
  const december: PlanVersion = { effectiveMonth: '2026-12', incomeCents: 240000, fixedCents: 100000, savingsPct: 30 };
  const versions = [december, july];

  it('changing the plan in December keeps July to November on the old plan', () => {
    expect(planForMonth(versions, '2026-07')?.incomeCents).toBe(200000);
    expect(planForMonth(versions, '2026-11')?.incomeCents).toBe(200000);
    expect(planForMonth(versions, '2026-12')?.incomeCents).toBe(240000);
    expect(planForMonth(versions, '2027-03')?.incomeCents).toBe(240000);
  });

  it('has no plan before the first version', () => {
    expect(planForMonth(versions, '2026-03')).toBeNull();
    expect(planForMonth([], '2026-11')).toBeNull();
    expect(firstPlanMonth(versions)).toBe('2026-07');
    expect(firstPlanMonth([])).toBeNull();
  });

  it('returns a plain plan without the effective month', () => {
    expect(planForMonth(versions, '2026-08')).toEqual({ incomeCents: 200000, fixedCents: 100000, savingsPct: 30 });
  });
});

describe('month helpers', () => {
  it('detects past months', () => {
    expect(isPastMonth('2026-09', '2026-11')).toBe(true);
    expect(isPastMonth('2025-12', '2026-01')).toBe(true);
    expect(isPastMonth('2026-11', '2026-11')).toBe(false);
    expect(isPastMonth('2026-12', '2026-11')).toBe(false);
  });

  it('validates month keys', () => {
    expect(isValidMonthKey('2026-09')).toBe(true);
    expect(isValidMonthKey('2026-13')).toBe(false);
    expect(isValidMonthKey('2026-9')).toBe(false);
    expect(isValidMonthKey(undefined)).toBe(false);
    expect(isValidMonthKey(['2026-09'])).toBe(false);
  });

  it('lists the months of a year and maps back to dates', () => {
    expect(monthsOfYear(2026)).toHaveLength(12);
    expect(monthsOfYear(2026)[0]).toBe('2026-01');
    expect(monthsOfYear(2026)[11]).toBe('2026-12');
    expect(yearOf('2026-09')).toBe(2026);
    expect(monthKey(monthStart('2026-09'))).toBe('2026-09');
  });
});

describe('month formatting', () => {
  it('formats month keys for display', () => {
    expect(formatMonth('2026-09')).toBe('September 2026');
    expect(formatShortMonth('2026-09')).toBe('Sep');
  });
});
