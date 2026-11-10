import { Alert } from 'react-native';
import { act, screen, testRouter, within } from 'expo-router/testing-library';

import {
  DISCARD_DIALOG,
  answerDialog,
  dumpDevice,
  exactText,
  expectDialog,
  expectNoDialog,
  expectLeftToSpend,
  partialText,
  press,
  reopenApp,
  startApp,
  type,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

const alertSpy = jest.spyOn(Alert, 'alert');

afterEach(() => {
  alertSpy.mockClear();
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 7];
const salary = (cents: number, note = 'Salary') => ({ date: '2026-11-01', bucket: 'income', amountCents: cents, note }) as const;
const saving = (cents: number) => ({ date: '2026-11-02', bucket: 'savings', amountCents: cents, note: 'Piggy bank' }) as const;
const spending = (cents: number) => ({ date: '2026-11-03', bucket: 'expense', amountCents: cents, note: 'Rent' }) as const;

const tile = (name: string) => within(screen.getByRole('button', { name }));

describe('Income comes from what is recorded', () => {
  it('Month income: incomes of 2000,00 € and 500,00 € add up to 2500,00 € and the goal follows (20 % is 500,00 €)', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000), salary(50000, 'Bonus')] });

    expect(tile('Income').getByText(exactText('2 500 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 500 €'))).toBeOnTheScreen();
  });

  it('No income yet: home says "Add this month\'s income" instead of the figures', async () => {
    await startApp({ today: TODAY });

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add income' })).toBeOnTheScreen();
    expect(screen.queryByText('Left to spend')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Savings' })).not.toBeOnTheScreen();
  });

  it('No income yet: it offers repeating the most recent earlier month total', async () => {
    await startApp({
      today: TODAY,
      expenses: [
        { date: '2026-08-01', bucket: 'income', amountCents: 180000, note: 'Old' },
        { date: '2026-09-01', bucket: 'income', amountCents: 120000, note: 'Salary' },
        { date: '2026-09-15', bucket: 'income', amountCents: 80000, note: 'Extra' },
      ],
    });

    expect(screen.getByRole('button', { name: 'Repeat last income' })).toHaveTextContent(/Repeat 2.000 €/);
  });
});

describe('One percentage for every month', () => {
  it('Default: with no saved plan an income of 2000,00 € has a goal of 400,00 € (20 %)', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000)] });

    expect(tile('Savings').getByText(exactText('of 400 €'))).toBeOnTheScreen();
  });

  it('Any income: a plan of 30 % and an income of 800,00 € give a goal of 240,00 €', async () => {
    await startApp({ today: TODAY, plans: [[30, '2026-07']], expenses: [salary(80000)] });

    expect(tile('Savings').getByText(exactText('of 240 €'))).toBeOnTheScreen();
  });

  it('Rounding: 20 % of 1000,01 € is a goal of 200,00 €', async () => {
    await startApp({ today: TODAY, expenses: [salary(100001)] });

    expect(tile('Savings').getByText(exactText('of 200 €'))).toBeOnTheScreen();
  });
});

describe('Left to spend', () => {
  it('Normal month: 150,00 € saved and 900,00 € spent leave 700,00 €', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000), saving(15000), spending(90000)] });

    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('150 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 400 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('900 €'))).toBeOnTheScreen();
    expectLeftToSpend('700,00 €');
  });

  it('Overspent: an income of 1000,00 € and 900,00 € spent show -100,00 € left to spend', async () => {
    await startApp({ today: TODAY, expenses: [salary(100000), spending(90000)] });

    expectLeftToSpend('-100,00 €');
  });

  it('Saved above the goal: the goal shows as reached and 500,00 € are left', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000), saving(60000), spending(90000)] });

    expect(tile('Savings').getByText('Goal reached')).toBeOnTheScreen();
    expectLeftToSpend('500,00 €');
  });

  it('With 0 % there is no goal and left is income minus expenses minus what was saved', async () => {
    await startApp({ today: TODAY, plans: [[0, '2026-07']], expenses: [salary(200000), saving(10000), spending(50000)] });

    expectLeftToSpend('1 400,00 €');
  });

  it('Expenses but no income: expenses stay listed and home keeps asking for income', async () => {
    await startApp({ today: TODAY, expenses: [spending(2500)] });

    expect(screen.getByText('Rent')).toBeOnTheScreen();
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
  });
});

