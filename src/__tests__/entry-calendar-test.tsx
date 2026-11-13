import { Alert } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { screen, testRouter } from 'expo-router/testing-library';

import { dayKey } from '@/shared/days';
import {
  DISCARD_DIALOG,
  answerDialog,
  choose,
  exactText,
  expectDialog,
  expectNoDialog,
  press,
  startApp,
  type,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

type OpenArgs = Parameters<typeof DateTimePickerAndroid.open>[0];

/** The Android calendar cannot run in Jest: this records how it is opened and answers like a user would. */
function fakeCalendar(answer: { pick: Date } | 'dismiss') {
  return jest.spyOn(DateTimePickerAndroid, 'open').mockImplementation((args: OpenArgs) => {
    if (answer !== 'dismiss') {
      (args.onValueChange as unknown as (event: unknown, date: Date) => void)({}, answer.pick);
    }
  });
}

beforeEach(() => {
  jest.spyOn(Alert, 'alert');
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const NOV25: [number, number, number] = [2026, 10, 25];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Salary' } as const;

describe('Pick the date from a calendar', () => {
  it('Open: tapping the date opens the calendar on the date of the form, in date mode', async () => {
    const open = fakeCalendar('dismiss');
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');

    await press(/^Date: Wed 25 Nov/);

    expect(open).toHaveBeenCalledTimes(1);
    const args = open.mock.calls[0][0];
    expect(args.mode).toBe('date');
    expect(dayKey(args.value as Date)).toBe('2026-11-25');
  });

  it('Open: after stepping back a day the calendar opens on that day', async () => {
    const open = fakeCalendar('dismiss');
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    await press('Previous day');

    await press(/^Date: Tue 24 Nov/);

    expect(dayKey(open.mock.calls[0][0].value as Date)).toBe('2026-11-24');
  });

  it('Limits: in the current month the calendar allows from the 1st up to today', async () => {
    const open = fakeCalendar('dismiss');
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    await press(/^Date: /);

    const args = open.mock.calls[0][0];
    expect(dayKey(args.minimumDate as Date)).toBe('2026-11-01');
    expect(dayKey(args.maximumDate as Date)).toBe('2026-11-25');
  });

  it('Limits: in a past month the calendar opens on that month and allows all its days', async () => {
    const open = fakeCalendar('dismiss');
    await startApp({ today: NOV25, entries: [salary, { ...salary, date: '2026-10-01' }] });
    await press(/^Month:/);
    await press('Oct');
    await press('Add expense');
    expect(screen.getByText(/Sat 31 Oct/)).toBeOnTheScreen();
    await press(/^Date: /);

    const args = open.mock.calls[0][0];
    expect(dayKey(args.value as Date)).toBe('2026-10-31');
    expect(dayKey(args.minimumDate as Date)).toBe('2026-10-01');
    expect(dayKey(args.maximumDate as Date)).toBe('2026-10-31');
  });

  it('Pick: picking 3 November shows it in the form and saves the entry with it', async () => {
    fakeCalendar({ pick: new Date(2026, 10, 3) });
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    await type('Amount', '12,50');
    await type('Note (optional)', 'Cinema');

    await press(/^Date: /);

    expect(screen.getByRole('button', { name: /^Date: Tue 3 Nov/ })).toBeOnTheScreen();
    await press('Add expense');

    expect(screen).toHavePathname('/');
    const row = screen.getByText('Cinema');
    expect(row).toBeOnTheScreen();
    expect(screen.getByText('Tue 3 Nov')).toBeOnTheScreen();
    expect(screen.getAllByText(exactText('12,50 €')).length).toBeGreaterThan(0);
  });

  it('Pick: the saved date is kept when the entry is opened again', async () => {
    fakeCalendar({ pick: new Date(2026, 10, 3) });
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    await type('Amount', '9');
    await type('Note (optional)', 'Bakery');
    await press(/^Date: /);
    await press('Add expense');

    await press(/Bakery/);

    expect(screen.getByRole('button', { name: /^Date: Tue 3 Nov/ })).toBeOnTheScreen();
  });

  it('Cancel: closing the calendar without confirming leaves the date unchanged', async () => {
    fakeCalendar('dismiss');
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');

    await press(/^Date: /);

    expect(screen.getByRole('button', { name: /^Date: Wed 25 Nov/ })).toBeOnTheScreen();
    expect(screen.getByText(/Today/)).toBeOnTheScreen();
  });

  it('Steps stay: the previous and next day buttons still work', async () => {
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled();

    await press('Previous day');
    expect(screen.getByRole('button', { name: /^Date: Tue 24 Nov/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next day' })).toBeEnabled();

    await press('Next day');
    expect(screen.getByRole('button', { name: /^Date: Wed 25 Nov/ })).toBeOnTheScreen();
  });

  it('Steps stay: after picking a day with the calendar the day buttons move from it', async () => {
    fakeCalendar({ pick: new Date(2026, 10, 3) });
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    await press(/^Date: /);

    await press('Next day');

    expect(screen.getByRole('button', { name: /^Date: Wed 4 Nov/ })).toBeOnTheScreen();
  });

  it('Unsaved change: leaving after changing only the date with the calendar asks before discarding', async () => {
    fakeCalendar({ pick: new Date(2026, 10, 3) });
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    await press(/^Date: /);

    await testRouter.back();

    expectDialog(DISCARD_DIALOG);
    expect(screen).toHavePathname('/entry');
    await answerDialog('Discard');
    expect(screen).toHavePathname('/');
  });

  it('Unsaved change: closing the calendar without a change does not ask when leaving', async () => {
    fakeCalendar('dismiss');
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    await press(/^Date: /);

    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/');
  });
});

describe('A cleaner form', () => {
  it('No kind description: no description text appears below the Income / Savings / Expense choices', async () => {
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');

    for (const kind of ['Income', 'Savings', 'Expense']) {
      await choose(kind);
      expect(screen.queryByText(/Money you received|Money you set aside|Rent, bills, shopping/)).not.toBeOnTheScreen();
    }
  });

  it('Note example: the note field reads "Cinema" for an expense, "Salary" for income and "Emergency fund" for savings, and changes with the kind', async () => {
    await startApp({ today: NOV25, entries: [salary] });
    await press('Add expense');
    const note = () => screen.getByLabelText('Note (optional)').props.placeholder;

    expect(note()).toBe('Cinema');
    await choose('Income');
    expect(note()).toBe('Salary');
    await choose('Savings');
    expect(note()).toBe('Emergency fund');
    await choose('Expense');
    expect(note()).toBe('Cinema');
  });
});
