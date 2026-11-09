import { router } from 'expo-router';
import { AppState } from 'react-native';
import { act, fireEvent, screen, testRouter } from 'expo-router/testing-library';

import { answerDialog, exactText, partialText, startApp, type TestPlan } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
const expectSaveDisabled = () => expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();

const TODAY: [number, number, number] = [2026, 10, 7];

/** 2000 € income, four items totalling 1030 €, savings 20 %. */
const fullPlan: TestPlan = {
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
    await press('My plan');
    await press('Edit fixed expenses');
    await type('Item 1 amount', '750');

    expect(screen.getByText(exactText('1 080,00 €'))).toBeOnTheScreen();
  });

  it('Remove an item', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit fixed expenses');
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
    await type('Item 1 name', name);
    await type('Item 1 amount', amount);

    expect(screen.getByText(/needs a name and an amount/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('No fixed expenses', async () => {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await press('Next');
    await press('Save plan');

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
  });
});

describe('Split only what is left', () => {
  async function openWithList() {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await fillList(FOUR_ITEMS);
    await press('Next');
    await type('Income', '2000');
  }

  it('Split what is left', async () => {
    await openWithList();
    await type('Savings', '20');

    expect(screen.getByText('400,00 €')).toBeOnTheScreen();
    expect(screen.getByLabelText('Leisure')).toHaveDisplayValue('28,5');
    expect(screen.getByText('570,00 €')).toBeOnTheScreen();
  });

  it('Adjust by trial and error', async () => {
    await openWithList();
    await type('Savings', '20');
    await type('Leisure', '30');

    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('18,5');
    expect(screen.getByLabelText('Leisure')).toHaveDisplayValue('30');
  });

  it('List above the income', async () => {
    await startApp({ today: TODAY });
    await press('Set up my plan');
    await fillList(FOUR_ITEMS);
    await press('Next');
    await type('Income', '1000');

    expect(screen.getByText(partialText('30,00 € over this income'))).toBeOnTheScreen();
  });

  it('Savings and leisure have no euro switch', async () => {
    await openWithList();

    expect(screen.queryByRole('radio', { name: /in euros/ })).not.toBeOnTheScreen();
  });
});

describe('See the plan apart from changing it', () => {
  it('The plan is shown with only a way to edit it', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');

    expect(screen.getByText("This month's income")).toBeOnTheScreen();
    expect(screen.getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 030 €'))).toBeOnTheScreen();
    expect(screen.getByText(/^51,5.%$/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Edit plan' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Item 1 name')).not.toBeOnTheScreen();
  });

  it('Changing it happens on another screen', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');

    expect(screen).toHavePathname('/plan-edit');
    expect(screen.queryByLabelText('Item 1 name')).not.toBeOnTheScreen();
    await testRouter.back();
    await press('Edit fixed expenses');
    expect(screen).toHavePathname('/fixed-expenses');
    expect(screen.getByLabelText('Item 1 name')).toHaveDisplayValue('House');
  });

  it('Saving goes back to the plan', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    await press('Save plan');

    expect(screen).toHavePathname('/plan');
  });
});

describe('Fixed expenses do not follow the income', () => {
  it('Higher income', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']], overrides: { '2026-11': 250000 } });

    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('500 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('970 € left'))).toBeOnTheScreen();
  });

  it('One different month', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']], overrides: { '2026-11': 300000 } });

    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('600 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 370 € left'))).toBeOnTheScreen();
  });

  it('Changes apply onwards', async () => {
    await startApp({ today: [2026, 11, 8], plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit fixed expenses');
    await type('Item 1 amount', '750');
    await press('Save');
    await testRouter.back();
    expect(screen.getByText(exactText('1 080'))).toBeOnTheScreen();

    await press(/^Month:/);
    await press('Nov');
    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
  });

  it('Next month repeats', async () => {
    await startApp({ today: [2026, 11, 8], plans: [[fullPlan, '2026-11']] });

    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
  });
});

