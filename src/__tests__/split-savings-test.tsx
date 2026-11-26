import { StyleSheet } from 'react-native';
import { fireEvent, screen, testRouter, within } from 'expo-router/testing-library';

import {
  DISCARD_DIALOG,
  answerDialog,
  choose,
  exactText,
  expectDialog,
  expectNoDialog,
  expectPocketBalance,
  headerTitles,
  partialText,
  press,
  reopenApp,
  showPocket,
  spaceRows,
  startApp,
  type,
} from '../test-support/app';
import { seedDevice } from '../test-support/fake-sqlite';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 12];
const DEC_4: [number, number, number] = [2026, 11, 4];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Pay' } as const;
const pockets = [{ name: 'Emergency', emoji: '🛟' }, { name: 'Travel', emoji: '✈️' }, { name: 'Investing', emoji: '📈' }];
const lastMonth = [
  { date: '2026-10-05', kind: 'savings', amountCents: 20000, note: '', pocketId: 1 },
  { date: '2026-10-05', kind: 'savings', amountCents: 10000, note: '', pocketId: 2 },
  { date: '2026-10-05', kind: 'savings', amountCents: 10000, note: '', pocketId: 3 },
] as const;
const oct = { date: '2026-10-01', kind: 'income', amountCents: 200000, note: 'Pay' } as const;

const text = (value: string) => screen.queryByText(exactText(value));
const field = (pocket: string) => screen.getByLabelText(`${pocket} amount`);
const shown = (pocket: string) => (field(pocket).props.value ?? field(pocket).props.defaultValue ?? '') as string;
/** The number a field holds, whatever the decimals are written like. */
const amountOf = (pocket: string) => Number(shown(pocket).replace(/[^\d,]/g, '').replace(',', '.') || '0');
const savingsInDb = async () => {
  let rows: any[] = [];
  await seedDevice(async (db) => {
    rows = await db.getAllAsync("SELECT date, amount_cents, note, pocket_id, recurring_id FROM entry WHERE kind = 'savings' ORDER BY id");
  });
  return rows;
};

const block = () => screen.getByLabelText(/^(Split savings|Savings)$/);
const blockBar = () => screen.queryByTestId('savings-goal-bar', { includeHiddenElements: true });

