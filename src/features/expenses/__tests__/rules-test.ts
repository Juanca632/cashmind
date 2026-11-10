import { defaultExpenseDate, lastDayOfMonth, totalsByBucket, validateExpense, type ExpenseInput } from '../rules';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { previousMonth } from '@/shared/months';

const nov7 = new Date(2026, 10, 7);
const dec3 = new Date(2026, 11, 3);
const dec6 = new Date(2026, 11, 6);

const cinema: ExpenseInput = { date: '2026-11-07', bucket: 'expense', amountCents: 1250, note: 'Cinema' };

describe('day helpers', () => {
  it('builds day keys and moves across months and years', () => {
    expect(dayKey(nov7)).toBe('2026-11-07');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(previousMonth('2026-12')).toBe('2026-11');
    expect(previousMonth('2026-01')).toBe('2025-12');
  });

  it('formats a day for display', () => {
    expect(formatDay('2026-11-07')).toBe('Sat 7 Nov');
  });
});

describe('dates of an expense', () => {
  it('finds the last day of a month, including February and the year end', () => {
    expect(lastDayOfMonth('2026-11')).toBe('2026-11-30');
    expect(lastDayOfMonth('2028-02')).toBe('2028-02-29');
    expect(lastDayOfMonth('2026-12')).toBe('2026-12-31');
  });

  it('defaults to today in the current month and to the last day in a past month', () => {
    expect(defaultExpenseDate('2026-12', dec6)).toBe('2026-12-06');
    expect(defaultExpenseDate(undefined, dec6)).toBe('2026-12-06');
    expect(defaultExpenseDate('2026-09', dec6)).toBe('2026-09-30');
  });
});

describe('validateExpense', () => {
  it('accepts an expense of 12,50 € today', () => {
    expect(validateExpense(cinema, nov7)).toEqual([]);
  });

  it.each([0, -100, 12.5])('rejects amount %p', (amountCents) => {
    expect(validateExpense({ ...cinema, amountCents }, nov7)).toEqual(['amount-not-positive']);
  });

  it.each(['income', 'savings', 'expense'] as const)('accepts an entry of kind %s', (bucket) => {
    expect(validateExpense({ ...cinema, bucket }, nov7)).toEqual([]);
  });

  it.each(['fixed', 'leisure', ''])('rejects the old or empty kind %p: only income, savings and expense exist', (bucket) => {
    expect(validateExpense({ ...cinema, bucket: bucket as never }, nov7)).toEqual(['bucket-invalid']);
  });

  it('accepts the smallest amount (1 cent) and rejects one above the limit', () => {
    expect(validateExpense({ ...cinema, amountCents: 1 }, nov7)).toEqual([]);
    expect(validateExpense({ ...cinema, amountCents: 90_000_001 }, nov7)).toEqual(['amount-too-large']);
  });

  it('accepts today and rejects tomorrow', () => {
    expect(validateExpense({ ...cinema, date: '2026-11-07' }, nov7)).toEqual([]);
    expect(validateExpense({ ...cinema, date: '2026-11-08' }, nov7)).toEqual(['date-invalid']);
  });

  it('rejects an unknown bucket', () => {
    expect(validateExpense({ ...cinema, bucket: 'food' as never }, nov7)).toEqual(['bucket-invalid']);
  });

  it('accepts a forgotten expense of 30 November on 3 December', () => {
    expect(validateExpense({ ...cinema, date: '2026-11-30' }, dec3)).toEqual([]);
  });

  it('accepts any past month', () => {
    expect(validateExpense({ ...cinema, date: '2026-09-30' }, dec6)).toEqual([]);
  });

  it('rejects future dates and malformed dates', () => {
    expect(validateExpense({ ...cinema, date: '2026-11-08' }, nov7)).toEqual(['date-invalid']);
    expect(validateExpense({ ...cinema, date: '7/11/2026' }, nov7)).toEqual(['date-invalid']);
    expect(validateExpense({ ...cinema, date: '2026-11-31' }, dec3)).toEqual(['date-invalid']);
  });
});

describe('totals', () => {
  it('adds up entries per kind', () => {
    expect(
      totalsByBucket([
        { bucket: 'expense', amountCents: 1250 },
        { bucket: 'expense', amountCents: 250 },
        { bucket: 'savings', amountCents: 60000 },
        { bucket: 'income', amountCents: 200000 },
      ]),
    ).toEqual({ income: 200000, savings: 60000, expense: 1500 });
  });
});