describe('Fixed expenses count by themselves', () => {
  it('Nothing to record', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });

    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
    expect(screen.queryByText(exactText('1 030,00 € left'))).not.toBeOnTheScreen();
    expect(screen.queryByText(/over$/)).not.toBeOnTheScreen();
  });



  it('The form chooses what is being added', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Add expense');

    expect(screen.getByRole('radio', { name: 'Leisure' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Income' })).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Fixed' })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Savings' }));
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

    for (const part of ['Fixed', 'Leisure', 'Savings']) expect(screen.getByText(part)).toBeOnTheScreen();
  });
});

describe('Nothing is lost by a mistaken tap', () => {
  it('Removing an item asks first and can be cancelled', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit fixed expenses');
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
    await press('My plan');
    await press('Edit fixed expenses');
    await type('Item 1 amount', '800');
    await act(async () => router.back());

    expect(screen.getByText('Discard changes?')).toBeOnTheScreen();
    await answerDialog('Keep editing');

    expect(screen).toHavePathname('/fixed-expenses');
    expect(screen.getByLabelText('Item 1 amount')).toHaveDisplayValue('800');
  });

  it('Discarding leaves without saving', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit fixed expenses');
    await type('Item 1 amount', '800');
    await act(async () => router.back());
    await answerDialog('Discard');

    expect(screen).toHavePathname('/plan');
    await testRouter.back();
    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
  });

  it('Leaving without changes does not ask', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    await act(async () => router.back());

    expect(screen.queryByTestId('confirm-dialog')).not.toBeOnTheScreen();
    expect(screen).toHavePathname('/plan');
  });

  it('Saving does not ask', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    await type('Income', '2500');
    await press('Save plan');

    expect(screen.queryByTestId('confirm-dialog')).not.toBeOnTheScreen();
    expect(screen).toHavePathname('/plan');
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
    plans: [[fullPlan, '2026-07']] as [TestPlan, string][],
    expenses: [{ date: '2026-11-02', bucket: 'leisure', amountCents: 1500, note: 'Dinner' }] as const,
  };

  it('An empty month explains what to record', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']], noIncome: true });

    expect(screen.getByText(/Fixed expenses are already counted/)).toBeOnTheScreen();
  });

  it('An empty part says so', async () => {
    await startApp({ ...withExpense, expenses: [...withExpense.expenses] });
    await press('Savings');

    expect(screen.getByText('Nothing in Savings this month.')).toBeOnTheScreen();
  });

  it('Edit plan is at the end of My plan', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');

    expect(screen).toHavePathname('/plan-edit');
  });

  it('Adding from Savings starts on Savings', async () => {
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('Savings');
    await press('Add to savings');

    expect(screen.getByRole('radio', { name: 'Savings', selected: true })).toBeOnTheScreen();
  });

  it('Tiles show what is left and how it is going', async () => {
    await startApp({
      today: TODAY,
      plans: [[fullPlan, '2026-07']],
      expenses: [
        { date: '2026-11-02', bucket: 'leisure', amountCents: 28500, note: 'Trip' },
        { date: '2026-11-03', bucket: 'savings', amountCents: 10000, note: 'Saved' },
      ],
    });

    expect(screen.getByText(exactText('285 € left'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('50 % used'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('300 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('25 % saved'))).toBeOnTheScreen();
  });

  it('Reaching the savings target says so', async () => {
    await startApp({
      today: TODAY,
      plans: [[fullPlan, '2026-07']],
      expenses: [{ date: '2026-11-03', bucket: 'savings', amountCents: 40000, note: 'Saved' }],
    });

    expect(screen.getByText('Goal reached')).toBeOnTheScreen();
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
    await startApp({ today: TODAY, plans: [[fullPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    await type('Savings', '');

    expect(screen.getByText('Enter a percentage to save.')).toBeOnTheScreen();
    expectSaveDisabled();
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
