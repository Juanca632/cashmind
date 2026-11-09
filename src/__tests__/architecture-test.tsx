import { Alert } from 'react-native';
import { fireEvent, screen, testRouter } from 'expo-router/testing-library';

import {
  answerDialog,
  breakDeviceWrites,
  dumpDevice,
  exactText,
  standardPlan,
  startApp,
} from '../test-support/app';
import { RELAX_TABLES } from '../test-support/damaged-data';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

const alertSpy = jest.spyOn(Alert, 'alert');

afterEach(() => {
  alertSpy.mockClear();
  jest.useRealTimers();
});

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);

const cinema = { date: '2026-11-05', bucket: 'leisure', amountCents: 1250, note: 'Cinema' } as const;
const NOT_SAVED = /could not be saved/i;
const UNREADABLE = /some of your data could not be read/i;

/** The user is told in an alert or on the screen. */
function expectMessage(message: RegExp) {
  const alerted = alertSpy.mock.calls.some(([title, body]) => message.test(`${title} ${body ?? ''}`));
  expect(alerted || screen.queryByText(message) !== null).toBe(true);
}

describe('A failed change is always explained', () => {
  it('Plan: storage fails when saving', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    await type('Income', '2500');
    await breakDeviceWrites();
    await press('Save plan');

    expectMessage(/plan could not be saved/i);
    expect(screen).toHavePathname('/plan-edit');
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeOnTheScreen();
  });

  it('Plan: first-time setup fails when saving', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Item 1 name', 'House');
    await type('Item 1 amount', '1000');
    await press('Next');
    await type('Savings', '10');
    await breakDeviceWrites();
    await press('Save plan');

    expectMessage(/plan could not be saved/i);
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeOnTheScreen();
  });

  it('Expense: storage fails when adding', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('Add expense');
    await type('Amount', '12,50');
    await breakDeviceWrites();
    await press('Add expense');

    expectMessage(NOT_SAVED);
    expect(screen).toHavePathname('/expense');
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeOnTheScreen();
  });

  it('Expense: storage fails when editing', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']], expenses: [cinema] });
    await press(/Cinema/);
    await type('Amount', '15,00');
    await breakDeviceWrites();
    await press('Save changes');

    expectMessage(NOT_SAVED);
    expect(screen).toHavePathname('/expense');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeOnTheScreen();
  });

  it('Expense: storage fails when deleting', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']], expenses: [cinema] });
    await press(/Cinema/);
    await breakDeviceWrites();
    await press('Delete');
    await answerDialog('Delete');

    expectMessage(NOT_SAVED);
    expect(screen).toHavePathname('/expense');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeOnTheScreen();
  });
});

describe('Damaged data is detected, never hidden or altered', () => {
  const damagedExpense = [
    ...RELAX_TABLES,
    "INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-06', 'leisure', 12.5, 'Broken')",
  ];
  const damagedPlan = [
    ...RELAX_TABLES,
    'PRAGMA ignore_check_constraints = ON',
    "INSERT INTO plan_version (effective_month, kept_bucket, kept_unit, kept_value) VALUES ('2026-07', 'savings', 'weeks', 30)",
    'PRAGMA ignore_check_constraints = OFF',
  ];

  it('Stored expense with a non-whole amount: the month says data could not be read', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']], expenses: [cinema], raw: damagedExpense });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByText('Broken')).not.toBeOnTheScreen();
    expect(screen.queryByText('Cinema')).not.toBeOnTheScreen();
    expect(screen.queryByText(exactText('12,50 €'))).not.toBeOnTheScreen();
  });

  it('Stored expense with a text amount: the month says data could not be read', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      raw: [...RELAX_TABLES, "INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-06', 'leisure', 'abc', 'Broken')"],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
  });

  it('Stored expense with an impossible date: the month says data could not be read', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      raw: [...RELAX_TABLES, "INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-02-31', 'leisure', 500, 'Broken')"],
    });
    await press(/^Month:/);
    await press('Feb');

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
  });

  it('Unknown plan unit: the home screen says data could not be read', async () => {
    await startApp({ today: [2026, 10, 7], raw: damagedPlan });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByText('Plan your month')).not.toBeOnTheScreen();
  });

  it.each([['/plan'], ['/plan-edit'], ['/month-picker']] as const)(
    'Unknown plan unit: %s says data could not be read',
    async (route) => {
      await startApp({ today: [2026, 10, 7], raw: damagedPlan });
      await testRouter.push(route);

      expect(screen).toHavePathname(route);
      expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    },
  );

  it('Detecting damaged data changes no stored row', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-06']],
      expenses: [cinema],
      raw: [
        ...damagedExpense,
        ...damagedPlan.filter((sql) => !RELAX_TABLES.includes(sql)).map((sql) => sql.replace('2026-07', '2026-08'))],
    });
    const before = await dumpDevice();

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    await testRouter.push('/plan');
    await testRouter.push('/month-picker');

    expect(await dumpDevice()).toEqual(before);
    expect((before[0] as unknown[]).length).toBeGreaterThanOrEqual(2);
    expect((before[1] as unknown[]).length).toBe(2);
  });

  it('A valid expense that could no longer be saved today is still shown', async () => {
    await startApp({
      today: [2027, 2, 1],
      plans: [[standardPlan, '2026-07']],
      expenses: [{ date: '2026-11-30', bucket: 'leisure', amountCents: 1250, note: 'Cinema' }],
    });
    await press(/^Month:/);
    await press('Previous year');
    await press('Nov');

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    expect(screen.getByText(exactText('12,50 €'))).toBeOnTheScreen();
    expect(screen.queryByText(UNREADABLE)).not.toBeOnTheScreen();
  });

  it('Months with no plan are not damaged data', async () => {
    await startApp({ today: [2026, 10, 7] });

    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
    expect(screen.queryByText(UNREADABLE)).not.toBeOnTheScreen();
  });
});
