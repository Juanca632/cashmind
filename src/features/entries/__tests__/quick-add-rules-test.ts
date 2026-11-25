import {
  QUICK_ADD_DAYS,
  QUICK_ADD_MAX,
  QUICK_ADD_MIN,
  entryTitle,
  quickAddRange,
  quickAddSuggestions,
  type Entry,
} from '../rules';

const today = new Date(2026, 10, 20, 12);
let nextId = 1;
const exp = (date: string, amountCents: number, note: string, category: Entry['category'] = 'eating_out', extra: Partial<Entry> = {}): Entry => ({
  id: nextId++,
  date,
  kind: 'expense',
  amountCents,
  note,
  category,
  recurringId: null,
  pocketId: null,
  pocketName: null,
  pocketEmoji: null,
  ...extra,
});
const twice = (note: string, cents: number, d1 = '2026-11-03', d2 = '2026-11-10', category: Entry['category'] = 'eating_out') => [
  exp(d1, cents, note, category),
  exp(d2, cents, note, category),
];

describe('quick add constants', () => {
  it('are 60 days, at least 2 and at most 4', () => {
    expect([QUICK_ADD_DAYS, QUICK_ADD_MIN, QUICK_ADD_MAX]).toEqual([60, 2, 4]);
  });
});

describe('026 Quick add only learns from expenses paid from the month', () => {
  it('expenses paid from a pocket are not suggested, even when repeated', () => {
    const fromPocket = [
      exp('2026-11-03', 250, 'Ramen', 'eating_out', { pocketId: 1, pocketName: 'Japan trip' }),
      exp('2026-11-10', 250, 'Ramen', 'eating_out', { pocketId: 1, pocketName: 'Japan trip' }),
    ];
    expect(quickAddSuggestions(fromPocket, today)).toEqual([]);
  });

  it('they do not add to the count of the same expense paid from the month', () => {
    const mixed = [
      exp('2026-11-03', 250, 'Café'),
      exp('2026-11-10', 250, 'Café', 'eating_out', { pocketId: 1, pocketName: 'Japan trip' }),
    ];
    expect(quickAddSuggestions(mixed, today)).toEqual([]);
  });
});

