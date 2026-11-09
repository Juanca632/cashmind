import { trialShortfallMessage, firstPlanMonth, wholePercent, fixedTotal, isValidFixedItem, resolveAmount, planForMonth, targetsFor, validatePlan, type IncomePlan, type PlanVersion } from '../rules';
import { formatEuros, formatPercentOf, parseEurosToCents, parsePercent } from '@/shared/money';
import { formatMonth, formatShortMonth, isPastMonth, isValidMonthKey, monthKey, monthsOfYear, monthStart, yearOf } from '@/shared/months';

const eur = (cents: number) => ({ unit: 'eur', cents }) as const;
const pct = (value: number) => ({ unit: 'pct', pct: value }) as const;
const items = (cents: number) => (cents > 0 ? [{ name: 'House', amountCents: cents }] : []);

/** 2000 € income, 1000 € fixed (50 %), savings 30 % kept → leisure automatic (20 %). */
const plan: IncomePlan = { fixedItems: items(100000), kept: 'savings', keptAmount: pct(30) };

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

  it('gives the nearest whole percentage of an amount in euros', () => {
    expect(wholePercent(pct(30), 200000)).toBe(30);
    expect(wholePercent(eur(60000), 200000)).toBe(30);
    expect(wholePercent(eur(65000), 200000)).toBe(33);
    expect(wholePercent(eur(500000), 200000)).toBe(100);
    expect(wholePercent(eur(100), 0)).toBe(0);
  });
});

describe('fixed items', () => {
  it('adds up the list', () => {
    const list = [
      { name: 'House', amountCents: 70000 },
      { name: 'Transport', amountCents: 6000 },
      { name: 'Phone', amountCents: 2000 },
      { name: 'Supermarket', amountCents: 25000 },
    ];
    expect(fixedTotal(list)).toBe(103000);
    expect(fixedTotal([])).toBe(0);
  });

  it.each([
    ['no name', { name: '   ', amountCents: 100 }],
    ['a name of 41 characters', { name: 'x'.repeat(41), amountCents: 100 }],
    ['zero', { name: 'House', amountCents: 0 }],
    ['negative', { name: 'House', amountCents: -1 }],
    ['fractional cents', { name: 'House', amountCents: 10.5 }],
  ])('rejects %s', (_label, item) => {
    expect(isValidFixedItem(item)).toBe(false);
  });

  it('accepts a name of 40 characters', () => {
    expect(isValidFixedItem({ name: 'x'.repeat(40), amountCents: 100 })).toBe(true);
  });
});

describe('validatePlan', () => {
  it('accepts a list and a percentage, with no income', () => {
    expect(validatePlan(plan)).toEqual([]);
    expect(validatePlan({ ...plan, fixedItems: [] })).toEqual([]);
  });

  it('rejects invalid values', () => {
    expect(validatePlan({ ...plan, keptAmount: pct(12.5) })).toEqual(['kept-invalid']);
    expect(validatePlan({ ...plan, keptAmount: pct(Number.NaN) })).toEqual(['kept-invalid']);
    expect(validatePlan({ ...plan, fixedItems: [{ name: '', amountCents: 100 }] })).toEqual(['item-invalid']);
  });
});

describe('trialShortfallMessage', () => {
  const normalized = (text: string | null) => text?.replace(/\s/g, ' ');

  it('is empty when the income covers the plan', () => {
    expect(trialShortfallMessage(plan, 200000)).toBeNull();
  });

  it('says how far the fixed expenses go over', () => {
    expect(normalized(trialShortfallMessage(plan, 80000))).toContain('200,00 € over this income');
  });

  it('says how far the fixed expenses and the kept share go over', () => {
    expect(normalized(trialShortfallMessage({ ...plan, keptAmount: pct(60) }, 200000))).toContain('200,00 € over this income');
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

  it('keeps fixed and applies the kept share to that month: savings 30 % of 2500 € is 750 €', () => {
    expect(targetsFor(plan, 250000)).toEqual({ fixed: 100000, leisure: 75000, savings: 75000, shortfall: 0 });
  });

  it('applies the share when leisure is the kept bucket', () => {
    const wantsKept: IncomePlan = { ...plan, kept: 'leisure', keptAmount: pct(20) };
    expect(targetsFor(wantsKept, 250000)).toEqual({ fixed: 100000, leisure: 50000, savings: 100000, shortfall: 0 });
  });

  it('keeps an amount saved in euros as it is', () => {
    const euros: IncomePlan = { ...plan, kept: 'savings', keptAmount: eur(40000) };
    expect(targetsFor(euros, 250000)).toEqual({ fixed: 100000, leisure: 110000, savings: 40000, shortfall: 0 });
  });

  it('never gives the kept part more than what is left', () => {
    expect(targetsFor({ ...plan, keptAmount: pct(60) }, 150000)).toEqual({ fixed: 100000, leisure: 0, savings: 50000, shortfall: 0 });
  });

  it('warns about a shortfall when income is below fixed expenses (800 €)', () => {
    expect(targetsFor(plan, 80000)).toEqual({ fixed: 100000, leisure: 0, savings: 0, shortfall: 20000 });
  });

  it('gives extra money to the automatic part when the plan leaves nothing after fixed expenses', () => {
    const tight: IncomePlan = { ...plan, fixedItems: items(200000), keptAmount: pct(0) };
    expect(targetsFor(tight, 250000)).toEqual({ fixed: 200000, leisure: 50000, savings: 0, shortfall: 0 });
  });

  it('always adds up exactly to the income (1000,01 €)', () => {
    const odd: IncomePlan = { fixedItems: items(50000), kept: 'savings', keptAmount: pct(20) };
    const targets = targetsFor(odd, 100001);
    expect(targets.fixed + targets.leisure + targets.savings).toBe(100001);
  });

  it('adds up exactly for an override with an awkward amount', () => {
    const targets = targetsFor(plan, 233333);
    expect(targets.fixed + targets.leisure + targets.savings).toBe(233333);
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
  const december: PlanVersion = { ...plan, effectiveMonth: '2026-12', keptAmount: pct(40) };
  const versions = [december, july];

  it('changing the plan in December keeps July to November on the old plan', () => {
    expect(planForMonth(versions, '2026-07')?.keptAmount).toEqual(pct(30));
    expect(planForMonth(versions, '2026-11')?.keptAmount).toEqual(pct(30));
    expect(planForMonth(versions, '2026-12')?.keptAmount).toEqual(pct(40));
    expect(planForMonth(versions, '2027-03')?.keptAmount).toEqual(pct(40));
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
