import { StyleSheet } from 'react-native';
import { screen } from 'expo-router/testing-library';

import { press, showPocket, startApp, type } from '../test-support/app';
import { seedDevice } from '../test-support/fake-sqlite';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => jest.useRealTimers());

const TODAY: [number, number, number] = [2026, 10, 25];
const NO_GOAL: [number, string][] = [[0, '2026-01']];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Pay' } as const;
const rent = { date: '2026-11-02', kind: 'expense', amountCents: 123450, note: 'Rent', category: 'housing' } as const;
const store = (value: string) => [`INSERT INTO setting (key, value) VALUES ('currency', '${value}')`];
const field = (label = 'Amount') => screen.getByLabelText(label);
const rows = async (sql: string) => {
  let out: any[] = [];
  await seedDevice(async (db) => {
    out = await db.getAllAsync(sql);
  });
  return out;
};

describe('Read a big amount while typing it (033): entry form', () => {
  it.each([
    ['COP', '1500000', '1.500.000', 150000000],
    ['EUR', '1500000,5', '1 500 000,5', 150000050],
    ['USD', '1500000.5', '1,500,000.5', 150000050],
  ])('Typing: in %s, typing %s shows "%s" and saves %d cents', async (code, typed, shown, cents) => {
    await startApp({ today: TODAY, plans: NO_GOAL, entries: [salary], raw: store(code) });
    await press('Add expense');
    await type('Amount', typed);
    expect(field()).toHaveDisplayValue(shown);

    await press('Add expense');
    const stored = (await rows('SELECT amount_cents FROM entry')).map((r) => r.amount_cents);
    expect(stored).toContain(cents);
  });

  it('Euro: "." typed as the decimal mark shows ","', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', '12.5');
    expect(field()).toHaveDisplayValue('12,5');
  });

  it('As you type: Euro regroups with each digit and when a digit is deleted', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', '1234');
    expect(field()).toHaveDisplayValue('1 234');
    await type('Amount', '1 2345');
    expect(field()).toHaveDisplayValue('12 345');
    await type('Amount', '1 234');
    expect(field()).toHaveDisplayValue('1 234');
    await type('Amount', '123');
    expect(field()).toHaveDisplayValue('123');
  });

  it('Two decimals: "12,345" in Euro stays "12,34"', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', '12,345');
    expect(field()).toHaveDisplayValue('12,34');
  });

  it('Leading zeros: "007" shows "7" and ",5" shows "0,5"', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', '007');
    expect(field()).toHaveDisplayValue('7');
    await type('Amount', ',5');
    expect(field()).toHaveDisplayValue('0,5');
  });

  it('Dollar comma: deleting a digit of "12,345" gives "1,234", never 12.34', async () => {
    await startApp({ today: TODAY, entries: [salary], raw: store('USD') });
    await press('Add expense');
    await type('Amount', '12,345');
    expect(field()).toHaveDisplayValue('12,345');
    await type('Amount', '12,34');
    expect(field()).toHaveDisplayValue('1,234');
    await press('Add expense');
    expect((await rows('SELECT amount_cents FROM entry')).map((r) => r.amount_cents)).toContain(123400);
  });

  it('Not an amount: text stays as typed and the field says so', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', 'abc');
    expect(field()).toHaveDisplayValue('abc');
    await press('Add expense');
    expect(screen).toHavePathname('/entry');
    expect((await rows('SELECT amount_cents FROM entry')).length).toBe(1);
  });

  it('Limit: too large an amount still says "This amount is too large." and saves nothing', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', '900000000,01');
    expect(field()).toHaveDisplayValue('900 000 000,01');
    await press('Add expense');
    expect(screen.getByText('This amount is too large.')).toBeOnTheScreen();
    expect((await rows('SELECT amount_cents FROM entry')).length).toBe(1);
  });

  it('Limit: 900 000 000,00 is accepted and shown whole', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', '900000000');
    expect(field()).toHaveDisplayValue('900 000 000');
    await press('Add expense');
    expect((await rows('SELECT amount_cents FROM entry')).map((r) => r.amount_cents)).toContain(90000000000);
  });
});

