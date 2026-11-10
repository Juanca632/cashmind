import { defaultEntryDate, lastDayOfMonth, totalsByKind, validateEntry, type EntryInput } from '../rules';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { previousMonth } from '@/shared/months';

const nov7 = new Date(2026, 10, 7);
const dec3 = new Date(2026, 11, 3);
const dec6 = new Date(2026, 11, 6);

const cinema: EntryInput = { date: '2026-11-07', kind: 'expense', amountCents: 1250, note: 'Cinema' };

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
    expect(defaultEntryDate('2026-12', dec6)).toBe('2026-12-06');
    expect(defaultEntryDate(undefined, dec6)).toBe('2026-12-06');
    expect(defaultEntryDate('2026-09', dec6)).toBe('2026-09-30');
  });
});

describe('validateEntry', () => {
  it('accepts an expense of 12,50 € today', () => {
    expect(validateEntry(cinema, nov7)).toEqual([]);
  });

  it.each([0, -100, 12.5])('rejects amount %p', (amountCents) => {
    expect(validateEntry({ ...cinema, amountCents }, nov7)).toEqual(['amount-not-positive']);
  });

  it.each(['income', 'savings', 'expense'] as const)('accepts an entry of kind %s', (kind) => {
    expect(validateEntry({ ...cinema, kind }, nov7)).toEqual([]);
  });

  it.each(['fixed', 'leisure', ''])('rejects the old or empty kind %p: only income, savings and expense exist', (kind) => {
    expect(validateEntry({ ...cinema, kind: kind as never }, nov7)).toEqual(['kind-invalid']);
  });

  it('accepts the smallest amount (1 cent) and rejects one above the limit', () => {
    expect(validateEntry({ ...cinema, amountCents: 1 }, nov7)).toEqual([]);
    expect(validateEntry({ ...cinema, amountCents: 90_000_001 }, nov7)).toEqual(['amount-too-large']);
  });

  it('accepts today and rejects tomorrow', () => {
    expect(validateEntry({ ...cinema, date: '2026-11-07' }, nov7)).toEqual([]);
    expect(validateEntry({ ...cinema, date: '2026-11-08' }, nov7)).toEqual(['date-invalid']);
  });

  it('rejects an unknown kind', () => {
    expect(validateEntry({ ...cinema, kind: 'food' as never }, nov7)).toEqual(['kind-invalid']);
  });

  it('accepts a forgotten expense of 30 November on 3 December', () => {
    expect(validateEntry({ ...cinema, date: '2026-11-30' }, dec3)).toEqual([]);
  });

  it('accepts any past month', () => {
    expect(validateEntry({ ...cinema, date: '2026-09-30' }, dec6)).toEqual([]);
  });

  it('rejects future dates and malformed dates', () => {
    expect(validateEntry({ ...cinema, date: '2026-11-08' }, nov7)).toEqual(['date-invalid']);
    expect(validateEntry({ ...cinema, date: '7/11/2026' }, nov7)).toEqual(['date-invalid']);
    expect(validateEntry({ ...cinema, date: '2026-11-31' }, dec3)).toEqual(['date-invalid']);
  });
});

describe('totals', () => {
  it('adds up entries per kind', () => {
    expect(
      totalsByKind([
        { kind: 'expense', amountCents: 1250 },
        { kind: 'expense', amountCents: 250 },
        { kind: 'savings', amountCents: 60000 },
        { kind: 'income', amountCents: 200000 },
      ]),
    ).toEqual({ income: 200000, savings: 60000, expense: 1500 });
  });
});
