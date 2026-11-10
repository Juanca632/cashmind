import { screen, within } from 'expo-router/testing-library';

import { exactText, expectLeftToSpend, press, startAppOnReleasedVersion } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const tile = (name: string) => within(screen.getByRole('button', { name }));

describe('App updates: opening the app on a database left by released version 3', () => {
  const data = `
    INSERT INTO plan_version VALUES ('2026-07', 'savings', 'pct', 25);
    INSERT INTO plan_version VALUES ('2026-10', 'savings', 'eur', 50000);
    INSERT INTO fixed_item (effective_month, name, amount_cents) VALUES ('2026-07', 'House', 90000);
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-09-01', 'income', 200000, 'Sep pay');
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-01', 'income', 200000, 'Salary');
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-02', 'fixed', 90000, 'Rent');
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-03', 'leisure', 5000, 'Cinema');
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-04', 'savings', 15000, 'Piggy bank');
  `;

  it('Fixed and leisure entries count as expenses, savings stay savings, and a plan that was not a savings percentage becomes 20 %', async () => {
    await startAppOnReleasedVersion([2026, 10, 7], 3, data);

    expect(await screen.findByText('Left to spend')).toBeOnTheScreen();
    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('950 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('150 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 400 €'))).toBeOnTheScreen();
    expectLeftToSpend('650,00 €');
    expect(screen.getByText('Rent')).toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
  });

  it('A savings percentage keeps applying to the months it covered', async () => {
    await startAppOnReleasedVersion([2026, 10, 7], 3, data);
    await screen.findByText('Left to spend');

    await press(/^Month:/);
    await press('Sep');

    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 500 €'))).toBeOnTheScreen();
  });
});
