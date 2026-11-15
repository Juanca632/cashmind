import { AppState } from 'react-native';
import { act, fireEvent, screen, testRouter } from 'expo-router/testing-library';

import {
  answerDialog,
  choose,
  expectDialog,
  expectNoDialog,
  press,
  reopenApp,
  startApp,
  type,
} from '../test-support/app';
import { seedDevice } from '../test-support/fake-sqlite';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => jest.useRealTimers());

const NOV_15: [number, number, number] = [2026, 10, 15];
const DEC_4: [number, number, number] = [2026, 11, 4];
const JAN_9: [number, number, number] = [2027, 0, 9];
const FEB_10: [number, number, number] = [2027, 1, 10];

const salaryEntry = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Salary', category: 'salary' } as const;
const plainSalary = { ...salaryEntry, note: 'Pay' } as const;

/** Raw rows: an item and the November entry it was marked from (id 1 = Rent, id 2 = Salary, id 3 = Netflix). */
const item = (id: number, kind: string, category: string, cents: number, note: string, active = 1, lastMonth = '2026-11') =>
  `INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month) VALUES (${id}, '${kind}', '${category}', ${cents}, '${note}', ${active}, '${lastMonth}');`;
const linked = (date: string, kind: string, category: string, cents: number, note: string, recurringId: number) =>
  `INSERT INTO entry (date, kind, category, amount_cents, note, recurring_id) VALUES ('${date}', '${kind}', '${category}', ${cents}, '${note}', ${recurringId});`;

const RENT = [item(1, 'expense', 'housing', 90000, 'Rent'), linked('2026-11-02', 'expense', 'housing', 90000, 'Rent', 1)];
const SALARY = [item(2, 'income', 'salary', 200000, 'Salary'), linked('2026-11-01', 'income', 'salary', 200000, 'Salary', 2)];
const NETFLIX = [item(3, 'expense', 'subscriptions', 1299, 'Netflix'), linked('2026-11-03', 'expense', 'subscriptions', 1299, 'Netflix', 3)];

const money = (text: string) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s\\u00a0\\u202f]'));
/** An entry row on a list, by the start of its accessible name. */
const row = (label: string) => screen.queryByRole('button', { name: new RegExp(label) });
const repeating = (label: string) => screen.queryByRole('button', { name: new RegExp(`^${label}, .*, repeats every month$`) });
const rowsOf = (label: string) => screen.queryAllByRole('button', { name: new RegExp(label) });
const repeatSwitch = () => screen.queryByRole('switch', { name: 'Repeat every month' });
const toggleRepeat = () => {
  const control = screen.getByRole('switch', { name: 'Repeat every month' });
  return fireEvent(control, 'valueChange', !control.props.value);
};
const items = async () => {
  let rows: any[] = [];
  await seedDevice(async (db) => {
    rows = await db.getAllAsync('SELECT * FROM recurring ORDER BY id');
  });
  return rows;
};
const entryDates = async (note: string) => {
  let rows: any[] = [];
  await seedDevice(async (db) => {
    rows = await db.getAllAsync('SELECT date, amount_cents FROM entry WHERE note = ? ORDER BY date, id', note);
  });
  return rows.map((r) => [r.date, r.amount_cents]);
};
const openPlan = () => press('My plan');
const openPicker = () => press(/^Month:/);