describe('See what is still to save this month', () => {
  it('Block: a 20 % plan and 2000,00 € of income with no savings shows Income and Spent tiles and under them the Savings block "0 € of 400 €", the bar, "400,00 € to split" and "Split"', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });

    const names = screen.getAllByText(/^(Overview|Income|Spent|Savings)$/).map((n) => n.props.children);
    expect(names.slice(0, 4)).toEqual(['Overview', 'Income', 'Spent', 'Savings']);
    const savings = within(block());
    expect(savings.getByText(partialText('0 € of 400 €'))).toBeOnTheScreen();
    expect(savings.getByText(exactText('400,00 € to split'))).toBeOnTheScreen();
    expect(savings.getByText('Split')).toBeOnTheScreen();
    expect(blockBar()).toBeTruthy();
    expect(screen.queryByText('Savings for November')).not.toBeOnTheScreen();
  });

  it('Block: tapping it opens Split', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    expect(screen).toHavePathname('/split');
  });

  it('Block: the bar fills to saved over goal', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 10000, note: '', pocketId: 1 }],
      pockets,
    });
    expect(fillOf('savings-goal-bar')).toBe('25%');
  });

  it('Partly saved: with 250,00 € saved the block says "250 € of 400 €", the bar a little over half full and "150,00 € to split"', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 25000, note: '', pocketId: 1 }],
      pockets,
    });

    const savings = within(block());
    expect(savings.getByText(partialText('250 € of 400 €'))).toBeOnTheScreen();
    expect(savings.getByText(exactText('150,00 € to split'))).toBeOnTheScreen();
    expect(fillOf('savings-goal-bar')).toBe('62.5%');
  });

  it('Done: savings of 400,00 € in 3 pockets say "✓ In 3 pockets", a full bar, and do nothing when tapped', async () => {
    await startApp({
      today: TODAY,
      entries: [
        salary,
        { date: '2026-11-03', kind: 'savings', amountCents: 20000, note: '', pocketId: 1 },
        { date: '2026-11-04', kind: 'savings', amountCents: 10000, note: '', pocketId: 2 },
        { date: '2026-11-05', kind: 'savings', amountCents: 10000, note: '', pocketId: 3 },
      ],
      pockets,
    });

    expect(text('✓ In 3 pockets')).toBeOnTheScreen();
    expect(screen.queryByText(partialText('to split'))).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Split savings' })).not.toBeOnTheScreen();
    expect(fillOf('savings-goal-bar')).toBe('100%');
    await fireEvent.press(block());
    expect(screen).toHavePathname('/');
  });

  it('Done: more than the goal keeps the bar full and one pocket is "1 pocket"', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 25000, note: '', pocketId: 1 }, { date: '2026-11-04', kind: 'savings', amountCents: 25000, note: '', pocketId: 1 }],
      pockets,
    });

    expect(text('✓ In 1 pocket')).toBeOnTheScreen();
    expect(fillOf('savings-goal-bar')).toBe('100%');
  });

  it('No split offered: in a past month the block shows saved of goal and the bar only, and does nothing when tapped', async () => {
    await startApp({
      today: TODAY,
      entries: [oct, { date: '2026-10-05', kind: 'savings', amountCents: 5000, note: '', pocketId: 1 }, salary],
      pockets,
    });
    await press(/^Month:/);
    await press('Oct');

    expect(screen.getByRole('button', { name: 'Month: October 2026' })).toBeOnTheScreen();
    expect(within(block()).getByText(partialText('50 € of 400 €'))).toBeOnTheScreen();
    expect(blockBar()).toBeTruthy();
    expect(screen.queryByText(partialText('to split'))).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Split savings' })).not.toBeOnTheScreen();
    await fireEvent.press(block());
    expect(screen).toHavePathname('/');
  });

  it('No split offered: with a 0 % plan it shows what was saved and "No goal", without a bar', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 5000, note: '', pocketId: 1 }],
      pockets,
      plans: [[0, '2026-01']],
    });

    expect(within(block()).getByText('No goal')).toBeOnTheScreen();
    expect(within(block()).getByText(partialText('50 €'))).toBeOnTheScreen();
    expect(blockBar()).toBeNull();
    expect(screen.queryByText(partialText('to split'))).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Split savings' })).not.toBeOnTheScreen();
  });

  it('Savings are not a filter on home: the block is not a tile that lists only savings', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 40000, note: 'Piggy', pocketId: 1 }],
      pockets,
    });
    await fireEvent.press(block());
    expect(screen.queryByRole('button', { name: 'Show all' })).not.toBeOnTheScreen();
    expect(screen.getByText('Pay')).toBeOnTheScreen();
  });

  it('Not shown: in a pocket\'s space there is no Savings block', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await showPocket('Travel');
    expect(screen.queryByLabelText(/^(Split savings|Savings)$/)).not.toBeOnTheScreen();
  });

  it('Not shown: in a month with no income there is no Savings block', async () => {
    await startApp({ today: TODAY, pockets });

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^(Split savings|Savings)$/)).not.toBeOnTheScreen();
  });

  it('Income changes later: more income shows what is now still to split; less says the goal is done', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 40000, note: '', pocketId: 1 }],
      pockets,
    });
    expect(text('✓ In 1 pocket')).toBeOnTheScreen();

    await press('Add expense');
    await choose('Income');
    await type('Amount', '500');
    await press('Add income');
    expect(text('100,00 € to split')).toBeOnTheScreen();
  });
});