describe('Change the plan', () => {
  it('Preview in euros: typing 30 on My plan shows 600,00 € before saving, and home still shows the old goal', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000)] });
    await press('My plan');
    expect(screen).toHavePathname('/plan');
    expect(screen.getByLabelText('Savings percentage')).toHaveDisplayValue('20');

    await type('Savings percentage', '30');

    expect(screen.getByText(partialText("600 € of this month's 2 000 €"))).toBeOnTheScreen();
  });

  it('Preview in euros: saving applies the new goal on home (30 % of 2000,00 € is 600,00 €)', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000)] });
    await press('My plan');
    await type('Savings percentage', '30');
    await press('Save plan');

    expect(screen).toHavePathname('/');
    expect(tile('Savings').getByText(exactText('of 600 €'))).toBeOnTheScreen();
    expectLeftToSpend('1 400,00 €');
  });

  it('Applies from now on: 25 % saved in July, 30 % saved in November; July to October keep 25 %', async () => {
    await startApp({
      today: TODAY,
      plans: [[25, '2026-07']],
      expenses: [
        { date: '2026-07-01', bucket: 'income', amountCents: 200000, note: 'July pay' },
        { date: '2026-10-01', bucket: 'income', amountCents: 200000, note: 'October pay' },
        salary(200000),
      ],
    });
    await press('My plan');
    await type('Savings percentage', '30');
    await press('Save plan');
    expect(tile('Savings').getByText(exactText('of 600 €'))).toBeOnTheScreen();

    for (const month of ['Oct', 'Jul']) {
      await press(/^Month:/);
      await press(month);
      expect(tile('Savings').getByText(exactText('of 500 €'))).toBeOnTheScreen();
    }
  });

  it('Same month twice: the latest value is used and no past month changes', async () => {
    await startApp({
      today: TODAY,
      plans: [[25, '2026-07']],
      expenses: [{ date: '2026-10-01', bucket: 'income', amountCents: 200000, note: 'October pay' }, salary(200000)],
    });
    for (const percent of ['30', '50']) {
      await press('My plan');
      await type('Savings percentage', percent);
      await press('Save plan');
    }

    expect(tile('Savings').getByText(exactText('of 1 000 €'))).toBeOnTheScreen();
    await press(/^Month:/);
    await press('Oct');
    expect(tile('Savings').getByText(exactText('of 500 €'))).toBeOnTheScreen();
  });

  it('The saved percentage is still there after reopening the app', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000)] });
    await press('My plan');
    await type('Savings percentage', '35');
    await press('Save plan');

    await reopenApp();
    await press('My plan');

    expect(screen.getByLabelText('Savings percentage')).toHaveDisplayValue('35');
  });

  it.each([
    ['empty', ''],
    ['above 100', '101'],
    ['not a whole number', '12,5'],
    ['text', 'abc'],
  ])('Invalid: %s cannot be saved', async (_label, text) => {
    await startApp({ today: TODAY, expenses: [salary(200000)] });
    await press('My plan');
    await type('Savings percentage', '25');
    await type('Savings percentage', text);

    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();
    await press('Save plan');
    expect(screen).toHavePathname('/plan');
  });

  it('Valid limits: 100 can be saved', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000)] });
    await press('My plan');
    await type('Savings percentage', '100');
    await press('Save plan');

    expect(screen).toHavePathname('/');
    expect(tile('Savings').getByText(exactText('of 2 000 €'))).toBeOnTheScreen();
  });

  it('Valid limits: 0 saved from My plan shows "No goal" and leaves income minus expenses minus savings', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000), saving(10000), spending(50000)] });
    expectLeftToSpend('1 100,00 €');
    await press('My plan');
    await type('Savings percentage', '0');
    await press('Save plan');

    expect(screen).toHavePathname('/');
    expect(tile('Savings').getByText('No goal')).toBeOnTheScreen();
    expect(tile('Savings').queryByText('Goal reached')).not.toBeOnTheScreen();
    expectLeftToSpend('1 400,00 €');
  });

  it('My plan with no income yet asks for it instead of showing a euro goal', async () => {
    await startApp({ today: TODAY });
    await press('My plan');

    expect(screen.getByText("Add this month's income to see it in euros.")).toBeOnTheScreen();
    await type('Savings percentage', '30');
    expect(screen.queryByText(partialText("of this month's"))).not.toBeOnTheScreen();
    expect(screen.getByText("Add this month's income to see it in euros.")).toBeOnTheScreen();
  });

  it('Leaving with changes: the app asks before discarding, and keeps editing if cancelled', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000)] });
    await press('My plan');
    await type('Savings percentage', '30');

    await testRouter.back();
    expectDialog(DISCARD_DIALOG);
    await answerDialog('Keep editing');
    expect(screen).toHavePathname('/plan');
    expect(screen.getByLabelText('Savings percentage')).toHaveDisplayValue('30');

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen).toHavePathname('/');
    expect(tile('Savings').getByText(exactText('of 400 €'))).toBeOnTheScreen();
  });

  it('Leaving without changes does not ask', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000)] });
    await press('My plan');

    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/');
  });
});

describe('Rounding on screen', () => {
  it.each([
    [30, 100003, 'of 300 €', '700,03 €'],
    [33, 100003, 'of 330 €', '670,03 €'],
  ])('%i %% of an income of %i cents is rounded down to the cent, not to the nearest', async (percent, income, goal, left) => {
    await startApp({ today: TODAY, plans: [[percent, '2026-07']], expenses: [salary(income)] });

    expect(tile('Savings').getByText(exactText(goal))).toBeOnTheScreen();
    expectLeftToSpend(left);
  });

  it('The preview in euros while typing is also rounded down (30 % of 1000,03 € is 300,00 €)', async () => {
    await startApp({ today: TODAY, expenses: [salary(100003)] });
    await press('My plan');
    await type('Savings percentage', '30');

    expect(screen.getByText(partialText("300 € of this month's 1 000,03 €"))).toBeOnTheScreen();
  });
});

