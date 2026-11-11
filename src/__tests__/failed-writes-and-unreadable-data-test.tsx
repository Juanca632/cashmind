import { Alert } from 'react-native';
import { screen, testRouter } from 'expo-router/testing-library';

import {
  answerDialog,
  breakDeviceWrites,
  dumpDevice,
  exactText,
  expectLeftToSpend,
  expectNoDialog,
  partialText,
  press,
  startApp,
  type,
} from '../test-support/app';
import { RELAX_TABLES } from '../test-support/damaged-data';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

const alertSpy = jest.spyOn(Alert, 'alert');

afterEach(() => {
  alertSpy.mockClear();
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 7];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Salary' } as const;
const cinema = { date: '2026-11-05', kind: 'expense', amountCents: 1250, note: 'Cinema' } as const;
const NOT_SAVED = 'The entry could not be saved. Please try again.';
const NOT_DELETED = 'The entry could not be deleted. Please try again.';
const UNREADABLE = /some of your data could not be read/i;

/** The user is told in an alert or on the screen. */
function expectMessage(message: RegExp | string) {
  const matches = (text: string) => (typeof message === 'string' ? text.includes(message) : message.test(text));
  const alerted = alertSpy.mock.calls.some(([title, body]) => matches(`${title} ${body ?? ''}`));
  const shown = typeof message === 'string' ? screen.queryByText(message, { exact: false }) : screen.queryByText(message);
  expect(alerted || shown !== null).toBe(true);
}

describe('A failed change is always explained', () => {
  it('Plan: storage fails when saving', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('My plan');
    await type('Savings percentage', '30');
    await breakDeviceWrites();
    await press('Save plan');

    expectMessage(/plan could not be saved/i);
    expect(screen).toHavePathname('/plan');
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeOnTheScreen();
  });

  it('Expense: storage fails when adding', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', '12,50');
    await breakDeviceWrites();
    await press('Add expense');

    expectMessage(NOT_SAVED);
    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeOnTheScreen();
  });

  it('Expense: storage fails when editing', async () => {
    await startApp({ today: TODAY, entries: [salary, cinema] });
    await press(/Cinema/);
    await type('Amount', '15,00');
    await breakDeviceWrites();
    await press('Save changes');

    expectMessage(NOT_SAVED);
    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeOnTheScreen();
  });

  it('Expense: storage fails when deleting', async () => {
    await startApp({ today: TODAY, entries: [salary, cinema] });
    await press(/Cinema/);
    await breakDeviceWrites();
    await press('Delete');
    await answerDialog('Delete');

    expectMessage(NOT_DELETED);
    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeOnTheScreen();
    expectNoDialog();
  });
});

