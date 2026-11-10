import { monthSummary } from '../month-summary';

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