describe('Savings tile at 0 % and when the goal is reached', () => {
  it('With 0 % the tile says "No goal", even when something was saved', async () => {
    await startApp({ today: TODAY, plans: [[0, '2026-07']], expenses: [salary(200000), saving(10000)] });

    expect(tile('Savings').getByText('No goal')).toBeOnTheScreen();
    expect(tile('Savings').queryByText('Goal reached')).not.toBeOnTheScreen();
  });

  it('Saving exactly the goal shows "Goal reached"', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000), saving(40000)] });

    expect(tile('Savings').getByText('Goal reached')).toBeOnTheScreen();
    expect(tile('Savings').queryByText('No goal')).not.toBeOnTheScreen();
  });

  it('Below the goal it shows neither', async () => {
    await startApp({ today: TODAY, expenses: [salary(200000), saving(39999)] });

    expect(tile('Savings').queryByText('Goal reached')).not.toBeOnTheScreen();
    expect(tile('Savings').queryByText('No goal')).not.toBeOnTheScreen();
  });
});

describe('Repeat the most recent earlier income', () => {
  const incomeRows = async () => {
    const [entries] = (await dumpDevice()) as [Record<string, unknown>[]];
    return entries.filter((row) => row.bucket === 'income');
  };
  const history = [
    { date: '2026-07-01', bucket: 'income', amountCents: 100000, note: 'July pay' },
    { date: '2026-08-01', bucket: 'income', amountCents: 150000, note: 'August pay' },
    { date: '2026-08-15', bucket: 'income', amountCents: 50000, note: 'August extra' },
    { date: '2026-09-02', bucket: 'savings', amountCents: 90000, note: 'Sep savings' },
    { date: '2026-09-03', bucket: 'expense', amountCents: 70000, note: 'Sep rent' },
    { date: '2026-10-05', bucket: 'expense', amountCents: 30000, note: 'Oct rent' },
  ] as const;

  it('Adds exactly one income of that month\'s total, dated today, with the note "Monthly income"', async () => {
    await startApp({ today: TODAY, expenses: [...history, { date: '2026-11-02', bucket: 'expense', amountCents: 1000, note: 'Coffee' }] });
    expect(screen.getByRole('button', { name: 'Repeat last income' })).toHaveTextContent(/Repeat 2.000 €/);
    const before = (await incomeRows()).length;

    await press('Repeat last income');

    const rows = await incomeRows();
    expect(rows).toHaveLength(before + 1);
    expect(rows.at(-1)).toMatchObject({ date: '2026-11-07', amount_cents: 200000, note: 'Monthly income', bucket: 'income' });
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();
    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Repeat last income' })).not.toBeOnTheScreen();
  });

  it('A quick double tap still adds a single income', async () => {
    await startApp({ today: TODAY, expenses: [...history] });
    const before = (await incomeRows()).length;
    const button = screen.getByRole('button', { name: 'Repeat last income' });

    // Two taps before the screen has had time to update: both reach the button's handler in one go.
    await act(async () => {
      button.props.onClick?.({});
      button.props.onClick?.({});
    });

    expect(await incomeRows()).toHaveLength(before + 1);
    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
  });

  it('In a past month it is dated on that month\'s last day and uses the total before it, ignoring later months', async () => {
    await startApp({
      today: TODAY,
      expenses: [...history, { date: '2026-11-01', bucket: 'income', amountCents: 500000, note: 'Nov pay' }],
    });
    await press(/^Month:/);
    await press('Sep');
    expect(screen.getByRole('button', { name: 'Repeat last income' })).toHaveTextContent(/Repeat 2.000 €/);

    await press('Repeat last income');

    const rows = await incomeRows();
    expect(rows.filter((row) => String(row.date).startsWith('2026-09'))).toEqual([
      expect.objectContaining({ date: '2026-09-30', amount_cents: 200000, note: 'Monthly income' }),
    ]);
    expect(rows).toHaveLength(5);
    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
  });

  it('The viewed month\'s own savings and expenses do not change the total', async () => {
    await startApp({
      today: TODAY,
      expenses: [
        ...history,
        { date: '2026-11-01', bucket: 'savings', amountCents: 777700, note: 'Big saving' },
        { date: '2026-11-02', bucket: 'expense', amountCents: 888800, note: 'Big expense' },
      ],
    });

    expect(screen.getByRole('button', { name: 'Repeat last income' })).toHaveTextContent(/Repeat 2.000 €/);
  });

  it('With no earlier income there is nothing to repeat', async () => {
    await startApp({ today: TODAY, expenses: [{ date: '2026-11-02', bucket: 'expense', amountCents: 1000, note: 'Coffee' }] });

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Repeat last income' })).not.toBeOnTheScreen();
  });
});