describe('Damaged data is detected, never hidden or altered', () => {
  const damagedExpense = [
    ...RELAX_TABLES,
    "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-06', 'expense', 12.5, 'Broken')",
  ];
  const damagedPlan = [
    ...RELAX_TABLES,
    "INSERT INTO plan_version (effective_month, savings_pct) VALUES ('2026-07', 'lots')",
  ];

  it('Stored expense with a non-whole amount: the month says data could not be read', async () => {
    await startApp({ today: TODAY, entries: [salary, cinema], raw: damagedExpense });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByText('Broken')).not.toBeOnTheScreen();
    expect(screen.queryByText('Cinema')).not.toBeOnTheScreen();
    expect(screen.queryByText(exactText('12,50 €'))).not.toBeOnTheScreen();
  });

  it('Stored expense with a text amount: the month says data could not be read', async () => {
    await startApp({
      today: TODAY,
      raw: [...RELAX_TABLES, "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-06', 'expense', 'abc', 'Broken')"],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
  });

  it('Stored expense of an unknown kind (an old "leisure" row left over): the month says data could not be read', async () => {
    await startApp({
      today: TODAY,
      raw: [...RELAX_TABLES, "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-06', 'leisure', 500, 'Broken')"],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
  });

  it('Stored expense with an impossible date: the month says data could not be read', async () => {
    await startApp({
      today: TODAY,
      raw: [...RELAX_TABLES, "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-31', 'expense', 500, 'Broken')"],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
  });

  it('Unreadable date in the month picker: it says data could not be read and no data is changed', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      raw: [...RELAX_TABLES, "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2025/03/10', 'expense', 500, 'Broken')"],
    });
    const before = await dumpDevice();
    await testRouter.push('/month-picker');

    expect(screen).toHavePathname('/month-picker');
    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Previous year' })).not.toBeOnTheScreen();
    expect(await dumpDevice()).toEqual(before);
  });

  it('Unreadable plan: the home screen says data could not be read instead of figures', async () => {
    await startApp({ today: TODAY, entries: [salary], raw: damagedPlan });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByText('Left to spend')).not.toBeOnTheScreen();
  });

  it('Unreadable plan: /plan says data could not be read', async () => {
    await startApp({ today: TODAY, raw: damagedPlan });
    await testRouter.push('/plan');

    expect(screen).toHavePathname('/plan');
    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
  });

  it('A plan percentage above 100 is also unreadable', async () => {
    await startApp({
      today: TODAY,
      raw: [...RELAX_TABLES, "INSERT INTO plan_version (effective_month, savings_pct) VALUES ('2026-07', 150)"],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
  });

  it.each([
    ['a text amount', "'2026-09-01', 'income', 'abc', 'Old pay'"],
    ['an amount of zero', "'2026-09-01', 'income', 0, 'Old pay'"],
    ['a non-whole amount', "'2026-09-01', 'income', 1999.5, 'Old pay'"],
    ['an impossible date', "'2026-09-31', 'income', 200000, 'Old pay'"],
  ])('An earlier month with an income that has %s: a month without income says data could not be read and changes nothing', async (_label, values) => {
    await startApp({
      today: TODAY,
      entries: [{ date: '2026-11-02', kind: 'expense', amountCents: 500, note: 'Coffee' }],
      raw: [...RELAX_TABLES, `INSERT INTO entry (date, kind, amount_cents, note) VALUES (${values})`],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Repeat last income' })).not.toBeOnTheScreen();
    const [entries] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({ kind: 'income', note: 'Old pay' });
  });

  it('Detecting damaged data changes no stored row', async () => {
    await startApp({
      today: TODAY,
      plans: [[30, '2026-06']],
      entries: [salary, cinema],
      raw: [...damagedExpense, "INSERT INTO plan_version (effective_month, savings_pct) VALUES ('2026-08', 'lots')"],
    });
    const before = await dumpDevice();

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    await testRouter.push('/plan');
    await testRouter.push('/month-picker');

    expect(await dumpDevice()).toEqual(before);
    expect((before[0] as unknown[]).length).toBe(3);
    expect((before[1] as unknown[]).length).toBe(2);
  });
  it.each([
    ['an amount of zero', "'2026-11-06', 'expense', 0, 'Broken'", { amount_cents: 0, note: 'Broken' }],
    ['a negative amount', "'2026-11-06', 'expense', -500, 'Broken'", { amount_cents: -500, note: 'Broken' }],
  ])('Stored expense with %s: the month says data could not be read and the row stays as it was', async (_label, values, kept) => {
    await startApp({
      today: TODAY,
      entries: [salary],
      raw: [...RELAX_TABLES, `INSERT INTO entry (date, kind, amount_cents, note) VALUES (${values})`],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByText('Left to spend')).not.toBeOnTheScreen();
    const [entries] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject(kept);
  });

  it('Stored expense with a note that is not text: the month says data could not be read and the row stays', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      raw: [...RELAX_TABLES, "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-06', 'expense', 500, X'0102')"],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    const [entries] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({ amount_cents: 500 });
    expect(entries[1].note).not.toBe('');
  });

  it.each([
    ['text', 'July 2026'],
    ['missing zero', '2026-7'],
    ['a day included', '2026-07-01'],
  ])('Stored plan with a badly formatted month (%s): home says data could not be read and nothing changes', async (_label, month) => {
    await startApp({
      today: TODAY,
      entries: [salary],
      raw: [...RELAX_TABLES, `INSERT INTO plan_version (effective_month, savings_pct) VALUES ('${month}', 30)`],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByText('Left to spend')).not.toBeOnTheScreen();
    const [, plans] = (await dumpDevice()) as [unknown, Record<string, unknown>[]];
    expect(plans).toEqual([{ effective_month: month, savings_pct: 30 }]);
  });
});

describe('Data that is not damaged is never reported as damaged', () => {
  it('An amount above 900 000 € is shown with the month figures, not reported as unreadable', async () => {
    await startApp({
      today: TODAY,
      raw: [
        "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-01', 'income', 100000000, 'Big pay')",
        "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-03', 'expense', 500, 'Coffee')",
      ],
    });

    expect(screen.queryByText(UNREADABLE)).not.toBeOnTheScreen();
    expect(screen.getByText('Big pay')).toBeOnTheScreen();
    expect(screen.getByText(partialText('1 000 000,00 €'))).toBeOnTheScreen();
    await expectLeftToSpend('799 995,00 €');
  });

  it('An entry dated after today is listed and counted, not reported as unreadable', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      raw: ["INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-20', 'expense', 2500, 'Booked ahead')"],
    });

    expect(screen.queryByText(UNREADABLE)).not.toBeOnTheScreen();
    expect(screen.getByText('Booked ahead')).toBeOnTheScreen();
    await expectLeftToSpend('1 575,00 €');
  });

  it('A past entry is still shown years later', async () => {
    await startApp({
      today: [2027, 2, 1],
      entries: [{ date: '2026-11-30', kind: 'expense', amountCents: 1250, note: 'Cinema' }],
    });
    await press(/^Month:/);
    await press('Previous year');
    await press('Nov');

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    expect(screen.getByText(exactText('12,50 €'))).toBeOnTheScreen();
    expect(screen.queryByText(UNREADABLE)).not.toBeOnTheScreen();
  });

  it('Months with no saved plan are not damaged data', async () => {
    await startApp({ today: TODAY });

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByText(UNREADABLE)).not.toBeOnTheScreen();
  });
});
