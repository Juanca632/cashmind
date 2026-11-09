import { router } from 'expo-router';
import { AppState } from 'react-native';
import { act, fireEvent, screen, testRouter } from 'expo-router/testing-library';

import type { IncomePlan } from '@/features/plan/rules';

import { answerDialog, exactText, partialText, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
const expectSaveDisabled = () => expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();

const TODAY: [number, number, number] = [2026, 10, 7];

/** 2000 € income, four items totalling 1030 €, savings 20 %. */
const fullPlan: IncomePlan = {
  incomeCents: 200000,
  fixedItems: [
    { name: 'House', amountCents: 70000 },
    { name: 'Transport', amountCents: 6000 },
    { name: 'Phone', amountCents: 2000 },
    { name: 'Supermarket', amountCents: 25000 },
  ],
  kept: 'savings',
  keptAmount: { unit: 'pct', pct: 20 },
};

async function fillList(items: [string, string][]) {
  for (const [index, [name, amount]] of items.entries()) {
    if (index > 0) await press('Add fixed expense');
    await type(`Item ${index + 1} name`, name);
    await type(`Item ${index + 1} amount`, amount);
  }
}

const FOUR_ITEMS: [string, string][] = [
  ['House', '700'],
  ['Transport', '60'],
  ['Phone', '20'],
  ['Supermarket', '250'],
];

describe('List what I must pay every month', () => {
  it('Build the list', async () => {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await fillList(FOUR_ITEMS);

    expect(screen.getByText(exactText('1 030,00 €'))).toBeOnTheScreen();
  });

  it('Change an item', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await type('Item 1 amount', '750');

    expect(screen.getByText(exactText('1 080,00 €'))).toBeOnTheScreen();
  });

  it('Remove an item', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await press('Remove item 3');
    await answerDialog('Remove');

    expect(screen.getByText(exactText('1 010,00 €'))).toBeOnTheScreen();
  });

  it.each([
    ['no name', '', '100'],
    ['an empty amount', 'House', ''],
    ['a zero amount', 'House', '0'],
    ['a negative amount', 'House', '-5'],
  ])('Invalid item with %s', async (_label, name, amount) => {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await type('Income', '2000');
    await type('Item 1 name', name);
    await type('Item 1 amount', amount);

    expect(screen.getByText(/needs a name and an amount/)).toBeOnTheScreen();
    expectSaveDisabled();
  });

  it('No fixed expenses', async () => {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await type('Income', '2000');
    await press('Save plan');

    expect(screen.getByText('Fixed')).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 €'))).toBeOnTheScreen();
  });
});