describe('US1 Mark an entry as monthly', () => {
  it('Switch: the form of the current month shows "Repeat every month", off by default, when adding and when editing', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary, { date: '2026-11-05', kind: 'expense', amountCents: 1250, note: 'Cinema' }] });
    await press('Add expense');
    expect(repeatSwitch()).toBeOnTheScreen();
    expect(repeatSwitch()).not.toBeChecked();
    await testRouter.back();

    await press(/Cinema/);
    expect(repeatSwitch()).toBeOnTheScreen();
    expect(repeatSwitch()).not.toBeChecked();
  });

  it('Mark on a new entry: Rent, Housing, 900,00 € on 15 November with the switch on is saved as usual and listed in My plan', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary] });
    await press('Add expense');
    await type('Amount', '900');
    await choose('Housing');
    await type('Note (optional)', 'Rent');
    await toggleRepeat();
    expect(repeatSwitch()).toBeChecked();
    await press('Add expense');

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: /^Rent, Today, 900,00.€, repeats every month$/ })).toBeOnTheScreen();
    expect(screen.getByText(money('900,00 €'))).toBeOnTheScreen();

    await openPlan();
    expect(screen.getByRole('button', { name: /^Rent, 900,00.€, every month$/ })).toBeOnTheScreen();
  });

  it('Without the switch nothing is added to the monthly list', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary] });
    await press('Add expense');
    await type('Amount', '20');
    await type('Note (optional)', 'Lunch');
    await press('Add expense');
    expect(repeating('Lunch')).not.toBeOnTheScreen();
    await openPlan();
    expect(screen.getByText('Nothing repeats yet.')).toBeOnTheScreen();
  });

  it('Mark an existing entry: turning the switch on and saving makes it repeat from next month', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary, { date: '2026-11-05', kind: 'expense', amountCents: 90000, note: 'Rent', category: 'housing' }] });
    expect(repeating('Rent')).not.toBeOnTheScreen();
    await press(/Rent/);
    await toggleRepeat();
    await press('Save changes');
    expect(screen).toHavePathname('/');
    // The entry of this month keeps one row; it now repeats.
    expect(rowsOf('Rent')).toHaveLength(1);
    expect(repeating('Rent')).toBeOnTheScreen();

    await openPlan();
    expect(screen.getByRole('button', { name: /^Rent, 900,00.€, every month$/ })).toBeOnTheScreen();

    await reopenApp(DEC_4);
    expect(screen.getAllByRole('button', { name: /^Rent, Tue 1 Dec, 900,00.€, repeats every month$/ })).toHaveLength(1);
  });

  it('Past months: the form of a past month does not show the switch, when adding or editing', async () => {
    await startApp({
      today: DEC_4,
      entries: [{ ...plainSalary, date: '2026-12-01' }, { date: '2026-11-05', kind: 'expense', amountCents: 1250, note: 'Cinema' }],
    });
    await openPicker();
    await press('Nov');
    await press('Add expense');
    expect(repeatSwitch()).not.toBeOnTheScreen();
    await testRouter.back();

    await press(/Cinema/);
    expect(repeatSwitch()).not.toBeOnTheScreen();
  });

  it('Icon: entries that repeat or were recorded by a repeat are marked in the home list, others are not', async () => {
    await startApp({
      today: NOV_15,
      entries: [{ date: '2026-11-05', kind: 'expense', amountCents: 1250, note: 'Cinema' }],
      raw: [...SALARY, ...RENT],
    });
    expect(repeating('Salary')).toBeOnTheScreen();
    expect(repeating('Rent')).toBeOnTheScreen();
    expect(row('Cinema')).toBeOnTheScreen();
    expect(repeating('Cinema')).not.toBeOnTheScreen();
  });

  it('Icon: an entry of a stopped item keeps its mark', async () => {
    await startApp({
      today: NOV_15,
      entries: [plainSalary],
      raw: [item(1, 'expense', 'housing', 90000, 'Rent', 0), linked('2026-11-02', 'expense', 'housing', 90000, 'Rent', 1)],
    });
    expect(repeating('Rent')).toBeOnTheScreen();
  });

  it('Icon: it is also shown in the Activity list', async () => {
    await startApp({ today: NOV_15, entries: [{ date: '2026-11-05', kind: 'expense', amountCents: 1250, note: 'Cinema' }], raw: [...SALARY, ...RENT] });
    await testRouter.navigate('/activity?month=2026-11');
    expect(repeating('Rent')).toBeOnTheScreen();
    expect(repeating('Salary')).toBeOnTheScreen();
    expect(repeating('Cinema')).not.toBeOnTheScreen();
  });
});

