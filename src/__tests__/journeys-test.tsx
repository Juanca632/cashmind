import { fireEvent, screen, testRouter, within } from 'expo-router/testing-library';

import { exactText, reopenApp, startApp, type TestPlan } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
const choose = (name: string) => fireEvent.press(screen.getByRole('radio', { name }));
const TODAY: [number, number, number] = [2026, 10, 7];

async function record(part: 'Income' | 'Leisure' | 'Savings', amount: string, note?: string) {
  await press('Add expense');
  await choose(part);
  await type('Amount', amount);
  if (note) await type('Note (optional)', note);
  await press(part === 'Income' ? 'Add income' : part === 'Savings' ? 'Add to savings' : 'Add expense');
}

async function setUpPlan() {
  await startApp({ today: TODAY });
  await press('Set up my plan');
  const items: [string, string][] = [
    ['House', '700'],
    ['Transport', '60'],
    ['Phone', '20'],
    ['Supermarket', '250'],
  ];
  for (const [index, [name, amount]] of items.entries()) {
    if (index > 0) await press('Add fixed expense');
    await type(`Item ${index + 1} name`, name);
    await type(`Item ${index + 1} amount`, amount);
  }
  await press('Next');
  await type('Savings', '20');
  await press('Save plan');
}

describe('Journey: first-time setup, recording and reopening', () => {
  it('sets up the plan, records income, leisure and savings, and keeps everything after reopening', async () => {
    await setUpPlan();

    expect(screen).toHavePathname('/');
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByText(/short of your fixed expenses/)).not.toBeOnTheScreen();

    await record('Income', '2000', 'Salary');
    expect(screen.getByText(exactText('400 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('570 € left'))).toBeOnTheScreen();
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();

    await record('Leisure', '70', 'Cinema');
    expect(screen.getByText(exactText('500 € left'))).toBeOnTheScreen();

    await record('Savings', '100', 'Piggy bank');
    expect(screen.getByText(exactText('300 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('500 € left'))).toBeOnTheScreen();
    // The main figure is fixed expenses plus leisure, never savings.
    expect(screen.getByText(exactText('1 100'))).toBeOnTheScreen();
    expect(screen.getByText('Salary')).toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    expect(screen.getByText('Piggy bank')).toBeOnTheScreen();

    await reopenApp();
    expect(screen.getByText(exactText('300 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('500 € left'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 100'))).toBeOnTheScreen();
    expect(screen.getByText('Salary')).toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    expect(screen.getByText('Piggy bank')).toBeOnTheScreen();

    await press('My plan');
    await press('Edit fixed expenses');
    expect(screen.getByLabelText('Item 4 name')).toHaveDisplayValue('Supermarket');
    expect(screen.getByLabelText('Item 4 amount')).toHaveDisplayValue('250,00');
  });
});

describe('Journey: a new month, repeating income and browsing back', () => {
  const plan: TestPlan = {
    incomeCents: 200000,
    fixedItems: [{ name: 'House', amountCents: 103000 }],
    kept: 'savings',
    keptAmount: { unit: 'pct', pct: 20 },
  };

  it('repeats last month income, then browses to October and sees its own figures', async () => {
    await startApp({
      today: TODAY,
      plans: [[plan, '2026-10']],
      noIncome: true,
      expenses: [
        { date: '2026-10-01', bucket: 'income', amountCents: 200000, note: 'October salary' },
        { date: '2026-10-12', bucket: 'leisure', amountCents: 30000, note: 'October trip' },
      ],
    });
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();

    await press('Repeat last income');
    expect(await screen.findByText(exactText('400 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('570 € left'))).toBeOnTheScreen();
    expect(screen.queryByText('October trip')).not.toBeOnTheScreen();

    await press(/^Month:/);
    await press('Oct');
    expect(screen.getByText('October 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('October trip')).toBeOnTheScreen();
    expect(screen.getByText('October salary')).toBeOnTheScreen();
    expect(screen.getByText(exactText('270 € left'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('400 € to go'))).toBeOnTheScreen();
  });
});

describe('Journey: editing the fixed expenses from My plan', () => {
  const plan: TestPlan = {
    incomeCents: 200000,
    fixedItems: [
      { name: 'House', amountCents: 70000 },
      { name: 'Transport', amountCents: 33000 },
    ],
    kept: 'savings',
    keptAmount: { unit: 'pct', pct: 20 },
  };

  it('a raised House applies from this month and leaves past months untouched', async () => {
    await startApp({ today: TODAY, plans: [[plan, '2026-07']] });
    expect(screen.getByText(exactText('570 € left'))).toBeOnTheScreen();

    await press('My plan');
    await press('Edit fixed expenses');
    await type('Item 1 amount', '750');
    expect(screen.getByText(exactText('1 080,00 €'))).toBeOnTheScreen();
    await press('Save');
    expect(screen).toHavePathname('/plan');

    await testRouter.back();
    expect(screen.getByText(exactText('520 € left'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('400 € to go'))).toBeOnTheScreen();

    await press(/^Month:/);
    await press('Oct');
    expect(screen.getByText(exactText('570 € left'))).toBeOnTheScreen();
  });
});

describe('Journey: income edge cases', () => {
  const plan: TestPlan = {
    incomeCents: 200000,
    fixedItems: [{ name: 'House', amountCents: 103000 }],
    kept: 'savings',
    keptAmount: { unit: 'pct', pct: 20 },
  };

  it('No income and spending recorded: spending stays listed and the card keeps asking for income', async () => {
    await startApp({
      today: TODAY,
      plans: [[plan, '2026-11']],
      noIncome: true,
      expenses: [{ date: '2026-11-03', bucket: 'leisure', amountCents: 2500, note: 'Pizza' }],
    });

    expect(screen.getByText('Pizza')).toBeOnTheScreen();
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByText(/short of your fixed expenses/)).not.toBeOnTheScreen();
  });

  it('Deleting the only income sends the month back to asking for income, keeping its spending', async () => {
    await startApp({
      today: TODAY,
      plans: [[plan, '2026-11']],
      noIncome: true,
      expenses: [
        { date: '2026-11-01', bucket: 'income', amountCents: 200000, note: 'Pay' },
        { date: '2026-11-03', bucket: 'leisure', amountCents: 2500, note: 'Pizza' },
      ],
    });
    expect(screen.getByText(exactText('400 € to go'))).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Pay'));
    await press('Delete');
    await fireEvent.press(within(screen.getByTestId('confirm-dialog')).getByRole('button', { name: 'Delete' }));

    expect(screen).toHavePathname('/');
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.getByText('Pizza')).toBeOnTheScreen();
  });

  it('Saving an income of the same month returns to Home and Home shows no fixed tile', async () => {
    await startApp({ today: TODAY, plans: [[plan, '2026-11']], noIncome: true });
    await record('Income', '2000');

    expect(screen).toHavePathname('/');
    expect(screen.queryByRole('button', { name: 'Fixed' })).not.toBeOnTheScreen();
  });

  it('A past month with a plan accepts income, and a month before any plan does not offer it', async () => {
    await startApp({ today: TODAY, plans: [[plan, '2026-09']], noIncome: true });
    await press(/^Month:/);
    await press('Sep');
    await record('Income', '2500');
    expect(screen.getByText(exactText('500 € to go'))).toBeOnTheScreen();

    await press(/^Month:/);
    await press('Aug');
    expect(screen.queryByRole('button', { name: 'Add expense' })).not.toBeOnTheScreen();
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();
  });
});