describe('Split it across pockets', () => {
  it('Screen: "Split" opens "Split savings" with the amount, a row per pocket in order, a New pocket link and the counter', async () => {
    await startApp({ today: TODAY, entries: [salary, oct, ...lastMonth], pockets });
    await press('Split savings');

    expect(screen).toHavePathname('/split');
    expect(headerTitles().at(-1)).toBe('Split savings');
    expect(screen.getByText(partialText('400,00 € to split'))).toBeOnTheScreen();
    expect(screen.getByText('Savings for November')).toBeOnTheScreen();
    for (const name of ['Emergency', 'Travel', 'Investing']) expect(screen.getByText(name)).toBeOnTheScreen();
    for (const emoji of ['🛟', '✈️', '📈']) expect(screen.getByText(emoji)).toBeOnTheScreen();
    const labels = screen.getAllByLabelText(/ amount$/).map((n) => n.props.accessibilityLabel);
    expect(labels).toEqual(['Emergency amount', 'Travel amount', 'Investing amount']);
    expect(screen.getByRole('button', { name: 'New pocket' })).toBeOnTheScreen();
  });

  it('Screen: a pocket shows what it already got this month, one that got nothing shows no such line', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 12000, note: '', pocketId: 1 }],
      pockets,
    });
    await press('Split savings');

    expect(screen.getByText(partialText('120,00'))).toBeOnTheScreen();
    expect(screen.getAllByText(partialText('this month'))).toHaveLength(1);
    expect(screen.getByText(partialText('280,00 € to split'))).toBeOnTheScreen();
  });

  it('Same proportions as last month: 200 / 100 / 100 over 500,00 € pre-fills 250,00 / 125,00 / 125,00', async () => {
    await startApp({ today: TODAY, entries: [{ ...salary, amountCents: 250000 }, oct, ...lastMonth], pockets });
    await press('Split savings');

    expect(screen.getByText(partialText('500,00 € to split'))).toBeOnTheScreen();
    expect([amountOf('Emergency'), amountOf('Travel'), amountOf('Investing')]).toEqual([250, 125, 125]);
    expect(text('Split 500,00 € of 500,00 €')).toBeOnTheScreen();
  });

  it('Rounding: the fields always add up to the amount to split, the remainder on the first pocket with a share', async () => {
    // 100,00 € to split (goal of 20 % of 500,00 €) over thirds: 33,34 / 33,33 / 33,33.
    await startApp({
      today: TODAY,
      entries: [{ ...salary, amountCents: 50000 }, { date: '2026-10-05', kind: 'savings', amountCents: 100, note: '', pocketId: 1 }, { date: '2026-10-05', kind: 'savings', amountCents: 100, note: '', pocketId: 2 }, { date: '2026-10-05', kind: 'savings', amountCents: 100, note: '', pocketId: 3 }],
      pockets,
    });
    await press('Split savings');

    expect([amountOf('Emergency'), amountOf('Travel'), amountOf('Investing')]).toEqual([33.34, 33.33, 33.33]);
    expect(text('Split 100,00 € of 100,00 €')).toBeOnTheScreen();
  });

  it('Same proportions as last month: last month is the most recent earlier month with savings', async () => {
    await startApp({
      today: TODAY,
      entries: [
        salary,
        { date: '2026-08-05', kind: 'savings', amountCents: 50000, note: '', pocketId: 3 },
        { date: '2026-09-05', kind: 'savings', amountCents: 30000, note: '', pocketId: 1 },
        { date: '2026-09-06', kind: 'savings', amountCents: 10000, note: '', pocketId: 2 },
      ],
      pockets,
    });
    await press('Split savings');

    expect([amountOf('Emergency'), amountOf('Travel'), amountOf('Investing')]).toEqual([300, 100, 0]);
  });

  it('A pocket created this month: it shows with an empty field', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, oct, ...lastMonth],
      pockets: [...pockets, { name: 'Gadgets' }],
    });
    await press('Split savings');

    expect(amountOf('Gadgets')).toBe(0);
    expect(shown('Gadgets')).toBe('');
    expect([amountOf('Emergency'), amountOf('Travel'), amountOf('Investing')]).toEqual([200, 100, 100]);
  });

  it('No earlier split: every field is empty and the counter says "Split 0,00 € of 500,00 €"', async () => {
    await startApp({ today: TODAY, entries: [{ ...salary, amountCents: 250000 }], pockets });
    await press('Split savings');

    for (const name of ['Emergency', 'Travel', 'Investing']) expect(shown(name)).toBe('');
    expect(text('Split 0,00 € of 500,00 €')).toBeOnTheScreen();
  });

  it('Change it: fields changed to 300 / 0 / 200 make the counter say "Split 500,00 € of 500,00 €"', async () => {
    await startApp({ today: TODAY, entries: [{ ...salary, amountCents: 250000 }, oct, ...lastMonth], pockets });
    await press('Split savings');
    await type('Emergency amount', '300');
    await type('Travel amount', '0');
    await type('Investing amount', '200');

    expect(text('Split 500,00 € of 500,00 €')).toBeOnTheScreen();
  });

  it('Change it: the counter follows what is typed, with decimals', async () => {
    await startApp({ today: TODAY, entries: [{ ...salary, amountCents: 250000 }], pockets });
    await press('Split savings');
    await type('Emergency amount', '120,50');
    await type('Travel amount', '30');

    expect(text('Split 150,50 € of 500,00 €')).toBeOnTheScreen();
  });

  it('Save: records one saving per pocket above 0, dated today, without a note, closes, and home shows the card\'s new state', async () => {
    await startApp({ today: TODAY, entries: [{ ...salary, amountCents: 250000 }, oct, ...lastMonth], pockets });
    await press('Split savings');
    await type('Emergency amount', '300');
    await type('Travel amount', '0');
    await type('Investing amount', '200');
    await press('Save');

    expect(screen).toHavePathname('/');
    expect(text('✓ In 2 pockets')).toBeOnTheScreen();
    const november = (await savingsInDb()).filter((s) => s.date >= '2026-11-01');
    expect(november).toEqual([
      { date: '2026-11-12', amount_cents: 30000, note: '', pocket_id: 1, recurring_id: null },
      { date: '2026-11-12', amount_cents: 20000, note: '', pocket_id: 3, recurring_id: null },
    ]);
    // Existing entries untouched.
    expect((await savingsInDb()).filter((s) => s.date < '2026-11-01')).toHaveLength(3);
  });

  it('Save: the pockets\' balances grow by what was split and the split does not repeat next month', async () => {
    await startApp({ today: TODAY, entries: [salary, oct, ...lastMonth], pockets });
    await press('Split savings');
    await press('Save');

    await expectPocketBalance('Emergency', '400,00 €');
    await expectPocketBalance('Travel', '200,00 €');
    await expectPocketBalance('Investing', '200,00 €');

    await reopenApp(DEC_4);
    await expectPocketBalance('Emergency', '400,00 €');
    expect(await savingsInDb()).toHaveLength(6);
  });

  it('Less than the goal: saving is allowed and the card then shows what is still to split', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    await type('Travel amount', '100');
    expect(text('Split 100,00 € of 400,00 €')).toBeOnTheScreen();
    await press('Save');

    expectNoDialog();
    expect(screen).toHavePathname('/');
    expect(text('300,00 € to split')).toBeOnTheScreen();
  });

  it('More than the goal: Save asks first, with the extra amount, and records only after confirming', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    await type('Emergency amount', '450');
    await press('Save');

    expect(screen.getByText('You save 50,00 € more than your plan. Your left to spend drops by 50,00 €.')).toBeOnTheScreen();
    expect(await savingsInDb()).toEqual([]);
    expect(screen).toHavePathname('/split');

    await answerDialog('Save');

    expect(await savingsInDb()).toEqual([expect.objectContaining({ amount_cents: 45000, pocket_id: 1 })]);
    expect(screen).toHavePathname('/');
    expect(text('✓ In 1 pocket')).toBeOnTheScreen();
  });

  it('More than the goal: cancelling the dialog records nothing and keeps the screen', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    await type('Emergency amount', '450');
    await press('Save');
    await press('Cancel');

    expect(await savingsInDb()).toEqual([]);
    expect(screen).toHavePathname('/split');
    expect(text('Split 450,00 € of 400,00 €')).toBeOnTheScreen();
  });

  it('More than the goal: exactly the goal does not ask', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    await type('Emergency amount', '400');
    await press('Save');

    expect(screen).toHavePathname('/');
  });

  it('Nothing typed: with every field empty or 0, Save is not possible', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    await press('Save');
    expect(screen).toHavePathname('/split');

    await type('Emergency amount', '0');
    await press('Save');

    expect(screen).toHavePathname('/split');
    expect(await savingsInDb()).toEqual([]);
  });

  it('Leaving: after changing a field, leaving asks before discarding, and keeps the changes if cancelled', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    await type('Emergency amount', '100');
    await testRouter.back();

    expectDialog(DISCARD_DIALOG);
    await answerDialog('Keep editing', DISCARD_DIALOG);
    expect(screen).toHavePathname('/split');
    expect(text('Split 100,00 € of 400,00 €')).toBeOnTheScreen();

    await testRouter.back();
    await answerDialog('Discard', DISCARD_DIALOG);
    expect(screen).toHavePathname('/');
    expect(await savingsInDb()).toEqual([]);
    expect(text('400,00 € to split')).toBeOnTheScreen();
  });

  it('Leaving: leaving a pre-filled screen without changing anything does not ask', async () => {
    await startApp({ today: TODAY, entries: [salary, oct, ...lastMonth], pockets });
    await press('Split savings');
    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/');
  });

  it('No pockets: the screen shows only "New pocket"; after creating one the user comes back and it lists it', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Split savings');

    expect(screen.queryAllByLabelText(/ amount$/)).toHaveLength(0);
    await press('New pocket');
    expect(screen).toHavePathname('/pocket-edit');
    await type('Name', 'Car');
    await press('Create pocket');

    expect(screen).toHavePathname('/split');
    expect(shown('Car')).toBe('');
    expect(text('Split 0,00 € of 400,00 €')).toBeOnTheScreen();
  });

  it('New pocket: a pocket created from the screen keeps what was already typed and starts empty', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    await type('Travel amount', '75');
    await press('New pocket');
    await type('Name', 'Car');
    await press('Create pocket');

    expect(screen).toHavePathname('/split');
    expect(amountOf('Travel')).toBe(75);
    expect(shown('Car')).toBe('');
    await type('Car amount', '25');
    await press('Save');
    await expectPocketBalance('Car', '25,00 €');
    await expectPocketBalance('Travel', '75,00 €');
  });
});

