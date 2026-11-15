import { paceAt, paceSentence, spendingPace } from '../month-summary';

const NOV_14 = new Date(2026, 10, 14, 12);
const e = (date: string, amountCents: number, recurringId: number | null = null, kind: 'expense' | 'income' | 'savings' = 'expense') =>
  ({ date, kind, amountCents, recurringId });
const RENT = e('2026-11-01', 90000, 1);
const NOV = [RENT, e('2026-11-03', 10000), e('2026-11-10', 24000)];
const eur = (cents: number) => `${cents}c`;

describe('US1 See the month\'s spending pace', () => {
  it('Spending curve: Rent 900,00 € on the 1st, 100,00 € on the 3rd and 240,00 € on the 10th add up day by day until today', () => {
    const pace = spendingPace(NOV, 160000, '2026-11', NOV_14);

    expect(pace.lastDay).toBe(14);
    expect(pace.steps).toHaveLength(14);
    const at = (d: number) => pace.steps.find((s) => s.day === d)!.cents;
    expect(at(1)).toBe(90000);
    expect(at(2)).toBe(90000);
    expect(at(3)).toBe(100000);
    expect(at(9)).toBe(100000);
    expect(at(10)).toBe(124000);
    expect(at(14)).toBe(124000);
    expect(pace.spentCents).toBe(124000);
  });

  it('Pace line: income 2 000,00 € and 20 % plan goes from 900,00 € to 1 600,00 € over 30 days; on day 14 it is 1 226,66 €', () => {
    const pace = spendingPace(NOV, 160000, '2026-11', NOV_14);

    expect(pace.daysInMonth).toBe(30);
    expect(pace.startCents).toBe(90000);
    expect(pace.endCents).toBe(160000);
    expect(pace.paceTodayCents).toBe(122666);
    expect(paceAt(pace, 14)).toBe(122666);
    expect(paceAt(pace, 30)).toBe(160000);
    expect(paceAt(pace, 0)).toBe(90000);
  });

  it('Pace line: a 31-day month is divided by 31 and rounded down to the cent', () => {
    expect(paceAt({ startCents: 0, endCents: 10000, daysInMonth: 31 }, 1)).toBe(322);
  });

  it('Sentence, under: 1 240,00 € spent against 1 226,66 € says "13,34 € over your pace"', () => {
    expect(paceSentence(124000, 122666, eur)).toBe('1334c over your pace');
  });

  it('Sentence, under: 1 200,00 € spent against 1 226,66 € says "26,66 € under your pace"', () => {
    expect(paceSentence(120000, 122666, eur)).toBe('2666c under your pace');
  });

  it('Sentence, under: the same amount says "Right on your pace"', () => {
    expect(paceSentence(122666, 122666, eur)).toBe('Right on your pace');
  });

  it('Savings above the goal: saving 500,00 € with a 400,00 € goal ends the line at 1 500,00 €', () => {
    // The spendable amount given is income minus the larger of goal and saved.
    const pace = spendingPace(NOV, 150000, '2026-11', NOV_14);
    expect(pace.endCents).toBe(150000);
    expect(paceAt(pace, 30)).toBe(150000);
  });

  it('No fixed costs: nothing repeats, so the line starts at 0 € on the 1st', () => {
    const pace = spendingPace([e('2026-11-03', 10000)], 160000, '2026-11', NOV_14);
    expect(pace.startCents).toBe(0);
    expect(paceAt(pace, 30)).toBe(160000);
    expect(pace.steps[0].cents).toBe(0);
  });

  it('Past month: the whole month is drawn and there is no pace for today', () => {
    const pace = spendingPace(NOV, 160000, '2026-10', new Date(2026, 10, 14, 12));
    expect(pace.paceTodayCents).toBeNull();

    const nov = spendingPace(NOV, 160000, '2026-11', new Date(2026, 11, 4, 12));
    expect(nov.paceTodayCents).toBeNull();
    expect(nov.lastDay).toBe(30);
    expect(nov.steps).toHaveLength(30);
    expect(nov.steps[29].cents).toBe(124000);
    expect(nov.spentCents).toBe(124000);
  });
});

describe('Edge cases', () => {
  it('Fixed costs above the budget: the line is flat at the fixed costs', () => {
    const pace = spendingPace([e('2026-11-01', 150000, 1)], 100000, '2026-11', NOV_14);
    expect(pace.startCents).toBe(150000);
    expect(pace.endCents).toBe(150000);
    expect(paceAt(pace, 1)).toBe(150000);
    expect(paceAt(pace, 14)).toBe(150000);
    expect(paceAt(pace, 30)).toBe(150000);
  });

  it('Expense on a day before today with no others: the curve stays flat between entries', () => {
    const pace = spendingPace([e('2026-11-05', 5000)], 100000, '2026-11', NOV_14);
    expect(pace.steps.slice(0, 4).map((s) => s.cents)).toEqual([0, 0, 0, 0]);
    expect(pace.steps.slice(4).every((s) => s.cents === 5000)).toBe(true);
  });

  it('First day: the curve is one point and the pace is the start plus one day of the slope', () => {
    const pace = spendingPace([RENT], 160000, '2026-11', new Date(2026, 10, 1, 12));
    expect(pace.steps).toEqual([{ day: 1, cents: 90000 }]);
    expect(pace.paceTodayCents).toBe(90000 + 2333);
  });

  it('Savings and income: never part of the curve, only expenses are', () => {
    const pace = spendingPace(
      [e('2026-11-01', 200000, null, 'income'), e('2026-11-02', 50000, null, 'savings'), e('2026-11-03', 7000)],
      160000,
      '2026-11',
      NOV_14,
    );
    expect(pace.spentCents).toBe(7000);
    expect(pace.steps[1].cents).toBe(0);
  });

  it('Entries of other months are not part of the curve or the start', () => {
    const pace = spendingPace([e('2026-10-31', 99900, 1), e('2026-11-04', 1000)], 160000, '2026-11', NOV_14);
    expect(pace.startCents).toBe(0);
    expect(pace.spentCents).toBe(1000);
  });

  it('Entries edited to another day: the curve follows the entries\' dates', () => {
    const pace = spendingPace([e('2026-11-12', 3000)], 160000, '2026-11', NOV_14);
    expect(pace.steps[10].cents).toBe(0);
    expect(pace.steps[11].cents).toBe(3000);
  });
});