describe('US2 New month starts filled in', () => {
  it('Recorded on the 1st: opening the app on 4 December shows Rent and Salary dated 1 December with the same category and amount', async () => {
    await startApp({ today: NOV_15, raw: [...RENT, ...SALARY] });
    await reopenApp(DEC_4);

    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Rent, Tue 1 Dec, 900,00.€, repeats every month$/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Salary, Tue 1 Dec, \+2.000,00.€, repeats every month$/ })).toBeOnTheScreen();
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();

    await press(/Rent/);
    expect(screen.getByRole('radio', { name: 'Housing' })).toBeSelected();
    expect(screen.getByLabelText('Note (optional)')).toHaveDisplayValue('Rent');
  });

  it('Recorded on the 1st: Left to spend counts the fixed costs from day one', async () => {
    await startApp({ today: NOV_15, raw: [...RENT, ...SALARY] });
    await reopenApp(DEC_4);
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    // 2 000 - 900 - max(20 % of 2 000 = 400, 0) = 700
    expect(screen.getByText('Left to spend').parent).toHaveTextContent(/^Left to spend700,00.€/);
  });

  it('Once per month: opening the app again in December adds nothing a second time', async () => {
    await startApp({ today: NOV_15, raw: [...RENT, ...SALARY] });
    await reopenApp(DEC_4);
    await reopenApp([2026, 11, 20]);
    await reopenApp([2026, 11, 28]);
    expect(rowsOf('Rent')).toHaveLength(1);
    expect(rowsOf('Salary')).toHaveLength(1);
  });

  it('Deleted stays deleted: December Rent does not come back in December and is recorded again in January', async () => {
    await startApp({ today: NOV_15, raw: [...RENT, ...SALARY] });
    await reopenApp(DEC_4);
    await press(/Rent/);
    await press('Delete');
    await answerDialog('Delete');
    expect(row('Rent')).not.toBeOnTheScreen();

    await reopenApp([2026, 11, 20]);
    expect(row('Rent')).not.toBeOnTheScreen();
    expect(row('Salary')).toBeOnTheScreen();

    await reopenApp(JAN_9);
    expect(screen.getByRole('button', { name: /^Rent, Fri 1 Jan, 900,00.€, repeats every month$/ })).toBeOnTheScreen();
  });

  it('Edited stays edited: changing December Rent to 950,00 € leaves January Rent at 900,00 €', async () => {
    await startApp({ today: NOV_15, raw: [...RENT, ...SALARY] });
    await reopenApp(DEC_4);
    await press(/Rent/);
    await type('Amount', '950,00');
    await press('Save changes');
    expect(await screen.findByRole('button', { name: /^Rent, Tue 1 Dec, 950,00.€,/ })).toBeOnTheScreen();

    await reopenApp(JAN_9);
    expect(screen.getByRole('button', { name: /^Rent, Fri 1 Jan, 900,00.€,/ })).toBeOnTheScreen();
    await openPicker();
    await press('Previous year');
    await press('Dec');
    expect(screen.getByRole('button', { name: /^Rent, Tue 1 Dec, 950,00.€,/ })).toBeOnTheScreen();
  });

  it('Skipped months: opened in February after November, only February is filled', async () => {
    await startApp({ today: NOV_15, raw: [...RENT, ...SALARY] });
    await reopenApp(FEB_10);
    expect(screen.getByRole('button', { name: /^Rent, Mon 1 Feb,/ })).toBeOnTheScreen();

    expect(await entryDates('Rent')).toEqual([['2026-11-02', 90000], ['2027-02-01', 90000]]);
    expect(await entryDates('Salary')).toEqual([['2026-11-01', 200000], ['2027-02-01', 200000]]);
  });

  it('Repeat last income: when Salary repeats the new month already has income and no call to action is shown', async () => {
    await startApp({ today: NOV_15, raw: [...SALARY] });
    await reopenApp(DEC_4);
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Repeat last income' })).not.toBeOnTheScreen();
    expect(screen.getByText('Left to spend')).toBeOnTheScreen();
  });

  it('Repeat last income: when only an expense repeats, "Add this month\'s income" and "Repeat last income" work as before', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary], raw: [...RENT] });
    await reopenApp(DEC_4);

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Repeat last income' })).toBeOnTheScreen();
    await press('Repeat last income');
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();
    expect(screen.getByText('Monthly income')).toBeOnTheScreen();
    expect(repeating('Rent')).toBeOnTheScreen();
  });

  it('Stopped items are not recorded in the new month', async () => {
    await startApp({
      today: NOV_15,
      raw: [...SALARY, item(1, 'expense', 'housing', 90000, 'Rent', 0), linked('2026-11-02', 'expense', 'housing', 90000, 'Rent', 1)],
    });
    await reopenApp(DEC_4);
    expect(row('Salary')).toBeOnTheScreen();
    expect(row('Rent')).not.toBeOnTheScreen();
  });
});