describe('Split it across pockets - journey with an earlier month', () => {
  it('Two taps: Split, Save in the new month records the same proportions as last month', async () => {
    await startApp({ today: TODAY, entries: [salary, oct, ...lastMonth], pockets });
    await press('Split savings');
    await press('Save');

    expect((await savingsInDb()).filter((s) => s.date >= '2026-11-01').map((s) => [s.pocket_id, s.amount_cents])).toEqual([
      [1, 20000],
      [2, 10000],
      [3, 10000],
    ]);
    expect(text('✓ In 3 pockets')).toBeOnTheScreen();
  });

  it('Savings made elsewhere count: a saving added from the entry form reduces what is to split, and Split never changes it', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Add expense');
    await choose('Savings');
    await choose('Travel');
    await type('Amount', '150');
    await press('Add to savings');
    expect(text('250,00 € to split')).toBeOnTheScreen();

    await press('Split savings');
    await type('Emergency amount', '250');
    await press('Save');

    const rows = await savingsInDb();
    expect(rows.map((r) => [r.pocket_id, r.amount_cents])).toEqual([
      [2, 15000],
      [1, 25000],
    ]);
    expect(text('✓ In 2 pockets')).toBeOnTheScreen();
  });
});

const repeatSwitch = () => screen.queryByRole('switch', { name: 'Repeat every month' });
const oldRepeatingSaving = [
  "INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month, pocket_id) VALUES (1, 'savings', 'other', 30000, 'Plan', 1, '2026-11', 1);",
  "INSERT INTO entry (date, kind, category, amount_cents, note, recurring_id, pocket_id) VALUES ('2026-11-02', 'savings', 'other', 30000, 'Plan', 1, 1);",
];

