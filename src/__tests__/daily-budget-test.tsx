import { screen } from 'expo-router/testing-library';

import { exactText, press, record, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

// A 0 % plan makes left to spend equal income minus expenses.
const NO_GOAL: [number, string][] = [[0, '2026-01']];
const income = (date: string, amountCents: number) =>
  ({ date, kind: 'income', amountCents, note: 'Salary' }) as const;
const expense = (date: string, amountCents: number) =>
  ({ date, kind: 'expense', amountCents, note: 'Rent' }) as const;

const card = () => screen.getByLabelText(/^Left to spend/);
const DAILY = /\/ day|Today: /;

describe('How much per day', () => {
  it('Per day: on 20 November with 420,00 € left the card says "≈ 38,18 € / day · 11 days left"', async () => {
    await startApp({ today: [2026, 10, 20], plans: NO_GOAL, entries: [income('2026-11-01', 42000)] });

    expect(screen.getByText(exactText('≈ 38,18 € / day · 11 days left'))).toBeOnTheScreen();
    expect(card().props.accessibilityLabel).toMatch(exactText('Left to spend: 420,00 €. ≈ 38,18 € / day · 11 days left'));
  });

  it('Last day: on 30 November with 25,00 € left the card says "Today: 25,00 €"', async () => {
    await startApp({ today: [2026, 10, 30], plans: NO_GOAL, entries: [income('2026-11-01', 2500)] });

    expect(screen.getByText(exactText('Today: 25,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText(/days left/)).not.toBeOnTheScreen();
  });

  it('Month with 31 days, first day: on 1 December with 310,00 € left the line is "≈ 10,00 € / day · 31 days left"', async () => {
    await startApp({ today: [2026, 11, 1], plans: NO_GOAL, entries: [income('2026-12-01', 31000)] });

    expect(screen.getByText(exactText('≈ 10,00 € / day · 31 days left'))).toBeOnTheScreen();
  });

  it('Overspent: with left to spend below 0 no daily line is shown', async () => {
    await startApp({
      today: [2026, 10, 20],
      plans: NO_GOAL,
      entries: [income('2026-11-01', 10000), expense('2026-11-05', 15000)],
    });

    expect(card().props.accessibilityLabel).toMatch(/^Left to spend: -50,00/);
    expect(screen.queryByText(DAILY)).not.toBeOnTheScreen();
    expect(card().props.accessibilityLabel).not.toMatch(DAILY);
  });

  it('Overspent: with left to spend exactly 0 no daily line is shown', async () => {
    await startApp({
      today: [2026, 10, 20],
      plans: NO_GOAL,
      entries: [income('2026-11-01', 10000), expense('2026-11-05', 10000)],
    });

    expect(card().props.accessibilityLabel).toMatch(/^Left to spend: 0,00/);
    expect(screen.queryByText(DAILY)).not.toBeOnTheScreen();
    expect(card().props.accessibilityLabel).not.toMatch(DAILY);
  });

  it('Past month: viewing a past month shows no daily line', async () => {
    await startApp({
      today: [2026, 10, 20],
      plans: NO_GOAL,
      entries: [income('2026-10-01', 42000), income('2026-11-01', 42000)],
    });
    expect(screen.getByText(/\/ day/)).toBeOnTheScreen();

    await press(/^Month:/);
    await press('Oct');

    expect(card().props.accessibilityLabel).toMatch(/^Left to spend: 420,00/);
    expect(screen.queryByText(DAILY)).not.toBeOnTheScreen();
    expect(card().props.accessibilityLabel).not.toMatch(DAILY);
  });

  it('No income: the card shows no daily line', async () => {
    await startApp({ today: [2026, 10, 20], plans: NO_GOAL });

    expect(screen.queryByText(DAILY)).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/\/ day/)).not.toBeOnTheScreen();
  });

  it('Follows changes: adding an expense of 22,00 € on 20 November with 420,00 € left gives "≈ 36,18 € / day · 11 days left"', async () => {
    await startApp({ today: [2026, 10, 20], plans: NO_GOAL, entries: [income('2026-11-01', 42000)] });
    expect(screen.getByText(exactText('≈ 38,18 € / day · 11 days left'))).toBeOnTheScreen();

    await record('Expense', '22');

    expect(screen.getByText(exactText('≈ 36,18 € / day · 11 days left'))).toBeOnTheScreen();
    expect(card().props.accessibilityLabel).toMatch(/^Left to spend: 398,00/);
  });
});