describe('Split only what is left', () => {
  async function openWithList() {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await fillList(FOUR_ITEMS);
    await type('Income', '2000');
  }

  it('What is left', async () => {
    await openWithList();

    expect(screen.getByText(partialText('970,00 € left after fixed expenses'))).toBeOnTheScreen();
  });

  it('Split what is left', async () => {
    await openWithList();
    await type('Savings', '20');

    expect(screen.getByText('= 400,00 €')).toBeOnTheScreen();
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('28,5');
    expect(screen.getByText('= 570,00 €')).toBeOnTheScreen();
  });

  it('Adjust by trial and error', async () => {
    await openWithList();
    await type('Savings', '20');
    await type('Wants', '30');

    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('18,5');
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('30');
  });

  it('List above the income', async () => {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await fillList(FOUR_ITEMS);
    await type('Income', '1000');

    expect(screen.getByText(partialText('30,00 € over your income'))).toBeOnTheScreen();
    expectSaveDisabled();
  });

  it('Reference, not a rule', async () => {
    await openWithList();

    expect(screen.getByText(/^Suggested 20.%$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Suggested 28,5.%$/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('20');
  });

  it('Savings and wants have no euro switch', async () => {
    await openWithList();

    expect(screen.queryByRole('radio', { name: /in euros/ })).not.toBeOnTheScreen();
  });
});

describe('See the plan apart from changing it', () => {
  it('The plan is shown with nothing to change', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');

    expect(screen.getByText('Monthly income')).toBeOnTheScreen();
    expect(screen.getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 030 €'))).toBeOnTheScreen();
    expect(screen.getByText(/^51,5.%$/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Edit plan' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: "Change this month's income" })).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Item 1 name')).not.toBeOnTheScreen();
  });

  it('Changing it happens on another screen', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');

    expect(screen).toHavePathname('/plan-edit');
    expect(screen.getByLabelText('Item 1 name')).toHaveDisplayValue('House');
  });

  it('Saving goes back to Home', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await type('Income', '2500');
    await press('Save plan');

    expect(screen).toHavePathname('/');
  });
});

describe('Fixed expenses do not follow the income', () => {
  it('Higher income', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await type('Income', '2500');
    await press('Save plan');

    expect(screen.getByText(exactText('1 030 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 / 500'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 / 970'))).toBeOnTheScreen();
  });

  it('One different month', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']], overrides: { '2026-11': 300000 } });

    expect(screen.getByText(exactText('1 030 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 / 600'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 / 1 370'))).toBeOnTheScreen();
  });

  it('Changes apply onwards', async () => {
    await startApp({ today: [2026, 11, 8], plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await type('Item 1 amount', '750');
    await press('Save plan');
    expect(screen.getByText(exactText('1 080 €'))).toBeOnTheScreen();

    await press(/^Month:/);
    await press('Nov');
    expect(screen.getByText(exactText('1 030 €'))).toBeOnTheScreen();
  });

  it('Next month repeats', async () => {
    await startApp({ today: [2026, 11, 8], plans: [[fullPlan, '2026-11']] });

    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 030 €'))).toBeOnTheScreen();
  });
});

describe('Fixed expenses count by themselves', () => {
  it('Nothing to record', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });

    expect(screen.getByText(exactText('1 030 €'))).toBeOnTheScreen();
    expect(screen.queryByText(exactText('1 030,00 € left'))).not.toBeOnTheScreen();
    expect(screen.queryByText(/over$/)).not.toBeOnTheScreen();
  });

  it('See the list', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press(/^Fixed/);

    for (const name of ['House', 'Transport', 'Phone', 'Supermarket']) {
      expect(screen.getByText(name)).toBeOnTheScreen();
    }
    expect(screen.getByText(exactText('700,00 €'))).toBeOnTheScreen();
  });

  it("A past month's list", async () => {
    const december: IncomePlan = {
      ...fullPlan,
      fixedItems: [{ name: 'House', amountCents: 75000 }, ...fullPlan.fixedItems.slice(1)],
    };
    await startApp({ today: [2026, 11, 8], plans: [[fullPlan, '2026-07'], [december, '2026-12']] });
    await press(/^Month:/);
    await press('Nov');
    await press(/^Fixed/);

    expect(screen.getByText(exactText('700,00 €'))).toBeOnTheScreen();
  });

  it('Saving is not spending', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Add expense');
    expect(screen.queryByRole('radio')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeOnTheScreen();

    await testRouter.back();
    await press('Add savings');
    expect(screen.queryByRole('radio')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add to savings' })).toBeOnTheScreen();
  });

  it('An existing entry can be moved between parts', async () => {
    await startApp({
      today: TODAY,
      plans: [[fullPlan, '2026-07']],
      expenses: [{ date: '2026-11-02', bucket: 'leisure', amountCents: 1500, note: 'Dinner' }],
    });
    await fireEvent.press(screen.getByText('Dinner'));

    expect(screen.getByRole('radio', { name: 'Savings' })).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Fixed' })).not.toBeOnTheScreen();
  });

  it('An expense already recorded as fixed keeps its part', async () => {
    await startApp({
      today: TODAY,
      plans: [[fullPlan, '2026-07']],
      expenses: [{ date: '2026-11-02', bucket: 'fixed', amountCents: 70000, note: 'Old rent' }],
    });
    await fireEvent.press(screen.getByText('Old rent'));

    expect(screen.getByRole('radio', { name: 'Fixed', selected: true })).toBeOnTheScreen();
  });

  it('Parts on screen', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');

    for (const part of ['Fixed', 'Wants', 'Savings']) expect(screen.getByText(part)).toBeOnTheScreen();
  });
});

describe('Nothing is lost by a mistaken tap', () => {
  it('Removing an item asks first and can be cancelled', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await press('Remove item 3');

    expect(screen.getByText('Remove this expense?')).toBeOnTheScreen();
    await answerDialog('Cancel');

    expect(screen.queryByText('Remove this expense?')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Item 3 name')).toHaveDisplayValue('Phone');
  });

  it('An empty row is removed without asking', async () => {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await press('Remove item 1');

    expect(screen.queryByTestId('confirm-dialog')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Item 1 name')).not.toBeOnTheScreen();
  });

  it('Leaving with changes asks first and can keep editing', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await type('Income', '2500');
    await act(async () => router.back());

    expect(screen.getByText('Discard changes?')).toBeOnTheScreen();
    await answerDialog('Keep editing');

    expect(screen).toHavePathname('/plan-edit');
    expect(screen.getByLabelText('Income')).toHaveDisplayValue('2500');
  });

  it('Discarding leaves without saving', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await type('Income', '2500');
    await act(async () => router.back());
    await answerDialog('Discard');

    expect(screen).toHavePathname('/');
    await press('My plan');
    expect(screen.getByText(exactText('2 000 €'))).toBeOnTheScreen();
  });

  it('Leaving without changes does not ask', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await act(async () => router.back());

    expect(screen.queryByTestId('confirm-dialog')).not.toBeOnTheScreen();
    expect(screen).toHavePathname('/');
  });

  it('Saving does not ask', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await type('Income', '2500');
    await press('Save plan');

    expect(screen.queryByTestId('confirm-dialog')).not.toBeOnTheScreen();
    expect(screen).toHavePathname('/');
  });

  it('Deleting an expense can be cancelled', async () => {
    await startApp({
      today: TODAY,
      plans: [[fullPlan, '2026-07']],
      expenses: [{ date: '2026-11-02', bucket: 'leisure', amountCents: 1500, note: 'Dinner' }],
    });
    await fireEvent.press(screen.getByText('Dinner'));
    await press('Delete');
    await answerDialog('Cancel');

    expect(screen).toHavePathname('/expense');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeOnTheScreen();
  });
});

describe('The app says what to do next', () => {
  const withExpense = {
    today: TODAY,
    plans: [[fullPlan, '2026-07']] as [IncomePlan, string][],
    expenses: [{ date: '2026-11-02', bucket: 'leisure', amountCents: 1500, note: 'Dinner' }] as const,
  };

  it('An empty month explains what to record', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });

    expect(screen.getByText(/Fixed expenses are already counted/)).toBeOnTheScreen();
  });

  it('An empty part says so', async () => {
    await startApp({ ...withExpense, expenses: [...withExpense.expenses] });
    await press('Savings');

    expect(screen.getByText('Nothing in Savings this month.')).toBeOnTheScreen();
  });

  it('Edit plan is one tap from home', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');

    expect(screen).toHavePathname('/plan-edit');
  });

  it('Spending and saving are separate actions', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });

    expect(screen.getByRole('button', { name: 'Add expense' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add savings' })).toBeOnTheScreen();
  });

  it('Past months have no way to edit the plan', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press(/^Month:/);
    await press('Sep');

    expect(screen.queryByRole('button', { name: 'Edit plan' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeOnTheScreen();
  });

  it('Activity says the day of each entry', async () => {
    await startApp({
      today: TODAY,
      plans: [[fullPlan, '2026-07']],
      expenses: [
        { date: '2026-11-07', bucket: 'leisure', amountCents: 1500, note: 'Dinner' },
        { date: '2026-11-06', bucket: 'leisure', amountCents: 900, note: 'Lunch' },
      ],
    });

    expect(screen.getByText('Today')).toBeOnTheScreen();
    expect(screen.getByText('Yesterday')).toBeOnTheScreen();
  });

  it('Home shows the month in brief', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']], overrides: { '2026-11': 300000 } });

    expect(screen.getByText('Spent this month')).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
    expect(screen.getByText(partialText('of 2 400 € · 1 370 € left'))).toBeOnTheScreen();
  });

  it('Saving does not count as spending', async () => {
    await startApp({
      today: TODAY,
      plans: [[fullPlan, '2026-07']],
      expenses: [{ date: '2026-11-02', bucket: 'savings', amountCents: 20000, note: 'Saved' }],
    });

    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
  });

  it('The shortfall is explained when the income does not cover the fixed expenses', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']], overrides: { '2026-11': 80000 } });

    expect(screen.getByText(/short of your fixed expenses/)).toBeOnTheScreen();
  });

  it('Save says why it is off', async () => {
    await startApp({ today: TODAY });
    await press('Set up my plan');

    expect(screen.getByText('Enter your income to save.')).toBeOnTheScreen();
    expectSaveDisabled();
  });

  it('The editor says when this month has its own income', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']], overrides: { '2026-11': 300000 } });
    await press('Edit plan');

    expect(screen.getByText(partialText('This month stays at 3 000,00 €'))).toBeOnTheScreen();
  });

  it('Saving a month income returns to Home', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Edit plan');
    await press("Change this month's income");
    await type('Income this month', '3000');
    await press('Save for this month');

    expect(screen).toHavePathname('/');
    await press('My plan');
    expect(screen.getByText(/This month only/)).toBeOnTheScreen();
  });
});

describe('A new month is never missed', () => {
  it('Returning to the app in a new month shows that month', async () => {
    const listeners: ((state: string) => void)[] = [];
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener as (state: string) => void);
      return { remove: jest.fn() } as never;
    });
    await startApp({ today: [2026, 10, 30], plans: [[fullPlan, '2026-07']] });
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();

    jest.setSystemTime(new Date(2026, 11, 1, 12));
    await act(async () => listeners.forEach((listener) => listener('active')));

    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    spy.mockRestore();
  });
});
