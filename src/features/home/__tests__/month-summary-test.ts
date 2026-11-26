import { monthFigures, monthSummary } from '../month-summary';

const totals = (income: number, savings: number, expense: number) => ({ income, savings, expense });

describe('monthSummary', () => {
  it('shows what is left after expenses and the savings goal', () => {
    expect(monthSummary(totals(200000, 15000, 90000), 20)).toEqual({
      income: 200000,
      saved: 15000,
      spent: 90000,
      goal: 40000,
      left: 70000,
    });
  });

  it('can go below zero', () => {
    expect(monthSummary(totals(100000, 0, 90000), 20).left).toBe(-10000);
  });

  it('counts savings above the goal as no longer available', () => {
    expect(monthSummary(totals(200000, 60000, 90000), 20).left).toBe(50000);
  });

  it('follows the income: several incomes add up and the goal grows', () => {
    expect(monthSummary(totals(250000, 0, 0), 20).goal).toBe(50000);
    expect(monthSummary(totals(80000, 0, 0), 30).goal).toBe(24000);
  });

  it('rounds the goal down to the cent', () => {
    expect(monthSummary(totals(100001, 0, 0), 20).goal).toBe(20000);
  });

  it('with 0 % there is no goal', () => {
    expect(monthSummary(totals(200000, 10000, 50000), 0)).toMatchObject({ goal: 0, left: 140000 });
  });

  it('when savings equal the goal exactly, nothing more is held back', () => {
    expect(monthSummary(totals(200000, 40000, 90000), 20).left).toBe(70000);
  });

  it('with no income and some spending, left is negative', () => {
    expect(monthSummary(totals(0, 0, 2500), 20)).toMatchObject({ goal: 0, left: -2500 });
  });

  it('savings above the goal with expenses can leave less than nothing', () => {
    expect(monthSummary(totals(100000, 90000, 20000), 20).left).toBe(-10000);
  });
});

describe('monthSummary with money moved into Main (028 FR-004)', () => {
  it('Story 1: income 2 000,00, spent 1 800,00, goal 0: left is 200,00 and 500,00 after 300,00 moved in', () => {
    expect(monthSummary(totals(200000, 0, 180000), 0).left).toBe(20000);
    expect(monthSummary(totals(200000, 0, 180000), 0, 30000).left).toBe(50000);
  });

  it('left = income + moved in - expenses - the larger of the goal and what was saved', () => {
    expect(monthSummary(totals(200000, 15000, 90000), 20, 10000).left).toBe(200000 + 10000 - 90000 - 40000);
    expect(monthSummary(totals(200000, 60000, 90000), 20, 10000).left).toBe(200000 + 10000 - 90000 - 60000);
  });

  it('Not income, not savings: income, saved, spent and goal are the same with or without it', () => {
    const withMoved = monthSummary(totals(200000, 15000, 90000), 20, 25000);
    expect(withMoved).toMatchObject({ income: 200000, saved: 15000, spent: 90000, goal: 40000 });
  });

  it('omitting it is the same as 0', () => {
    expect(monthSummary(totals(200000, 15000, 90000), 20)).toEqual(monthSummary(totals(200000, 15000, 90000), 20, 0));
  });
});

describe('Pesos never show cents: left to spend (032)', () => {
  it('income $ 1.234.567, spent $ 100.000, 20 %: goal $ 246.913 and left $ 887.654', () => {
    const summary = monthSummary(totals(123456700, 0, 10000000), 20, 0, 100);
    expect(summary.goal).toBe(24691300);
    expect(summary.left).toBe(88765400);
  });

  it('without a unit the goal keeps its cents: left is 887 653,60', () => {
    const summary = monthSummary(totals(123456700, 0, 10000000), 20);
    expect(summary.goal).toBe(24691340);
    expect(summary.left).toBe(88765360);
  });

  it('monthFigures passes the unit on', () => {
    const entries = [
      { kind: 'income', amountCents: 123456700, pocketId: null },
      { kind: 'expense', amountCents: 10000000, pocketId: null },
    ] as const;
    expect(monthFigures(entries, [], 20, '2026-11', 100).goal).toBe(24691300);
    expect(monthFigures(entries, [], 20, '2026-11', 100).left).toBe(88765400);
    expect(monthFigures(entries, [], 20, '2026-11').goal).toBe(24691340);
  });
});
