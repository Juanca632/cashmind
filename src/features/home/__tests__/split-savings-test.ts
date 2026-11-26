import { previousSplit, savedByPocket, shareOut, toSplit } from '../split-savings';

const saving = (date: string, pocketId: number | null, amountCents: number) => ({ date, kind: 'savings', amountCents, pocketId }) as const;
const other = (kind: 'income' | 'expense', date: string, amountCents: number, pocketId: number | null = null) =>
  ({ date, kind, amountCents, pocketId }) as const;

describe('See what is still to save this month - to split', () => {
  it('Card: a 400,00 goal with nothing saved leaves 40000 cents to split', () => {
    expect(toSplit(40000, 0)).toBe(40000);
  });

  it('Partly saved: 400,00 goal with 250,00 saved leaves 150,00', () => {
    expect(toSplit(40000, 25000)).toBe(15000);
  });

  it('Done: savings of the goal or more leave nothing to split, never a negative', () => {
    expect(toSplit(40000, 40000)).toBe(0);
    expect(toSplit(40000, 45000)).toBe(0);
  });
});

describe('See what is still to save this month - savings per pocket', () => {
  it('Done: counts the pockets with a saving this month and adds up several savings of one pocket', () => {
    const entries = [saving('2026-11-02', 1, 10000), saving('2026-11-10', 1, 5000), saving('2026-11-11', 2, 7000), saving('2026-11-12', 3, 1)];
    const byPocket = savedByPocket(entries, '2026-11');
    expect(byPocket.size).toBe(3);
    expect(byPocket.get(1)).toBe(15000);
    expect(byPocket.get(2)).toBe(7000);
    expect(byPocket.get(3)).toBe(1);
  });

  it('ignores other months, incomes and expenses', () => {
    const entries = [
      saving('2026-10-31', 1, 9999),
      saving('2026-12-01', 1, 8888),
      other('income', '2026-11-01', 200000),
      other('expense', '2026-11-03', 500, 1),
      saving('2026-11-05', 2, 100),
    ];
    expect([...savedByPocket(entries, '2026-11')]).toEqual([[2, 100]]);
  });

  it('is empty when nothing was saved', () => {
    expect(savedByPocket([], '2026-11').size).toBe(0);
  });
});

describe('Split it across pockets - last month', () => {
  it('Edge: last month is the most recent earlier month with savings, skipping months without', () => {
    const entries = [
      saving('2026-07-04', 1, 50000),
      saving('2026-09-04', 1, 20000),
      saving('2026-09-05', 2, 10000),
      other('income', '2026-10-01', 200000),
      saving('2026-11-02', 3, 99999),
    ];
    expect([...previousSplit(entries, '2026-11')].sort()).toEqual([
      [1, 20000],
      [2, 10000],
    ]);
  });

  it('uses each pocket\'s total savings in that month', () => {
    const entries = [saving('2026-10-02', 1, 10000), saving('2026-10-20', 1, 10000), saving('2026-10-21', 2, 10000)];
    const previous = previousSplit(entries, '2026-11');
    expect(previous.get(1)).toBe(20000);
    expect(previous.get(2)).toBe(10000);
  });

  it('only looks at months before the given one, even if later months have savings', () => {
    const entries = [saving('2026-12-02', 1, 10000), saving('2026-11-02', 1, 10000)];
    expect(previousSplit(entries, '2026-11').size).toBe(0);
  });

  it('No earlier split: with no earlier savings it is empty', () => {
    expect(previousSplit([], '2026-11').size).toBe(0);
    expect(previousSplit([saving('2026-11-02', 1, 100), other('expense', '2026-10-02', 100)], '2026-11').size).toBe(0);
  });

  it('works across a year boundary', () => {
    expect([...previousSplit([saving('2026-12-30', 4, 700)], '2027-01')]).toEqual([[4, 700]]);
  });
});

