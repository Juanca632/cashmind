import { AppState } from 'react-native';
import { act, screen, testRouter, within } from 'expo-router/testing-library';

import { answerDialog, exactText, press, startApp, type } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const openPicker = () => press(/^Month:/);
const income = (month: string, cents: number) => ({ date: `${month}-01`, bucket: 'income', amountCents: cents, note: `Pay ${month}` }) as const;
const tile = (name: string) => within(screen.getByRole('button', { name }));

describe('Month picker', () => {
  it('Pick a past month: September shows the percentage that applied in September', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [
        [25, '2026-07'],
        [30, '2026-10'],
      ],
      expenses: [income('2026-07', 200000), income('2026-09', 200000), income('2026-10', 200000), income('2026-11', 200000)],
    });
    expect(tile('Savings').getByText(exactText('of 600 €'))).toBeOnTheScreen();

    await openPicker();
    expect(screen.getByRole('button', { name: 'Nov' })).toBeSelected();
    await press('Sep');

    expect(screen).toHavePathname('/');
    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 500 €'))).toBeOnTheScreen();
  });
});

describe('No future months', () => {
  it('Future months disabled: December and the next year cannot be selected', async () => {
    await startApp({ today: [2026, 10, 7] });
    await openPicker();

    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dec' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next year' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nov' })).toBeEnabled();

    await press('Dec');
    await press('Next year');
    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dec' })).toBeDisabled();
  });
});

describe('How far back', () => {
  it('First entry: with the first entry in March 2025 the picker goes back to 2025 and no earlier', async () => {
    await startApp({
      today: [2026, 10, 7],
      expenses: [{ date: '2025-03-10', bucket: 'expense', amountCents: 1000, note: 'Old' }],
    });
    await openPicker();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeEnabled();

    await press('Previous year');
    expect(screen.getByText('2025')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
    await press('Previous year');
    expect(screen.getByText('2025')).toBeOnTheScreen();
  });

  it('Nothing recorded: the picker still goes back to the previous year and no earlier', async () => {
    await startApp({ today: [2027, 0, 3] });
    await openPicker();

    expect(screen.getByText('2027')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next year' })).toBeDisabled();

    await press('Previous year');
    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next year' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Dec' })).toBeEnabled();
  });

  it('An entry only in the current year still allows the previous year and no earlier', async () => {
    await startApp({ today: [2026, 10, 7], expenses: [income('2026-10', 100000)] });
    await openPicker();
    await press('Previous year');

    expect(screen.getByText('2025')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
  });

  it('A first entry several years back lets the user go back to that year', async () => {
    await startApp({
      today: [2026, 10, 7],
      expenses: [{ date: '2023-05-10', bucket: 'expense', amountCents: 1000, note: 'Old' }],
    });
    await openPicker();
    for (const year of ['2025', '2024', '2023']) {
      await press('Previous year');
      expect(screen.getByText(year)).toBeOnTheScreen();
    }
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
  });

  it('Next year returns towards the current year, and a month of an earlier year can be picked', async () => {
    await startApp({
      today: [2026, 10, 7],
      expenses: [
        { date: '2025-03-01', bucket: 'income', amountCents: 100000, note: 'Pay 2025' },
        { date: '2025-03-10', bucket: 'expense', amountCents: 2500, note: 'Old lunch' },
      ],
    });
    await openPicker();
    await press('Previous year');
    await press('Next year');
    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next year' })).toBeDisabled();

    await press('Previous year');
    await press('Mar');

    expect(screen).toHavePathname('/');
    expect(screen.getByText('March 2025', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Old lunch')).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 200 €'))).toBeOnTheScreen();
  });

  it('A month before any plan uses the default 20 %', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[40, '2026-10']],
      expenses: [income('2026-03', 100000), income('2026-10', 100000)],
    });
    await openPicker();
    await press('Mar');

    expect(tile('Savings').getByText(exactText('of 200 €'))).toBeOnTheScreen();
  });
});

