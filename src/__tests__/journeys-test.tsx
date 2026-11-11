import { screen, within } from 'expo-router/testing-library';

import {
  answerDialog,
  choose,
  exactText,
  expectLeftToSpend,
  press,
  record,
  reopenApp,
  startApp,
  type,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const tile = (name: string) => within(screen.getByRole('button', { name }));

describe('Journey: first use, recording income, savings and expenses, changing the plan and reopening', () => {
  it('goes from an empty app to the left to spend, keeps it after reopening and follows a new percentage', async () => {
    await startApp({ today: [2026, 10, 7] });

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    await press('Add income');
    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Income' })).toBeSelected();
    await type('Amount', '2000');
    await type('Note (optional)', 'Salary');
    await press('Add income');

    expect(screen).toHavePathname('/');
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();
    await expectLeftToSpend('1 600,00 €');
    expect(tile('Savings').getByText(exactText('of 400 €'))).toBeOnTheScreen();

    await record('Expense', '900', 'Rent');
    await expectLeftToSpend('700,00 €');

    await record('Savings', '150', 'Piggy bank');
    await expectLeftToSpend('700,00 €');
    expect(tile('Savings').getByText(exactText('150 €'))).toBeOnTheScreen();

    await record('Savings', '450', 'Bonus saved');
    expect(tile('Savings').getByText('Goal reached')).toBeOnTheScreen();
    await expectLeftToSpend('500,00 €');

    await reopenApp();
    await expectLeftToSpend('500,00 €');
    expect(screen.getByText('Salary')).toBeOnTheScreen();
    expect(screen.getByText('Rent')).toBeOnTheScreen();
    expect(screen.getByText('Piggy bank')).toBeOnTheScreen();

    await press('My plan');
    await type('Savings percentage', '80');
    await press('Save plan');
    expect(screen).toHavePathname('/');
    expect(tile('Savings').getByText(exactText('of 1 600 €'))).toBeOnTheScreen();
    // The goal (1600,00 €) is now above what was saved (600,00 €).
    await expectLeftToSpend('-500,00 €');
  });
});

describe('Journey: a new month, repeating the last income and browsing back', () => {
  it('repeats the income of last month, keeps last month untouched and returns to the current month', async () => {
    await startApp({
      today: [2026, 11, 2],
      plans: [[25, '2026-07']],
      entries: [
        { date: '2026-11-01', kind: 'income', amountCents: 150000, note: 'November salary' },
        { date: '2026-11-04', kind: 'expense', amountCents: 30000, note: 'November trip' },
      ],
    });
    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByText('November trip')).not.toBeOnTheScreen();

    await press('Repeat last income');

    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();
    expect(tile('Income').getByText(exactText('1 500 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 375 €'))).toBeOnTheScreen();
    await expectLeftToSpend('1 125,00 €');
    expect(screen.queryByText('November trip')).not.toBeOnTheScreen();

    await press(/^Month:/);
    await press('Nov');
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('November trip')).toBeOnTheScreen();
    expect(tile('Income').getByText(exactText('1 500 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 375 €'))).toBeOnTheScreen();
    await expectLeftToSpend('825,00 €');

    await press('Back to current month');
    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    await expectLeftToSpend('1 125,00 €');
  });
});

describe('Journey: income edge cases', () => {
  it('Deleting the only income sends the month back to asking for income, keeping its spending', async () => {
    await startApp({
      today: [2026, 10, 7],
      entries: [
        { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Pay' },
        { date: '2026-11-03', kind: 'expense', amountCents: 2500, note: 'Pizza' },
      ],
    });
    await expectLeftToSpend('1 575,00 €');

    await press(/Pay/);
    await press('Delete');
    await answerDialog('Delete');

    expect(screen).toHavePathname('/');
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.getByText('Pizza')).toBeOnTheScreen();
  });

  it('A past month without income accepts one, and its figures appear there only', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[30, '2026-07']], entries: [
      { date: '2026-09-10', kind: 'expense', amountCents: 10000, note: 'Gift' },
    ] });
    await press(/^Month:/);
    await press('Sep');
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();

    await press('Add income');
    await type('Amount', '2500');
    await press('Add income');

    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 750 €'))).toBeOnTheScreen();
    await expectLeftToSpend('1 650,00 €');

    await press('Back to current month');
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
  });

  it('The kind chosen in the form can be switched before saving', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Add income');
    await choose('Expense');
    await type('Amount', '9');
    await press('Add expense');

    expect(screen.getByText(exactText('9,00 €'))).toBeOnTheScreen();
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
  });
});
