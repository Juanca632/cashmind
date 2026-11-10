import { DEFAULT_SAVINGS_PERCENT, isValidPercent, savingsGoal, savingsPercentFor, type PlanVersion } from '../rules';
import { formatEuros, formatPercentOf, parseEurosToCents, parsePercent } from '@/shared/money';
import { formatMonth, formatShortMonth, isPastMonth, isValidMonthKey, monthKey, monthsOfYear, monthStart, yearOf } from '@/shared/months';

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
});

describe('savings goal', () => {
  it('is the percentage of the income, rounded down to the cent', () => {
    expect(savingsGoal(200000, 20)).toBe(40000);
    expect(savingsGoal(80000, 30)).toBe(24000);
    expect(savingsGoal(100001, 20)).toBe(20000);
    expect(savingsGoal(200000, 0)).toBe(0);
    expect(savingsGoal(0, 20)).toBe(0);
    expect(savingsGoal(100001, 100)).toBe(100001);
    expect(savingsGoal(199, 50)).toBe(99);
  });

  it('accepts only whole percentages from 0 to 100', () => {
    expect(isValidPercent(0)).toBe(true);
    expect(isValidPercent(100)).toBe(true);
    expect(isValidPercent(101)).toBe(false);
    expect(isValidPercent(-1)).toBe(false);
    expect(isValidPercent(12.5)).toBe(false);
    expect(isValidPercent(Number.NaN)).toBe(false);
  });
});

describe('monthKey', () => {
  it('pads the month', () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe('2026-01');
    expect(monthKey(new Date(2026, 10, 7))).toBe('2026-11');
  });
});

describe('plan history', () => {
  const versions: PlanVersion[] = [
    { effectiveMonth: '2026-12', savingsPercent: 40 },
    { effectiveMonth: '2026-07', savingsPercent: 30 },
  ];

  it('changing the plan in December keeps July to November on the old percentage', () => {
    expect(savingsPercentFor(versions, '2026-07')).toBe(30);
    expect(savingsPercentFor(versions, '2026-11')).toBe(30);
    expect(savingsPercentFor(versions, '2026-12')).toBe(40);
    expect(savingsPercentFor(versions, '2027-03')).toBe(40);
  });

  it('a version saved twice in the same month is a single version: the later list entry wins by month, not by order', () => {
    expect(savingsPercentFor([{ effectiveMonth: '2026-11', savingsPercent: 25 }, ...versions], '2026-11')).toBe(25);
  });

  it('keeps 0 % as a real value, not as "no plan"', () => {
    expect(savingsPercentFor([{ effectiveMonth: '2026-07', savingsPercent: 0 }], '2026-09')).toBe(0);
  });

  it('uses 20 % before the first version and when none was saved', () => {
    expect(DEFAULT_SAVINGS_PERCENT).toBe(20);
    expect(savingsPercentFor(versions, '2026-03')).toBe(20);
    expect(savingsPercentFor([], '2026-11')).toBe(20);
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