describe('No more repeating savings', () => {
  it('Switch: the entry form shows "Repeat every month" for expenses and income but not for Savings', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Add expense');
    expect(repeatSwitch()).toBeOnTheScreen();

    await choose('Savings');
    expect(repeatSwitch()).not.toBeOnTheScreen();

    await choose('Income');
    expect(repeatSwitch()).toBeOnTheScreen();

    await choose('Expense');
    expect(repeatSwitch()).toBeOnTheScreen();
  });

  it('Switch: editing an existing saving shows no repeat switch either', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 5000, note: 'Coins', pocketId: 1 }],
      pockets,
    });
    await press(/Coins/);

    expect(screen).toHavePathname('/entry');
    expect(repeatSwitch()).not.toBeOnTheScreen();
  });

  it('Existing repeating savings: a new month does not record it', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets, raw: oldRepeatingSaving });
    await reopenApp(DEC_4);

    await expectPocketBalance('Emergency', '300,00 €');
    expect((await savingsInDb()).filter((s) => s.date >= '2026-12-01')).toEqual([]);
  });

  it('Existing repeating savings: My plan\'s "Every month" section does not list it', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets, raw: oldRepeatingSaving });
    await press('My plan');

    expect(screen).toHavePathname('/plan');
    expect(screen.queryByRole('button', { name: /^Plan, / })).not.toBeOnTheScreen();
    expect(screen.queryByText('Plan')).not.toBeOnTheScreen();
  });

  it('Existing repeating savings: other items still repeat and are listed', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      pockets,
      raw: [
        ...oldRepeatingSaving,
        "INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month) VALUES (2, 'expense', 'housing', 90000, 'Rent', 1, '2026-11');",
      ],
    });
    await press('My plan');
    expect(screen).toHavePathname('/plan');
    expect(screen.getByRole('button', { name: /^Rent, / })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Plan, / })).not.toBeOnTheScreen();
  });

  it('Existing repeating savings: their stored data stays unchanged', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets, raw: oldRepeatingSaving });
    await reopenApp(DEC_4);
    await press('My plan');

    let rows: any[] = [];
    await seedDevice(async (db) => {
      rows = await db.getAllAsync('SELECT kind, amount_cents, note, active, last_month, pocket_id FROM recurring');
    });
    expect(rows).toEqual([{ kind: 'savings', amount_cents: 30000, note: 'Plan', active: 1, last_month: '2026-11', pocket_id: 1 }]);
  });

  it('History kept: a saving recorded earlier by a repeat stays, with its repeat icon', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets, raw: oldRepeatingSaving });

    expect(screen.getByRole('button', { name: /^Plan, .*, recorded by a repeat$/ })).toBeOnTheScreen();
    await expectPocketBalance('Emergency', '300,00 €');
  });
});

