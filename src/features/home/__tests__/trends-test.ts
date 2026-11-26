import { lastMonths } from '@/shared/months';

import { averageSentence, goalCount, monthTotals, monthsInUse, savingsGoals, trendAverage } from '../trends';

const MONTHS = lastMonths('2026-11', 6);
const exp = (date: string, amountCents: number, category: 'groceries' | 'housing' | 'other' = 'other') =>
  ({ date, kind: 'expense', amountCents, category }) as const;
const inc = (date: string, amountCents: number) => ({ date, kind: 'income', amountCents, category: 'salary' }) as const;
const sav = (date: string, amountCents: number) => ({ date, kind: 'savings', amountCents, category: 'goal' }) as const;
const eur = (cents: number) => `${cents}c`;

const SPENT = [
  exp('2026-06-05', 100000),
  exp('2026-07-05', 120000),
  exp('2026-08-05', 140000),
  exp('2026-09-05', 130000),
  exp('2026-10-05', 110000),
  exp('2026-11-05', 50000),
];

describe('US1 See the last 6 months of one kind', () => {
  it('Opening state: the six months are June to November 2026, oldest first', () => {
    expect(MONTHS).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
  });

  it('Opening state: months crossing a year end are listed in order', () => {
    expect(lastMonths('2027-02', 6)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02']);
  });

  it('Big number: month totals add up only the selected kind', () => {
    const totals = monthTotals([exp('2026-11-02', 100000), exp('2026-11-20', 24050), inc('2026-11-01', 999999), sav('2026-11-03', 5)], MONTHS, 'expense');
    expect(totals.map((t) => t.month)).toEqual(MONTHS);
    expect(totals[5].cents).toBe(124050);
    expect(totals[0].cents).toBe(0);
  });

  it('Average: five complete months give 1 200,00 € (the current month is left out)', () => {
    const totals = monthTotals(SPENT, MONTHS, 'expense');
    expect(trendAverage(totals, monthsInUse(SPENT), '2026-11')).toBe(120000);
  });

  it('Average: rounded down to the cent', () => {
    const entries = [exp('2026-09-01', 100), exp('2026-10-01', 100), exp('2026-08-01', 101)];
    expect(trendAverage(monthTotals(entries, MONTHS, 'expense'), monthsInUse(entries), '2026-11')).toBe(100);
  });

  it('New user: months with no entry of any kind are not part of the average', () => {
    const entries = [exp('2026-09-10', 30000), exp('2026-10-10', 50000)];
    expect(trendAverage(monthTotals(entries, MONTHS, 'expense'), monthsInUse(entries), '2026-11')).toBe(40000);
  });

  it('Months in use: a month with only income counts as 0 for Saved', () => {
    const entries = [inc('2026-09-01', 100000), sav('2026-10-01', 30000)];
    expect(monthsInUse(entries)).toEqual(new Set(['2026-09', '2026-10']));
    expect(trendAverage(monthTotals(entries, MONTHS, 'savings'), monthsInUse(entries), '2026-11')).toBe(15000);
  });

  it('Only the current month in use: no average', () => {
    const entries = [exp('2026-11-02', 5000)];
    expect(trendAverage(monthTotals(entries, MONTHS, 'expense'), monthsInUse(entries), '2026-11')).toBeNull();
  });

  it('Average of zero: no average when earlier months have nothing of the kind', () => {
    const entries = [inc('2026-09-01', 100000), inc('2026-10-01', 100000)];
    expect(trendAverage(monthTotals(entries, MONTHS, 'savings'), monthsInUse(entries), '2026-11')).toBeNull();
  });

  it('Average: no entries at all gives no average', () => {
    expect(trendAverage(monthTotals([], MONTHS, 'expense'), monthsInUse([]), '2026-11')).toBeNull();
  });

  it('Average: a category average uses the same months in use rule', () => {
    const entries = [exp('2026-09-01', 30000, 'groceries'), exp('2026-10-01', 28000, 'groceries'), exp('2026-08-01', 5000, 'housing')];
    const totals = monthTotals(entries, MONTHS, 'expense', 'groceries');
    expect(totals.map((t) => t.cents)).toEqual([0, 0, 0, 30000, 28000, 0]);
    expect(trendAverage(totals, monthsInUse(entries), '2026-11')).toBe(Math.floor(58000 / 3));
  });

  it('Average: current month sentence says "So far, 700,00 € less than your average"', () => {
    expect(averageSentence(50000, 120000, true, eur, 'your average')).toBe('So far, 70000c less than your average');
  });

  it('Past month sentence: August says "200,00 € more than your average"', () => {
    expect(averageSentence(140000, 120000, false, eur, 'your average')).toBe('20000c more than your average');
  });

  it('About the average: within 5 % above or below says "About your average"', () => {
    expect(averageSentence(126000, 120000, false, eur, 'your average')).toBe('About your average');
    expect(averageSentence(114000, 120000, false, eur, 'your average')).toBe('About your average');
    expect(averageSentence(120000, 120000, false, eur, 'your average')).toBe('About your average');
  });

  it('About the average: just beyond 5 % is "more" or "less"', () => {
    expect(averageSentence(126001, 120000, false, eur, 'your average')).toMatch(/more than your average$/);
    expect(averageSentence(113999, 120000, false, eur, 'your average')).toMatch(/less than your average$/);
  });

  it('About the average: the current month starts with "So far, about your average"', () => {
    expect(averageSentence(120000, 120000, true, eur, 'your average')).toBe('So far, about your average');
  });

  it('Neutral: the sentence never uses judging words', () => {
    for (const cents of [0, 50000, 120000, 300000]) {
      expect(averageSentence(cents, 120000, false, eur, 'your average')).not.toMatch(/good|bad|over budget/i);
    }
  });
});

describe('US3 One category\'s history', () => {
  it('Sentence: "20,00 € more than usual", "About usual" and "So far," in the current month', () => {
    expect(averageSentence(31000, 29000, false, eur, 'usual')).toBe('2000c more than usual');
    expect(averageSentence(29000, 29000, false, eur, 'usual')).toBe('About usual');
    expect(averageSentence(31000, 29000, true, eur, 'usual')).toBe('So far, 2000c more than usual');
  });
});

describe('US4 Savings goals across months', () => {
  const PLAN = [{ effectiveMonth: '2026-01', savingsPercent: 20 }];
  // Income 1 000,00 € each month June-October => goal 200,00 €
  const base = ['06', '07', '08', '09', '10'].map((m) => inc(`2026-${m}-01`, 100000));
  const saved = [sav('2026-06-10', 20000), sav('2026-08-10', 25000), sav('2026-10-10', 20000)];

  it('Goal marks: a month with income has a goal of its plan percentage of its income; a month without income has none', () => {
    const goals = savingsGoals([...base, ...saved], MONTHS, PLAN);
    expect(goals.map((g) => g.goal)).toEqual([20000, 20000, 20000, 20000, 20000, null]);
  });

  it('Count: reached in June, August and October of June-October gives 3 of 5 with November not counted', () => {
    const goals = savingsGoals([...base, ...saved], MONTHS, PLAN);
    expect(goalCount(goals)).toEqual({ reached: 3, of: 5 });
  });

  it('Months that count: saved just under the goal is not reached', () => {
    const goals = savingsGoals([...base, sav('2026-06-10', 19999)], MONTHS, PLAN);
    expect(goalCount(goals)).toEqual({ reached: 0, of: 5 });
  });

  it('Months that count: November not reached yet still counts in the second number', () => {
    const goals = savingsGoals([...base, inc('2026-11-01', 100000)], MONTHS, PLAN);
    expect(goalCount(goals)).toEqual({ reached: 0, of: 6 });
  });

  it('No goals: a 0 % plan leaves no mark and of is 0', () => {
    const goals = savingsGoals(base, MONTHS, [{ effectiveMonth: '2026-01', savingsPercent: 0 }]);
    expect(goals.every((g) => g.goal === null)).toBe(true);
    expect(goalCount(goals).of).toBe(0);
  });
});

describe('Pesos never show cents: goals per month (032)', () => {
  const income = [inc('2026-11-05', 123456700)];
  const versions = [{ effectiveMonth: '2026-01', savingsPercent: 20 }];

  it('in pesos the goal is rounded down to the whole peso', () => {
    const goals = savingsGoals(income, MONTHS, versions, 100);
    expect(goals.at(-1)?.goal).toBe(24691300);
  });

  it('in other currencies it keeps the cent', () => {
    expect(savingsGoals(income, MONTHS, versions).at(-1)?.goal).toBe(24691340);
  });

  it('reached compares the savings with the rounded goal', () => {
    const entries = [...income, sav('2026-11-10', 24691300)];
    expect(savingsGoals(entries, MONTHS, versions, 100).at(-1)?.reached).toBe(true);
    expect(savingsGoals(entries, MONTHS, versions).at(-1)?.reached).toBe(false);
  });
});