describe('Split it across pockets - the shares', () => {
  it('Same proportions as last month: 200 / 100 / 100 of 500,00 gives 250,00 / 125,00 / 125,00', () => {
    const previous = new Map([[1, 20000], [2, 10000], [3, 10000]]);
    expect(shareOut(50000, previous, [1, 2, 3])).toEqual([25000, 12500, 12500]);
  });

  it('Rounding: shares are rounded down to the cent and the remainder goes to the first pocket with a share', () => {
    // 100,00 over thirds: 3333 each, 1 cent left over goes to the first.
    const previous = new Map([[1, 100], [2, 100], [3, 100]]);
    expect(shareOut(10000, previous, [1, 2, 3])).toEqual([3334, 3333, 3333]);
  });

  it('Rounding: the remainder goes to the first pocket that has a share, not to a pocket with none', () => {
    const previous = new Map([[2, 100], [3, 100], [4, 100]]);
    const shares = shareOut(10000, previous, [1, 2, 3, 4]);
    expect(shares).toEqual([0, 3334, 3333, 3333]);
  });

  it('Rounding: the first pocket is the first in the pockets\' order, not in the previous split', () => {
    const previous = new Map([[9, 100], [5, 100], [7, 100]]);
    expect(shareOut(10000, previous, [5, 7, 9])).toEqual([3334, 3333, 3333]);
  });

  it('Rounding: the shares always add up exactly to the amount', () => {
    const previous = new Map([[1, 1], [2, 3], [3, 7], [4, 13]]);
    for (const amount of [1, 2, 99, 1000, 12345, 99999, 1234567]) {
      const shares = shareOut(amount, previous, [1, 2, 3, 4]);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(amount);
      expect(shares.every((s) => Number.isInteger(s) && s >= 0)).toBe(true);
    }
  });

  it('Rounding: a tiny amount goes whole to the first pocket with a share', () => {
    const previous = new Map([[1, 10], [2, 90]]);
    expect(shareOut(1, previous, [1, 2])).toEqual([1, 0]);
  });

  it('Rounding: a share of the previous split of a pocket that is no longer listed is ignored', () => {
    const previous = new Map([[1, 100], [99, 300]]);
    expect(shareOut(10000, previous, [1, 2])).toEqual([10000, 0]);
  });

  it('A pocket created this month: with no previous share it gets 0', () => {
    const previous = new Map([[1, 100], [2, 100]]);
    expect(shareOut(10000, previous, [1, 2, 3])).toEqual([5000, 5000, 0]);
  });

  it('No earlier split: every share is 0', () => {
    expect(shareOut(50000, new Map(), [1, 2, 3])).toEqual([0, 0, 0]);
  });

  it('No pockets: no shares', () => {
    expect(shareOut(50000, new Map([[1, 100]]), [])).toEqual([]);
  });

  it('an amount of 0 gives 0 for every pocket', () => {
    expect(shareOut(0, new Map([[1, 100]]), [1])).toEqual([0]);
  });

  it('big amounts stay exact to the cent', () => {
    const big = 900_000_000_000_000;
    const shares = shareOut(big, new Map([[1, 1], [2, 2]]), [1, 2]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(big);
    expect(shares).toEqual([300_000_000_000_000, 600_000_000_000_000]);
  });
});

describe('Pesos never show cents: Split shares (032 FR-003)', () => {
  it('thirds of $ 246.913 are whole pesos and the remainder goes to the first pocket', () => {
    const previous = new Map([[1, 100], [2, 100], [3, 100]]);
    const shares = shareOut(24691300, previous, [1, 2, 3], 100);
    expect(shares).toEqual([8230500, 8230400, 8230400]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(24691300);
  });

  it('every share is a multiple of 100 hundredths and they add up, whatever the weights', () => {
    const previous = new Map([[1, 1], [2, 3], [3, 7], [4, 13]]);
    const shares = shareOut(24691300, previous, [1, 2, 3, 4], 100);
    shares.forEach((share) => expect(share % 100).toBe(0));
    expect(shares.reduce((a, b) => a + b, 0)).toBe(24691300);
  });

  it('the remainder goes to the first pocket with a share, not to one with none', () => {
    const previous = new Map([[2, 100], [3, 100]]);
    expect(shareOut(10100, previous, [1, 2, 3], 100)).toEqual([0, 5100, 5000]);
  });

  it('without a unit, shares keep their cents', () => {
    const previous = new Map([[1, 100], [2, 100], [3, 100]]);
    expect(shareOut(10000, previous, [1, 2, 3])).toEqual([3334, 3333, 3333]);
  });
});