/** The width of a goal bar's fill, as the percentage string it is styled with. */
const fillOf = (testID: string) => {
  const bar = screen.getByTestId(testID, { includeHiddenElements: true });
  const fill = (bar.children[0] as unknown as { props: { style: unknown } }).props.style;
  return (StyleSheet.flatten(fill as never) as { width: string }).width;
};

describe('Goal bar and summary on the Split screen', () => {
  it('Screen: the bar fills to what is typed over what is to split', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    expect(fillOf('split-bar')).toBe('0%');

    await type('Emergency amount', '100');
    expect(fillOf('split-bar')).toBe('25%');
    await type('Travel amount', '100');
    expect(fillOf('split-bar')).toBe('50%');
  });

  it('Screen: the bar is full at most when more than the goal is typed', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    await type('Emergency amount', '900');
    expect(fillOf('split-bar')).toBe('100%');
  });

  it('Screen: a "Pockets" title sits above the rows and "New pocket" is a button', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('Split savings');
    expect(screen.getByText('Pockets')).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'New pocket' })).toHaveLength(1);
  });
});

describe('No more repeating savings - Add from My plan', () => {
  it('Add from My plan: the entry form offers only Expense and Income', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets });
    await press('My plan');
    await press('Add a monthly entry');

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Expense' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Income' })).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Savings' })).not.toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Repeat every month' })).toBeOnTheScreen();
  });
});

describe('No more repeating savings - deleting a pocket with an old repeating saving', () => {
  const orphan = "INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month, pocket_id) VALUES (1, 'savings', 'other', 30000, 'Plan', 1, '2026-11', 1);";
  const recurringRows = async () => {
    let rows: any[] = [];
    await seedDevice(async (db) => {
      rows = await db.getAllAsync('SELECT id FROM recurring');
    });
    return rows;
  };

  it('Pocket delete: with no saving, expense or move, an old repeating saving no entry points to does not block deleting, and goes with the pocket', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Car' }], raw: [orphan] });
    await showPocket('Car');
    await press('Edit Car');
    await press('Delete pocket');
    await answerDialog('Delete');

    await expectNoPocket('Car');
    expect(await recurringRows()).toEqual([]);
  });

  it('Pocket delete: an old repeating saving that an entry points to still keeps the pocket', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      pockets: [{ name: 'Car' }],
      raw: [
        orphan,
        "INSERT INTO entry (date, kind, category, amount_cents, note, recurring_id, pocket_id) VALUES ('2026-11-02', 'savings', 'other', 30000, 'Plan', 1, 1);",
      ],
    });
    await showPocket('Car');
    await press('Edit Car');

    expect(screen.queryByRole('button', { name: 'Delete pocket' })).not.toBeOnTheScreen();
    expect(await recurringRows()).toHaveLength(1);
  });
});

async function expectNoPocket(name: string) {
  expect((await spaceRows()).some((row: string) => row.startsWith(`${name}, `))).toBe(false);
}
