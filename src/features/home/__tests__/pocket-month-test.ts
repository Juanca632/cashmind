import type { Entry, Move, Pocket } from '@/features/entries/rules';

import { balanceSentence, pocketMonth } from '../pocket-month';

const NOV_14 = new Date(2026, 10, 14, 12);
const POCKET: Pocket = { id: 2, name: 'Japan trip', startingCents: 50000, emoji: '', color: 'blue' };
const entry = (date: string, kind: 'savings' | 'expense', amountCents: number) =>
  ({ id: 1, date, kind, amountCents, note: '', category: 'other', recurringId: null, pocketId: POCKET.id, pocketName: POCKET.name, pocketEmoji: null }) as Entry;
const move = (date: string, amountCents: number, fromPocketId: number, toPocketId: number | null) =>
  ({ id: 1, date, amountCents, note: '', fromPocketId, fromName: 'x', fromEmoji: '', toPocketId, toName: null, toEmoji: null }) as Move;
const eur = (cents: number) => `${cents}c`;
const at = (steps: { day: number; cents: number }[], day: number) => steps.find((s) => s.day === day)!.cents;

describe('See how a pocket moved this month', () => {
  it('Line: starts at what the pocket held at the end of last month (starting amount plus everything dated before this month)', () => {
    const month = pocketMonth(
      POCKET,
      [entry('2026-10-10', 'savings', 20000), entry('2026-10-20', 'expense', 5000)],
      [move('2026-10-25', 3000, 2, null), move('2026-10-26', 1000, 7, 2)],
      NOV_14,
    );

    expect(month.startCents).toBe(50000 + 20000 - 5000 - 3000 + 1000);
  });

  it('Line: one point per day from the 1st to today, the balance at the end of that day', () => {
    const month = pocketMonth(POCKET, [], [], NOV_14);

    expect(month.daysInMonth).toBe(30);
    expect(month.steps).toHaveLength(14);
    expect(month.steps.map((s) => s.day)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
  });

  it('Line: savings raise it, expenses and moves out lower it, moves in raise it, each on its own day', () => {
    const month = pocketMonth(
      POCKET,
      [entry('2026-11-02', 'savings', 25000), entry('2026-11-05', 'expense', 4000)],
      [move('2026-11-08', 10000, 2, null), move('2026-11-10', 7000, 9, 2), move('2026-11-11', 999, 8, 9)],
      NOV_14,
    );

    expect(month.startCents).toBe(50000);
    expect(at(month.steps, 1)).toBe(50000);
    expect(at(month.steps, 2)).toBe(75000);
    expect(at(month.steps, 4)).toBe(75000);
    expect(at(month.steps, 5)).toBe(71000);
    expect(at(month.steps, 7)).toBe(71000);
    expect(at(month.steps, 8)).toBe(61000);
    expect(at(month.steps, 9)).toBe(61000);
    expect(at(month.steps, 10)).toBe(68000);
    expect(at(month.steps, 14)).toBe(68000);
    expect(month.endCents).toBe(68000);
  });

  it('Line: a move out to another pocket lowers the balance too', () => {
    const month = pocketMonth(POCKET, [], [move('2026-11-03', 12000, 2, 5)], NOV_14);

    expect(at(month.steps, 2)).toBe(50000);
    expect(at(month.steps, 3)).toBe(38000);
  });

  it('Line: several things on one day all count at the end of that day', () => {
    const month = pocketMonth(POCKET, [entry('2026-11-06', 'savings', 10000), entry('2026-11-06', 'expense', 2500)], [move('2026-11-06', 500, 2, null)], NOV_14);

    expect(at(month.steps, 5)).toBe(50000);
    expect(at(month.steps, 6)).toBe(57000);
  });

  it('Line: things dated after today are not drawn and do not count in today\'s value', () => {
    const month = pocketMonth(POCKET, [entry('2026-11-20', 'savings', 99900)], [move('2026-11-25', 100, 2, null)], NOV_14);

    expect(month.steps).toHaveLength(14);
    expect(month.endCents).toBe(50000);
  });

  it('Line: today\'s own entries count in today\'s value', () => {
    const month = pocketMonth(POCKET, [entry('2026-11-14', 'savings', 1000)], [], NOV_14);

    expect(at(month.steps, 14)).toBe(51000);
    expect(month.endCents).toBe(51000);
  });

  it('Below zero: the value goes below zero and below the start (an expense of 700,00 € from a pocket holding 500,00 €)', () => {
    const month = pocketMonth(POCKET, [entry('2026-11-04', 'expense', 70000)], [], NOV_14);

    expect(at(month.steps, 4)).toBe(-20000);
    expect(month.endCents).toBe(-20000);
    expect(month.startCents).toBe(50000);
  });

  it('Nothing this month: with no savings, expenses or moves the line is flat at the start', () => {
    const month = pocketMonth(POCKET, [entry('2026-09-01', 'savings', 1000)], [move('2026-10-01', 200, 2, null), move('2026-11-02', 300, 8, 9)], NOV_14);

    expect(month.startCents).toBe(50000 + 1000 - 200);
    expect(month.steps.every((s) => s.cents === month.startCents)).toBe(true);
    expect(month.endCents).toBe(month.startCents);
  });

  it('Starting amount: counts before this month, never again as a step', () => {
    const month = pocketMonth({ ...POCKET, startingCents: 170000 }, [], [], NOV_14);

    expect(month.startCents).toBe(170000);
    expect(month.endCents).toBe(170000);
  });

  it('New pocket this month: starts at its starting amount, 0 when none', () => {
    const fresh = { ...POCKET, startingCents: 0 };
    const month = pocketMonth(fresh, [entry('2026-11-03', 'savings', 8000)], [], NOV_14);

    expect(month.startCents).toBe(0);
    expect(at(month.steps, 2)).toBe(0);
    expect(at(month.steps, 3)).toBe(8000);
  });

  it('Month edges: on the 1st there is one point; on 30 November the month has 30 days and 30 points', () => {
    expect(pocketMonth(POCKET, [entry('2026-11-01', 'savings', 100)], [], new Date(2026, 10, 1, 9)).steps).toEqual([{ day: 1, cents: 50100 }]);
    const last = pocketMonth(POCKET, [], [], new Date(2026, 10, 30, 9));
    expect(last.steps).toHaveLength(30);
    expect(pocketMonth(POCKET, [], [], new Date(2028, 1, 10)).daysInMonth).toBe(29);
  });
});

describe('Sentence', () => {
  it('Up: "Up 250,00 € this month" when the change is positive', () => {
    expect(balanceSentence(25000, eur)).toBe('Up 25000c this month');
  });

  it('Down: "Down 50,00 € this month" shows the amount without a minus sign', () => {
    expect(balanceSentence(-5000, eur)).toBe('Down 5000c this month');
  });

  it('No change: "No change this month" at zero', () => {
    expect(balanceSentence(0, eur)).toBe('No change this month');
  });

  it('Up by one cent is still up', () => {
    expect(balanceSentence(1, eur)).toBe('Up 1c this month');
  });
});
