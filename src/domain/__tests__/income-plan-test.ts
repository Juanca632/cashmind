import {
  firstPlanMonth,
  formatEuros,
  formatMonth,
  formatShortMonth,
  formatPercentOf,
  incomeForMonth,
  isPastMonth,
  isValidMonthKey,
  monthKey,
  monthsOfYear,
  monthStart,
  convertAmount,
  parseEurosToCents,
  parsePercent,
  planExcessCents,
  planTargets,
  progressPercent,
  resolveAmount,
  planForMonth,
  targetsFor,
  validatePlan,
  yearOf,
  type IncomePlan,
  type PlanVersion,
} from '../income-plan';

const eur = (cents: number) => ({ unit: 'eur', cents }) as const;
const pct = (value: number) => ({ unit: 'pct', pct: value }) as const;

/** 2000 € income, 1000 € fixed (50 %), savings 30 % kept → leisure automatic (20 %). */
const plan: IncomePlan = { incomeCents: 200000, fixed: eur(100000), kept: 'savings', keptAmount: pct(30) };

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

describe('amounts', () => {
  it('parses whole percentages from 0 to 100', () => {
    expect(parsePercent('30')).toBe(30);
    expect(parsePercent('30 %')).toBe(30);
    expect(parsePercent('0')).toBe(0);
    expect(parsePercent('100')).toBe(100);
    expect(parsePercent('101')).toBeNull();
    expect(parsePercent('12,5')).toBeNull();
    expect(parsePercent('')).toBeNull();
  });

  it('resolves euros and percentages of the income', () => {
    expect(resolveAmount(pct(30), 200000)).toBe(60000);
    expect(resolveAmount(pct(30), 250000)).toBe(75000);
    expect(resolveAmount(eur(40000), 250000)).toBe(40000);
    expect(resolveAmount(pct(33), 100001)).toBe(33000);
  });

  it('converts between units without jumping', () => {
    expect(convertAmount(pct(30), 200000)).toEqual(eur(60000));
    expect(convertAmount(eur(60000), 200000)).toEqual(pct(30));
    expect(convertAmount(eur(65000), 200000)).toEqual(pct(33));
    expect(convertAmount(eur(64000), 200000)).toEqual(pct(32));
    expect(convertAmount(eur(500000), 200000)).toEqual(pct(100));
    expect(convertAmount(eur(100), 0)).toEqual(pct(0));
  });

  it('keeps a whole percentage across % → € → % on an income with cents (2345,67 €)', () => {
    for (const value of [20, 30, 50, 99, 100]) {
      expect(convertAmount(convertAmount(pct(value), 234567), 234567)).toEqual(pct(value));
    }
  });
});

describe('planTargets', () => {
  it('fills leisure automatically: 1000 € fixed + savings 30 % on 2000 € → leisure 400 €', () => {
    expect(planTargets(plan)).toEqual({ fixed: 100000, leisure: 40000, savings: 60000 });
  });

  it('fills savings automatically when leisure is kept: leisure 500 € → savings 500 €', () => {
    expect(planTargets({ ...plan, kept: 'leisure', keptAmount: eur(50000) })).toEqual({
      fixed: 100000,
      leisure: 50000,
      savings: 50000,
    });
  });

  it('keeps a percentage when the income changes: savings 30 % on 2500 € → 750 €', () => {
    expect(planTargets({ ...plan, incomeCents: 250000 })).toMatchObject({ savings: 75000, leisure: 75000 });
  });

  it('accepts fixed expenses as a percentage', () => {
    expect(planTargets({ ...plan, fixed: pct(50) })).toMatchObject({ fixed: 100000 });
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
    expect(validatePlan({ ...plan, fixed: eur(210000) })).toEqual(['fixed-invalid']);
  });

  it('accepts fixed expenses of 0 € and equal to the income', () => {
    expect(validatePlan({ ...plan, fixed: eur(0) })).toEqual([]);
    expect(validatePlan({ ...plan, fixed: eur(200000), keptAmount: pct(0) })).toEqual([]);
  });

  it('rejects savings 60 % with 1000 € fixed: 200 € over the income', () => {
    const tooHigh = { ...plan, keptAmount: pct(60) };
    expect(validatePlan(tooHigh)).toEqual(['over-income']);
    expect(planExcessCents(tooHigh)).toBe(20000);
    expect(validatePlan({ ...plan, keptAmount: pct(50) })).toEqual([]);
  });

  it('rejects invalid amounts', () => {
    expect(validatePlan({ ...plan, keptAmount: pct(12.5) })).toEqual(['kept-invalid']);
    expect(validatePlan({ ...plan, keptAmount: eur(-1) })).toEqual(['kept-invalid']);
    expect(validatePlan({ ...plan, keptAmount: pct(Number.NaN) })).toEqual(['kept-invalid']);
    expect(validatePlan({ ...plan, fixed: pct(120) })).toEqual(['fixed-invalid']);
  });
});