describe('Read a big amount while typing it (033): editing an existing amount', () => {
  it.each([
    ['EUR', '1 234,50'],
    ['USD', '1,234.50'],
  ])('Editing: in %s a 1 234,50 entry opens as "%s"', async (code, shown) => {
    await startApp({ today: TODAY, plans: NO_GOAL, entries: [salary, rent], raw: store(code) });
    await press(/Rent/);
    expect(field()).toHaveDisplayValue(shown);
  });

  it('Editing: in pesos 1234567 opens as "1.234.567"', async () => {
    await startApp({ today: TODAY, plans: NO_GOAL, entries: [salary, { ...rent, amountCents: 123456700 }], raw: store('COP') });
    await press(/Rent/);
    expect(field()).toHaveDisplayValue('1.234.567');
  });

  it('Saved value: saving an edited entry without touching the amount keeps it', async () => {
    await startApp({ today: TODAY, plans: NO_GOAL, entries: [salary, rent] });
    await press(/Rent/);
    await press('Save changes');
    expect((await rows('SELECT amount_cents FROM entry ORDER BY amount_cents')).map((r) => r.amount_cents)).toEqual([123450, 200000]);
  });
});

describe('Read a big amount while typing it (033): everywhere', () => {
  it('Monthly entry form groups the amount', async () => {
    const raw = [
      "INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month) VALUES (1, 'expense', 'housing', 90000, 'Rent', 1, '2026-11')",
      "INSERT INTO entry (date, kind, category, amount_cents, note, recurring_id) VALUES ('2026-11-02', 'expense', 'housing', 90000, 'Rent', 1)",
    ];
    await startApp({ today: TODAY, entries: [salary], raw });
    await press('My plan');
    expect(screen.getByRole('button', { name: /^Rent, .*every month$/ })).toBeOnTheScreen();
    await press(/^Rent, .*every month$/);
    expect(field()).toHaveDisplayValue('900,00');
    await type('Amount', '1500000,5');
    expect(field()).toHaveDisplayValue('1 500 000,5');
    await press('Save changes');
    expect((await rows('SELECT amount_cents FROM recurring')).map((r) => r.amount_cents)).toEqual([150000050]);
  });

  it('A pocket\'s starting amount groups and saves what was typed', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press(/^Space: /);
    await press(/New pocket$/);
    await type('Name', 'Japan trip');
    await type('Amount', '1500000,5');
    expect(field()).toHaveDisplayValue('1 500 000,5');
    await press('Create pocket');
    expect((await rows('SELECT starting_cents FROM pocket')).map((r) => r.starting_cents)).toEqual([150000050]);
  });

  it('Move groups the amount', async () => {
    await startApp({ today: TODAY, plans: NO_GOAL, entries: [salary], pockets: [{ name: 'Emergency fund', startingCents: 200000000 }, { name: 'Car' }] });
    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '1500000,5');
    expect(field()).toHaveDisplayValue('1 500 000,5');
    await press('Move');
    expect((await rows('SELECT amount_cents FROM move')).map((r) => r.amount_cents)).toEqual([150000050]);
  });

  it('Split: each pocket field groups and what is typed is saved', async () => {
    await startApp({
      today: TODAY,
      entries: [{ ...salary, amountCents: 100000000 }],
      pockets: [{ name: 'Emergency' }, { name: 'Travel' }],
    });
    await press('Split savings');
    await type('Emergency amount', '150000,5');
    await type('Travel amount', '1234');
    expect(field('Emergency amount')).toHaveDisplayValue('150 000,5');
    expect(field('Travel amount')).toHaveDisplayValue('1 234');
    await press('Save');
    const saved = await rows("SELECT pocket_id, amount_cents FROM entry WHERE kind = 'savings' ORDER BY pocket_id");
    expect(saved).toEqual([
      { pocket_id: 1, amount_cents: 15000050 },
      { pocket_id: 2, amount_cents: 123400 },
    ]);
  });
});

describe('Read a big amount while typing it (033): never cut (scenario 9, FR-005)', () => {
  const size = () => StyleSheet.flatten(field().props.style)?.fontSize;

  it.each([
    ['1', 56],
    ['1234567', 56], // "1 234 567" is 9 characters: full size
    ['12345678', 50], // "12 345 678" is 10 characters: floor(56 * 9 / 10)
    ['123456789,12', 36], // "123 456 789,12" is 14 characters: floor(56 * 9 / 14)
  ])('Entry form: typing %s gives a font size of %d', async (typed, expected) => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', typed);
    expect(size()).toBe(expected);
  });

  it('Entry form: the font grows back when digits are deleted', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await type('Amount', '123456789');
    expect(size()).toBeLessThan(56);
    await type('Amount', '123');
    expect(size()).toBe(56);
  });
});