describe('The plan of a past month cannot be changed', () => {
  it('Viewing a past month: My plan is not offered and "Back to current month" returns to November 2026', async () => {
    await startApp({ today: [2026, 10, 7], expenses: [income('2026-09', 200000)] });
    expect(screen.getByRole('button', { name: 'My plan' })).toBeOnTheScreen();
    await openPicker();
    await press('Sep');

    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'My plan' })).not.toBeOnTheScreen();

    await press('Back to current month');

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'My plan' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Back to current month' })).not.toBeOnTheScreen();
  });

  it('Expenses stay editable: on 6 December 2026 November entries, including income, can be added, edited or deleted', async () => {
    await startApp({
      today: [2026, 11, 6],
      expenses: [income('2026-11', 200000), { date: '2026-11-05', bucket: 'expense', amountCents: 1250, note: 'Cinema' }],
    });
    await openPicker();
    await press('Nov');

    expect(screen.queryByRole('button', { name: 'My plan' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeOnTheScreen();
    await press(/Pay 2026-11/);
    expect(screen).toHavePathname('/expense');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeOnTheScreen();
  });

  it('A past month with no income offers to add one or to repeat the most recent earlier income', async () => {
    await startApp({ today: [2026, 10, 7], expenses: [income('2026-09', 200000)] });
    await openPicker();
    await press('Oct');

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add income' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Repeat last income' })).toBeOnTheScreen();
  });
});

describe('Past months can be corrected: income', () => {
  const today: [number, number, number] = [2026, 11, 6];
  const nov = [
    income('2026-11', 200000),
    { date: '2026-11-05', bucket: 'expense', amountCents: 50000, note: 'Cinema' },
  ] as const;

  it('An income of a past month can be edited and the month figures follow', async () => {
    await startApp({ today, expenses: [...nov] });
    await openPicker();
    await press('Nov');
    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();

    await press(/Pay 2026-11/);
    await type('Amount', '2500');
    await press('Save changes');

    expect(screen).toHavePathname('/');
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(tile('Income').getByText(exactText('2 500 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 500 €'))).toBeOnTheScreen();
  });

  it('An income of a past month can be deleted after confirming, and the month asks for income again', async () => {
    await startApp({ today, expenses: [...nov] });
    await openPicker();
    await press('Nov');

    await press(/Pay 2026-11/);
    await press('Delete');
    await answerDialog('Delete');

    expect(screen).toHavePathname('/');
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByText('Pay 2026-11')).not.toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
  });
});

describe('Going to a month by address', () => {
  it.each([['2099-01'], ['junk'], ['2026-13']])('/?month=%s falls back to the current month', async (month) => {
    await startApp({ today: [2026, 10, 7], expenses: [income('2026-11', 100000)] });
    await testRouter.navigate(`/?month=${month}`);

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(tile('Income').getByText(exactText('1 000 €'))).toBeOnTheScreen();
  });

  it('/?month=2026-09 shows that past month', async () => {
    await startApp({ today: [2026, 10, 7], expenses: [income('2026-09', 100000)] });
    await testRouter.navigate('/?month=2026-09');

    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'My plan' })).not.toBeOnTheScreen();
  });
});

describe('Removed screens', () => {
  it.each([['/plan-edit'], ['/fixed-expenses']])('%s no longer exists', async (route) => {
    await startApp({ today: [2026, 10, 7], expenses: [income('2026-11', 100000)] });
    await testRouter.navigate(route);

    expect(screen.getByText('Page could not be found.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save plan' })).not.toBeOnTheScreen();
    expect(screen.queryByText('Left to spend')).not.toBeOnTheScreen();
  });
});

describe('Today follows the clock', () => {
  it('When the app returns to the foreground after midnight into a new month, home shows the new month', async () => {
    const listen = jest.spyOn(AppState, 'addEventListener');
    await startApp({ today: [2026, 10, 30], expenses: [income('2026-11', 100000)] });
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();

    jest.setSystemTime(new Date(2026, 11, 1, 9));
    await act(async () => {
      for (const [event, handler] of listen.mock.calls) if (event === 'change') (handler as (state: string) => void)('active');
    });

    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    listen.mockRestore();
  });
});