describe('targetsFor', () => {
  it('gives the plan numbers for the recurring income', () => {
    expect(targetsFor(plan, 200000)).toEqual({ fixed: 100000, leisure: 40000, savings: 60000, shortfall: 0 });
  });

  it('updates savings 200 € → 500 € and leisure 800 € → 500 € when savings goes 10 % → 25 %', () => {
    expect(targetsFor({ ...plan, keptAmount: pct(10) }, 200000)).toMatchObject({ leisure: 80000, savings: 20000 });
    expect(targetsFor({ ...plan, keptAmount: pct(25) }, 200000)).toMatchObject({ leisure: 50000, savings: 50000 });
  });

  it('keeps fixed and shares a higher income proportionally (2500 €)', () => {
    expect(targetsFor(plan, 250000)).toEqual({ fixed: 100000, leisure: 60000, savings: 90000, shortfall: 0 });
  });

  it('keeps the proportion when leisure is the kept bucket', () => {
    const leisureKept: IncomePlan = { ...plan, kept: 'leisure', keptAmount: eur(40000) };
    expect(targetsFor(leisureKept, 250000)).toEqual({ fixed: 100000, leisure: 60000, savings: 90000, shortfall: 0 });
  });

  it('keeps a percentage-based fixed amount fixed in a month with another income', () => {
    expect(targetsFor({ ...plan, fixed: pct(50) }, 250000)).toMatchObject({ fixed: 100000 });
  });

  it('warns about a shortfall when income is below fixed expenses (800 €)', () => {
    expect(targetsFor(plan, 80000)).toEqual({ fixed: 100000, leisure: 0, savings: 0, shortfall: 20000 });
  });

  it('saves all extra money when the plan leaves nothing after fixed expenses', () => {
    const tight: IncomePlan = { ...plan, fixed: eur(200000), keptAmount: pct(0) };
    expect(targetsFor(tight, 250000)).toEqual({ fixed: 200000, leisure: 0, savings: 50000, shortfall: 0 });
  });

  it('always adds up exactly to the income (1000,01 €)', () => {
    const odd: IncomePlan = { incomeCents: 100001, fixed: eur(50000), kept: 'savings', keptAmount: pct(20) };
    const targets = targetsFor(odd, 100001);
    expect(targets.fixed + targets.leisure + targets.savings).toBe(100001);
  });

  it('adds up exactly for an override with an awkward amount', () => {
    const targets = targetsFor(plan, 233333);
    expect(targets.fixed + targets.leisure + targets.savings).toBe(233333);
  });
});

describe('progressPercent', () => {
  it('gives 70 % saved of 900 € and 50 % spent of 400 €', () => {
    expect(progressPercent(63000, 90000)).toBe(70);
    expect(progressPercent(20000, 40000)).toBe(50);
    expect(progressPercent(45000, 40000)).toBe(113);
  });

  it('has no percentage for a zero target', () => {
    expect(progressPercent(1000, 0)).toBeNull();
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
  const july: PlanVersion = { ...plan, effectiveMonth: '2026-07' };
  const december: PlanVersion = { ...plan, effectiveMonth: '2026-12', incomeCents: 240000 };
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
    expect(planForMonth(versions, '2026-08')).toEqual(plan);
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