describe('US2 Which suggestions show', () => {
  it('Same thing: same note, category and amount count together; another amount, note or category is another suggestion', () => {
    const entries = [
      ...twice('Café', 250),
      ...twice('Café', 300),
      ...twice('Tea', 250),
      ...twice('Café', 250, '2026-11-04', '2026-11-05', 'groceries'),
    ];
    const result = quickAddSuggestions(entries, today);
    expect(result).toHaveLength(4);
    expect(result.map((s) => [s.note, s.amountCents, s.category, s.count])).toEqual(
      expect.arrayContaining([
        ['Café', 250, 'eating_out', 2],
        ['Café', 300, 'eating_out', 2],
        ['Tea', 250, 'eating_out', 2],
        ['Café', 250, 'groceries', 2],
      ]),
    );
  });

  it('Same thing: the note is matched exactly ("Café" and "café" differ)', () => {
    const entries = [exp('2026-11-03', 250, 'Café'), exp('2026-11-10', 250, 'café')];
    expect(quickAddSuggestions(entries, today)).toEqual([]);
  });

  it('Shown: Café 2,50 € on 3, 10 and 18 November gives one suggestion with count 3 and last date 18 November', () => {
    const entries = [exp('2026-11-03', 250, 'Café'), exp('2026-11-10', 250, 'Café'), exp('2026-11-18', 250, 'Café')];
    expect(quickAddSuggestions(entries, today)).toEqual([
      { category: 'eating_out', amountCents: 250, note: 'Café', count: 3, lastDate: '2026-11-18' },
    ]);
  });

  it('At least twice: an expense recorded once is not suggested', () => {
    expect(quickAddSuggestions([exp('2026-11-10', 1200, 'Cinema', 'leisure')], today)).toEqual([]);
  });

  it('Last 60 days: counts from 59 days before today up to today, both days included', () => {
    // 59 days before 20 Nov 2026 is 22 Sep 2026.
    const inside = [exp('2026-09-22', 250, 'Edge'), exp('2026-11-20', 250, 'Edge')];
    expect(quickAddSuggestions(inside, today)).toHaveLength(1);
    const dayBefore = [exp('2026-09-21', 250, 'Old'), exp('2026-11-20', 250, 'Old')];
    expect(quickAddSuggestions(dayBefore, today)).toEqual([]);
    const outsideBoth = [exp('2026-09-01', 250, 'Older'), exp('2026-09-10', 250, 'Older')];
    expect(quickAddSuggestions(outsideBoth, today)).toEqual([]);
  });

  it('Last 60 days: entries dated after today do not count', () => {
    const entries = [exp('2026-11-20', 250, 'Future'), exp('2026-11-21', 250, 'Future')];
    expect(quickAddSuggestions(entries, today)).toEqual([]);
  });

  it('Last 60 days: the window crosses a year end', () => {
    const jan = new Date(2027, 0, 10, 12);
    // 59 days before 10 Jan 2027 is 12 Nov 2026.
    expect(quickAddSuggestions([exp('2026-11-12', 250, 'A'), exp('2027-01-10', 250, 'A')], jan)).toHaveLength(1);
    expect(quickAddSuggestions([exp('2026-11-11', 250, 'B'), exp('2027-01-10', 250, 'B')], jan)).toEqual([]);
  });

  it('Order and count: most recorded first, ties by most recent date first', () => {
    const entries = [
      ...twice('Two old', 100, '2026-10-01', '2026-10-02'),
      ...twice('Two recent', 200, '2026-11-01', '2026-11-19'),
      exp('2026-10-10', 300, 'Three'),
      exp('2026-10-11', 300, 'Three'),
      exp('2026-10-12', 300, 'Three'),
    ];
    expect(quickAddSuggestions(entries, today).map((s) => s.note)).toEqual(['Three', 'Two recent', 'Two old']);
  });

  it('Order and count: at most 4 show, the weakest are cut', () => {
    const entries = [
      ...twice('A', 100, '2026-11-01', '2026-11-02'),
      ...twice('B', 200, '2026-11-03', '2026-11-04'),
      ...twice('C', 300, '2026-11-05', '2026-11-06'),
      ...twice('D', 400, '2026-11-07', '2026-11-08'),
      ...twice('E', 500, '2026-10-01', '2026-10-02'),
    ];
    expect(quickAddSuggestions(entries, today).map((s) => s.note)).toEqual(['D', 'C', 'B', 'A']);
  });

  it('Repeats left out: entries recorded by a monthly repeat do not count', () => {
    const entries = [
      exp('2026-11-02', 90000, 'Rent', 'housing', { recurringId: 1 }),
      exp('2026-10-02', 90000, 'Rent', 'housing', { recurringId: 1 }),
    ];
    expect(quickAddSuggestions(entries, today)).toEqual([]);
    // A repeat entry does not add to a group either.
    const mixed = [exp('2026-11-02', 250, 'Café', 'eating_out', { recurringId: 1 }), exp('2026-11-03', 250, 'Café')];
    expect(quickAddSuggestions(mixed, today)).toEqual([]);
  });

  it('Expenses only: income and savings never count', () => {
    const entries = [
      exp('2026-11-02', 5000, 'Pay', 'other', { kind: 'income' }),
      exp('2026-11-03', 5000, 'Pay', 'other', { kind: 'income' }),
      exp('2026-11-02', 3000, 'Piggy', 'other', { kind: 'savings' }),
      exp('2026-11-03', 3000, 'Piggy', 'other', { kind: 'savings' }),
    ];
    expect(quickAddSuggestions(entries, today)).toEqual([]);
  });

  it('Nothing to suggest: no entries gives an empty list', () => {
    expect(quickAddSuggestions([], today)).toEqual([]);
  });

  it('No note: a suggestion without a note keeps an empty note and reads as the category name, or Expense for Other', () => {
    const entries = [...twice('', 4000, '2026-11-03', '2026-11-10', 'groceries'), ...twice('', 700, '2026-11-04', '2026-11-11', 'other')];
    const result = quickAddSuggestions(entries, today);
    expect(result.map((s) => s.note)).toEqual(['', '']);
    expect(result.map((s) => entryTitle({ kind: 'expense', ...s }))).toEqual(
      expect.arrayContaining(['Groceries', 'Expense']),
    );
  });
});

describe('quickAddRange', () => {
  it('names the months that hold the 60 days: 20 November 2026 reaches back to September', () => {
    expect(quickAddRange(today)).toEqual({ from: '2026-09', to: '2026-11' });
  });

  it('a day at the start of a month and across a year end', () => {
    expect(quickAddRange(new Date(2026, 10, 20))).toEqual({ from: '2026-09', to: '2026-11' });
    expect(quickAddRange(new Date(2027, 0, 10))).toEqual({ from: '2026-11', to: '2027-01' });
    // 59 days before 1 Dec 2026 is 2 Oct 2026.
    expect(quickAddRange(new Date(2026, 11, 1))).toEqual({ from: '2026-10', to: '2026-12' });
  });
});

describe('entryTitle', () => {
  it('uses the note, else the category name, else the kind name for Other', () => {
    expect(entryTitle({ kind: 'expense', category: 'eating_out', note: 'Café' })).toBe('Café');
    expect(entryTitle({ kind: 'expense', category: 'groceries', note: '' })).toBe('Groceries');
    expect(entryTitle({ kind: 'expense', category: 'other', note: '' })).toBe('Expense');
    expect(entryTitle({ kind: 'income', category: 'other', note: '' })).toBe('Income');
  });
});
