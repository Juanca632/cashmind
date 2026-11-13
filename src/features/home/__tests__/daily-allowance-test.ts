import { dailyAllowance } from '../month-summary';

const NOV = '2026-11';

describe('How much per day', () => {
  it('Per day: 20 November with 420,00 € left is 38,18 € for 11 days', () => {
    expect(dailyAllowance(42000, new Date(2026, 10, 20, 12), NOV)).toEqual({ cents: 3818, daysLeft: 11 });
  });

  it('Last day: 30 November with 25,00 € left is 25,00 € for 1 day', () => {
    expect(dailyAllowance(2500, new Date(2026, 10, 30, 12), NOV)).toEqual({ cents: 2500, daysLeft: 1 });
  });

  it('Month with 31 days, first day: 1 December with 310,00 € left is 10,00 € for 31 days', () => {
    expect(dailyAllowance(31000, new Date(2026, 11, 1, 12), '2026-12')).toEqual({ cents: 1000, daysLeft: 31 });
  });

  it('Follows changes: 20 November with 398,00 € left is 36,18 € for 11 days', () => {
    expect(dailyAllowance(39800, new Date(2026, 10, 20, 12), NOV)).toEqual({ cents: 3618, daysLeft: 11 });
  });

  it.each([0, -1, -10000])('Overspent: %i cents left gives no daily amount', (left) => {
    expect(dailyAllowance(left, new Date(2026, 10, 20, 12), NOV)).toBeNull();
  });

  it('Past month: no daily amount', () => {
    expect(dailyAllowance(42000, new Date(2026, 10, 20, 12), '2026-10')).toBeNull();
  });

  it('Future month: no daily amount', () => {
    expect(dailyAllowance(42000, new Date(2026, 10, 20, 12), '2026-12')).toBeNull();
  });

  it('Daily amount with cents: 1 cent left on 20 November rounds down to 0 cents', () => {
    expect(dailyAllowance(1, new Date(2026, 10, 20, 12), NOV)).toEqual({ cents: 0, daysLeft: 11 });
  });

  it('SC-002: the daily amount times the days left is never more than left to spend', () => {
    for (const day of [1, 7, 15, 20, 29, 30]) {
      for (const left of [1, 99, 100, 12345, 42000, 99999, 1000001]) {
        const result = dailyAllowance(left, new Date(2026, 10, day, 12), NOV)!;
        expect(result.cents * result.daysLeft).toBeLessThanOrEqual(left);
        expect((result.cents + 1) * result.daysLeft).toBeGreaterThan(left);
      }
    }
  });
});