describe('US3 Review what repeats', () => {
  it('List and Total: Salary +2 000,00 €, Rent 900,00 € and Netflix 12,99 € show with "Fixed costs: 912,99 € a month"', async () => {
    await startApp({ today: NOV_15, raw: [...SALARY, ...RENT, ...NETFLIX] });
    await openPlan();

    expect(screen.getByText('Every month')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Salary, \+2.000,00.€, every month$/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Rent, 900,00.€, every month$/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Netflix, 12,99.€, every month$/ })).toBeOnTheScreen();
    expect(screen.getByText(money('Fixed costs: 912,99 € a month'))).toBeOnTheScreen();
  });

  it('List: an item with no note shows its category name', async () => {
    await startApp({ today: NOV_15, raw: [...SALARY, item(5, 'expense', 'groceries', 5000, ''), linked('2026-11-04', 'expense', 'groceries', 5000, '', 5)] });
    await openPlan();
    expect(screen.getByRole('button', { name: /^Groceries, 50,00.€, every month$/ })).toBeOnTheScreen();
  });

  it('Total: with only repeating income there is no "Fixed costs" line', async () => {
    await startApp({ today: NOV_15, raw: [...SALARY] });
    await openPlan();
    expect(screen.getByRole('button', { name: /^Salary, \+2.000,00.€, every month$/ })).toBeOnTheScreen();
    expect(screen.queryByText(/Fixed costs/)).not.toBeOnTheScreen();
  });

  it('Total: a stopped item is not listed nor counted', async () => {
    await startApp({
      today: NOV_15,
      raw: [...SALARY, ...NETFLIX, item(1, 'expense', 'housing', 90000, 'Rent', 0), linked('2026-11-02', 'expense', 'housing', 90000, 'Rent', 1)],
    });
    await openPlan();
    expect(screen.queryByRole('button', { name: /^Rent, .*every month$/ })).not.toBeOnTheScreen();
    expect(screen.getByText(money('Fixed costs: 12,99 € a month'))).toBeOnTheScreen();
  });

  it('Empty: with nothing repeating My plan says "Nothing repeats yet." and offers Add', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary] });
    await openPlan();
    expect(screen.getByText('Every month')).toBeOnTheScreen();
    expect(screen.getByText('Nothing repeats yet.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add a monthly entry' })).toBeOnTheScreen();
    expect(screen.queryByText(/Fixed costs/)).not.toBeOnTheScreen();
  });

  it('Add: the form opens for today with "Repeat every month" on; saving records today\'s entry and lists the item', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary] });
    await openPlan();
    await press('Add a monthly entry');

    expect(screen).toHavePathname('/entry');
    expect(screen.getByText(/Sun 15 Nov/)).toBeOnTheScreen();
    expect(repeatSwitch()).toBeChecked();
    await type('Amount', '12,99');
    await choose('Subscriptions');
    await type('Note (optional)', 'Netflix');
    await press('Add expense');

    // Back where it came from, with the item listed.
    expect(screen.getByRole('button', { name: /^Netflix, 12,99.€, every month$/ })).toBeOnTheScreen();
    expect(screen.getByText(money('Fixed costs: 12,99 € a month'))).toBeOnTheScreen();
    expect(await entryDates('Netflix')).toEqual([['2026-11-15', 1299]]);
  });

  it('Change: Rent changed to 950,00 € shows in the list, next month records it and this month keeps 900,00 €', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary], raw: [...RENT] });
    await openPlan();
    await press(/^Rent, .*every month$/);
    expect(screen).toHavePathname('/recurring');
    expect(screen.getByLabelText('Amount')).toBeOnTheScreen();
    await type('Amount', '950,00');
    await press('Save changes');

    expect(screen).toHavePathname('/plan');
    expect(screen.getByRole('button', { name: /^Rent, 950,00.€, every month$/ })).toBeOnTheScreen();
    expect(screen.getByText(money('Fixed costs: 950,00 € a month'))).toBeOnTheScreen();
    expect(await entryDates('Rent')).toEqual([['2026-11-02', 90000]]);

    await reopenApp(DEC_4);
    expect(await entryDates('Rent')).toEqual([['2026-11-02', 90000], ['2026-12-01', 95000]]);
  });

  it('Change: category and note can change too, from next month', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary], raw: [...RENT] });
    await openPlan();
    await press(/^Rent, .*every month$/);
    await choose('Leisure');
    await type('Note (optional)', 'Gym');
    await press('Save changes');
    expect(screen.getByRole('button', { name: /^Gym, 900,00.€, every month$/ })).toBeOnTheScreen();

    await reopenApp(DEC_4);
    expect(screen.getByRole('button', { name: /^Gym, Tue 1 Dec,/ })).toBeOnTheScreen();
  });

  it('Change: a monthly item cannot be saved with an empty amount', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary], raw: [...RENT] });
    await openPlan();
    await press(/^Rent, .*every month$/);
    await type('Amount', '');
    await press('Save changes');
    expect(screen).toHavePathname('/recurring');
    expect(await items()).toEqual([expect.objectContaining({ amount_cents: 90000 })]);
  });

  it('The item screen shows the kind, which cannot be edited', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary], raw: [...RENT] });
    await openPlan();
    await press(/^Rent, .*every month$/);
    expect(screen.getByText('Expense')).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Income' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Savings' })).not.toBeOnTheScreen();
  });

  it('Stop: after confirming, Rent leaves the list, is not recorded later and the entries already recorded stay', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary], raw: [...RENT] });
    await openPlan();
    await press(/^Rent, .*every month$/);
    await press('Stop repeating');
    expectDialog('Stop repeating?');
    expect(screen.getByText('Past entries stay.')).toBeOnTheScreen();
    await answerDialog('Stop');

    expect(screen).toHavePathname('/plan');
    expect(screen.queryByRole('button', { name: /^Rent, 900,00.€, every month$/ })).not.toBeOnTheScreen();
    expect(screen.getByText('Nothing repeats yet.')).toBeOnTheScreen();

    await reopenApp(DEC_4);
    expect(row('Rent')).not.toBeOnTheScreen();
    await openPicker();
    await press('Nov');
    expect(row('Rent')).toBeOnTheScreen();
  });

  it('Stop can be cancelled: the item stays', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary], raw: [...RENT] });
    await openPlan();
    await press(/^Rent, .*every month$/);
    await press('Stop repeating');
    await answerDialog('Cancel');
    expectNoDialog();
    expect(screen).toHavePathname('/recurring');
    expect(await items()).toEqual([expect.objectContaining({ active: 1 })]);
  });

  it('Stop from the entry: turning the switch off on an entry of the item and saving stops it', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary], raw: [...RENT] });
    await press(/Rent/);
    expect(repeatSwitch()).toBeChecked();
    await toggleRepeat();
    await press('Save changes');

    // Entries of a stopped item keep their repeat icon (FR-006).
    expect(repeating('Rent')).toBeOnTheScreen();
    await openPlan();
    expect(screen.getByText('Nothing repeats yet.')).toBeOnTheScreen();
    await reopenApp(DEC_4);
    expect(row('Rent')).not.toBeOnTheScreen();
  });

  it('Past month: while viewing a past month My plan is not offered', async () => {
    await startApp({ today: NOV_15, entries: [{ ...plainSalary, date: '2026-10-01' }], raw: [...RENT] });
    await openPicker();
    await press('Oct');
    expect(screen.queryByRole('button', { name: 'My plan' })).not.toBeOnTheScreen();
  });

  it('A monthly item that no longer exists says so', async () => {
    await startApp({ today: NOV_15, entries: [plainSalary] });
    await testRouter.navigate('/recurring?id=999');
    expect(screen.getByText('This monthly entry no longer exists.')).toBeOnTheScreen();
  });
});

describe('US2 New month starts filled in (while the app stays open)', () => {
  it('Month changes while open: returning on 1 December fills in December', async () => {
    const listen = jest.spyOn(AppState, 'addEventListener');
    await startApp({ today: [2026, 10, 30], raw: [...RENT, ...SALARY] });
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();

    jest.setSystemTime(new Date(2026, 11, 1, 9));
    await act(async () => {
      for (const [event, handler] of listen.mock.calls) if (event === 'change') (handler as (state: string) => void)('active');
    });

    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Rent, Today, 900,00.€, repeats every month$/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Salary, Today, \+2.000,00.€, repeats every month$/ })).toBeOnTheScreen();
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();
    expect(rowsOf('Rent')).toHaveLength(1);
    listen.mockRestore();
  });
});
