import { screen, testRouter, within } from 'expo-router/testing-library';

import type { EntryCategory } from '@/features/entries/categories';
import {
  DISCARD_DIALOG,
  answerDialog,
  choose,
  dumpDevice,
  exactText,
  expectDialog,
  expectNoDialog,
  press,
  startApp,
  startAppOnReleasedVersion,
  type,
} from '../test-support/app';
import { RELAX_TABLES } from '../test-support/damaged-data';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 12];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 500000, note: 'Pay' } as const;
const tile = (name: string) => within(screen.getByRole('button', { name }));
const radioNames = () => screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel as string);
/** Category options shown by the form: everything after the three kinds. */
const categoryOptions = () => radioNames().slice(3);
/** A line of the split on home, found by its accessibility label (amounts use a locale space). */
const splitLine = (label: string, amount: string, percent: number) =>
  screen.getByLabelText(new RegExp(`^${label}: ${amount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s\\u00a0\\u202f]')}[\\s\\u00a0\\u202f]?€?, ${percent}[\\s\\u00a0\\u202f]?%$`));
const splitLabels = () =>
  screen
    .queryAllByLabelText(/: .*, \d+\s?%$/)
    .map((n) => (n.props.accessibilityLabel as string).split(':')[0]);
const spent = (category: EntryCategory, amountCents: number, day = 5, note = '') =>
  ({ date: `2026-11-${String(day).padStart(2, '0')}`, kind: 'expense', amountCents, note, category }) as const;

describe('Choose a category when recording', () => {
  it('Categories of the kind: expense, income and savings each offer their own list with icons', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    expect(categoryOptions()).toEqual(['Housing', 'Groceries', 'Transport', 'Eating out', 'Leisure', 'Health', 'Subscriptions', 'Other']);

    await choose('Income');
    expect(categoryOptions()).toEqual(['Salary', 'Freelance', 'Benefits', 'Gifts', 'Other']);

    await choose('Savings');
    expect(categoryOptions()).toEqual(['Emergency fund', 'Investments', 'Travel', 'Goal', 'Other']);
    expect(screen.queryByRole('radio', { name: 'Groceries' })).not.toBeOnTheScreen();
  });

  it('Default: Other is selected on a new entry, and an entry can be saved without choosing', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');

    expect(screen.getByRole('radio', { name: 'Other' })).toBeSelected();
    expect(screen.getAllByRole('radio', { selected: true }).map((r) => r.props.accessibilityLabel).sort()).toEqual(['Expense', 'Other']);

    await type('Amount', '10');
    await press('Add expense');

    expect(screen).toHavePathname('/');
    const [rows] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(rows.at(-1)).toMatchObject({ kind: 'expense', amount_cents: 1000, category: 'other' });
  });

  it('Default: each kind opened from home starts on Other', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Savings');
    await press('Add to savings');

    expect(screen.getByRole('radio', { name: 'Savings', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Other' })).toBeSelected();
    expect(categoryOptions()).toEqual(['Emergency fund', 'Investments', 'Travel', 'Goal', 'Other']);
  });

  it('Saved: 45,20 € as an expense in Groceries shows Groceries selected when reopened', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await choose('Groceries');
    expect(screen.getByRole('radio', { name: 'Groceries' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Other' })).not.toBeSelected();
    await type('Amount', '45,20');
    await press('Add expense');

    expect(screen).toHavePathname('/');
    await press(/Groceries/);

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Groceries' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Other' })).not.toBeSelected();
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('45,20');
  });

  it('Saved: the category of income and savings is kept too', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await choose('Savings');
    await choose('Travel');
    await type('Amount', '70');
    await press('Add to savings');
    await press(/Travel/);

    expect(screen.getByRole('radio', { name: 'Savings' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Travel' })).toBeSelected();
  });

  it('Changing kind: expense with Groceries switched to income shows the income categories with Other selected', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');
    await choose('Groceries');

    await choose('Income');

    expect(categoryOptions()).toEqual(['Salary', 'Freelance', 'Benefits', 'Gifts', 'Other']);
    expect(screen.getByRole('radio', { name: 'Other' })).toBeSelected();
    expect(screen.getAllByRole('radio', { selected: true })).toHaveLength(2);

    await choose('Expense');
    expect(screen.getByRole('radio', { name: 'Other' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Groceries' })).not.toBeSelected();
  });

  it('Changing kind on an existing entry resets the category to Other', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('groceries', 3000, 5, 'Market')] });
    await press(/Market/);
    expect(screen.getByRole('radio', { name: 'Groceries' })).toBeSelected();

    await choose('Income');
    expect(screen.getByRole('radio', { name: 'Other' })).toBeSelected();
    await press('Save changes');

    const [rows] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(rows[1]).toMatchObject({ kind: 'income', category: 'other', note: 'Market' });
  });

  it('Editing: changing Other to Transport keeps the amount, date and note', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('other', 1250, 5, 'Bus pass')] });
    await press(/Bus pass/);
    expect(screen.getByRole('radio', { name: 'Other' })).toBeSelected();
    await choose('Transport');
    await press('Save changes');

    expect(screen).toHavePathname('/');
    const [rows] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(rows[1]).toMatchObject({ date: '2026-11-05', amount_cents: 1250, note: 'Bus pass', category: 'transport' });
    await press(/Bus pass/);
    expect(screen.getByRole('radio', { name: 'Transport' })).toBeSelected();
  });

  it('Unsaved change: leaving after only changing the category asks before discarding, and discarding keeps the old one', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('other', 1250, 5, 'Bus pass')] });
    await press(/Bus pass/);
    await choose('Transport');

    await testRouter.back();
    expectDialog(DISCARD_DIALOG);
    await answerDialog('Discard');

    expect(screen).toHavePathname('/');
    const [rows] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(rows[1]).toMatchObject({ category: 'other' });
  });

  it('Unsaved change: keeping the form open leaves the changed category selected', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('other', 1250, 5, 'Bus pass')] });
    await press(/Bus pass/);
    await choose('Transport');
    await testRouter.back();
    await answerDialog('Keep editing');

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Transport' })).toBeSelected();
  });

  it('No change: leaving an untouched form does not ask', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('groceries', 1250, 5, 'Market')] });
    await press(/Market/);
    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/');
  });

  it('Unsaved change: selecting the same category again is not a change', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('groceries', 1250, 5, 'Market')] });
    await press(/Market/);
    await choose('Groceries');
    await testRouter.back();

    expectNoDialog();
  });
});

describe('See a kind split by category', () => {
  const month = [
    salary,
    spent('groceries', 32000, 3),
    spent('housing', 65000, 2),
    spent('other', 23000, 4),
  ];

  it('Split: 320 Groceries, 650 Housing and 230 Other show Housing 54 %, Groceries 27 %, Other 19 %, largest first', async () => {
    await startApp({ today: TODAY, entries: month });
    await press('Spent');

    expect(screen.getByText('By category')).toBeOnTheScreen();
    expect(splitLine('Housing', '650,00', 54)).toBeOnTheScreen();
    expect(splitLine('Groceries', '320,00', 27)).toBeOnTheScreen();
    expect(splitLine('Other', '230,00', 19)).toBeOnTheScreen();
    expect(splitLabels()).toEqual(['Housing', 'Groceries', 'Other']);
  });

  it('Income and savings: 2.000 Salary and 300 Freelance give 87 % and 13 %; savings are split the same way', async () => {
    await startApp({
      today: TODAY,
      entries: [
        { date: '2026-11-01', kind: 'income', amountCents: 200000, note: '', category: 'salary' },
        { date: '2026-11-02', kind: 'income', amountCents: 30000, note: '', category: 'freelance' },
        { date: '2026-11-03', kind: 'savings', amountCents: 10000, note: '', category: 'goal' },
        { date: '2026-11-04', kind: 'savings', amountCents: 30000, note: '', category: 'travel' },
      ],
    });

    await press('Income');
    expect(splitLine('Salary', '2 000,00', 87)).toBeOnTheScreen();
    expect(splitLine('Freelance', '300,00', 13)).toBeOnTheScreen();
    expect(splitLabels()).toEqual(['Salary', 'Freelance']);

    await press('Savings');
    expect(splitLabels()).toEqual(['Travel', 'Goal']);
    expect(splitLine('Travel', '300,00', 75)).toBeOnTheScreen();
    expect(splitLine('Goal', '100,00', 25)).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Salary:/)).not.toBeOnTheScreen();
  });

  it('Only used categories: categories with no entries are not listed', async () => {
    await startApp({ today: TODAY, entries: month });
    await press('Spent');

    expect(splitLabels()).toHaveLength(3);
    expect(screen.queryByLabelText(/^Transport:/)).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Health:/)).not.toBeOnTheScreen();
  });

  it('One category: every expense in Groceries shows only Groceries 100 %', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('groceries', 1000, 2), spent('groceries', 2500, 3)] });
    await press('Spent');

    expect(splitLabels()).toEqual(['Groceries']);
    expect(splitLine('Groceries', '35,00', 100)).toBeOnTheScreen();
  });

  it('Same amount: categories follow the list order', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('other', 1000, 2), spent('health', 1000, 3), spent('housing', 1000, 4)] });
    await press('Spent');

    expect(splitLabels()).toEqual(['Housing', 'Health', 'Other']);
  });

  it('Percentages are rounded to the nearest whole number, half up', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('housing', 700, 2), spent('other', 100, 3)] });
    await press('Spent');

    expect(splitLine('Housing', '7,00', 88)).toBeOnTheScreen();
    expect(splitLine('Other', '1,00', 13)).toBeOnTheScreen();
  });

  it('Many categories: all eight used expense categories are listed', async () => {
    const cats: EntryCategory[] = ['housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'];
    await startApp({ today: TODAY, entries: [salary, ...cats.map((c, i) => spent(c, (8 - i) * 100, i + 1))] });
    await press('Spent');

    expect(splitLabels()).toEqual(['Housing', 'Groceries', 'Transport', 'Eating out', 'Leisure', 'Health', 'Subscriptions', 'Other']);
  });

  it('No tile selected: home shows no split, and tapping the selected tile again removes it', async () => {
    await startApp({ today: TODAY, entries: month });
    expect(screen.queryByText('By category')).not.toBeOnTheScreen();
    expect(splitLabels()).toEqual([]);

    await press('Spent');
    expect(screen.getByText('By category')).toBeOnTheScreen();
    await press('Spent');

    expect(screen.queryByText('By category')).not.toBeOnTheScreen();
    expect(splitLabels()).toEqual([]);
  });

  it('A selected kind without entries shows no split', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Spent');

    expect(screen.queryByText('By category')).not.toBeOnTheScreen();
  });

  it('The split only counts the selected kind', async () => {
    await startApp({
      today: TODAY,
      entries: [{ ...salary, category: 'salary' }, spent('groceries', 1000, 2), { date: '2026-11-03', kind: 'savings', amountCents: 500, note: '', category: 'goal' }],
    });
    await press('Spent');

    expect(splitLabels()).toEqual(['Groceries']);
    expect(splitLine('Groceries', '10,00', 100)).toBeOnTheScreen();
  });

  it('Follows changes: moving an expense from Other to Health shows in the split when coming back to home', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('housing', 65000, 2), spent('other', 23000, 4, 'Pharmacy')] });
    await press('Spent');
    expect(splitLabels()).toEqual(['Housing', 'Other']);

    await press(/Pharmacy/);
    await choose('Health');
    await press('Save changes');

    expect(screen).toHavePathname('/');
    expect(screen.getByText('By category')).toBeOnTheScreen();
    expect(splitLabels()).toEqual(['Housing', 'Health']);
    expect(screen.queryByLabelText(/^Other:/)).not.toBeOnTheScreen();
  });

  it('Follows changes: a new expense recorded with the tile selected joins the split', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('housing', 10000, 2)] });
    await press('Spent');
    await press('Add expense');
    await choose('Health');
    await type('Amount', '100');
    await press('Add expense');

    expect(splitLine('Housing', '100,00', 50)).toBeOnTheScreen();
    expect(splitLine('Health', '100,00', 50)).toBeOnTheScreen();
  });

  it('Past months: the split works the same in a past month', async () => {
    await startApp({
      today: TODAY,
      entries: [
        { date: '2026-10-01', kind: 'income', amountCents: 300000, note: '', category: 'other' },
        { date: '2026-10-10', kind: 'expense', amountCents: 8000, note: '', category: 'transport' },
        { date: '2026-10-11', kind: 'expense', amountCents: 2000, note: '', category: 'leisure' },
      ],
    });
    await press(/^Month:/);
    await press('Oct');
    await press('Spent');

    expect(splitLine('Transport', '80,00', 80)).toBeOnTheScreen();
    expect(splitLine('Leisure', '20,00', 20)).toBeOnTheScreen();
  });
});

describe('Category in the lists', () => {
  it('No note: a Groceries expense reads "Groceries" and an Other expense reads "Expense"', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('groceries', 4520, 3), spent('other', 1000, 4)] });

    expect(screen.getByRole('button', { name: /Groceries/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Expense/ })).toBeOnTheScreen();
    expect(screen.queryByText('Groceries')).toBeOnTheScreen();
    expect(screen.queryByText('Expense')).toBeOnTheScreen();
  });

  it('No note: income and savings rows read their category, or their kind for Other', async () => {
    await startApp({
      today: TODAY,
      entries: [
        { date: '2026-11-01', kind: 'income', amountCents: 100000, note: '', category: 'freelance' },
        { date: '2026-11-02', kind: 'income', amountCents: 100000, note: '', category: 'other' },
        { date: '2026-11-03', kind: 'savings', amountCents: 5000, note: '', category: 'emergency_fund' },
        { date: '2026-11-04', kind: 'savings', amountCents: 5000, note: '', category: 'other' },
      ],
    });

    expect(screen.getByText('Freelance')).toBeOnTheScreen();
    expect(screen.getByText('Emergency fund')).toBeOnTheScreen();
    // "Income" and "Savings" are also the names of the tiles: one match for the tile, one for the row.
    expect(screen.getAllByText('Income')).toHaveLength(2);
    expect(screen.getAllByText('Savings')).toHaveLength(2);
  });

  it('With a note: a Groceries expense with the note "Market" reads "Market"', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('groceries', 4520, 3, 'Market')] });

    expect(screen.getByText('Market')).toBeOnTheScreen();
    expect(screen.queryByText('Groceries')).not.toBeOnTheScreen();
  });

  it('Row title and icon on the Activity screen: the same titles as home', async () => {
    await startApp({
      today: TODAY,
      entries: [
        salary,
        spent('groceries', 1000, 2),
        spent('other', 1000, 3),
        spent('health', 1000, 4, 'Dentist'),
        spent('transport', 1000, 5),
        spent('leisure', 1000, 6),
        spent('housing', 1000, 7),
      ],
    });
    await press(/^See all \d+ entries$/);

    expect(screen).toHavePathname('/activity');
    expect(screen.getByText('Groceries')).toBeOnTheScreen();
    expect(screen.getByText('Expense')).toBeOnTheScreen();
    expect(screen.getByText('Dentist')).toBeOnTheScreen();
    expect(screen.queryByText('Health')).not.toBeOnTheScreen();
    expect(screen.getByText('Transport')).toBeOnTheScreen();
    expect(screen.getByText('Pay')).toBeOnTheScreen();
  });

  it('Rows still work: tapping a row opens it to edit with its category', async () => {
    await startApp({ today: TODAY, entries: [salary, spent('health', 1000, 4)] });
    await press(/Health/);

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Health' })).toBeSelected();
  });
});

describe('Existing entries are kept', () => {
  it('Update: entries recorded with the previous version keep kind, amount, date and note and are in Other', async () => {
    await startAppOnReleasedVersion(
      TODAY,
      5,
      `
      INSERT INTO plan_version VALUES ('2026-07', 20);
      INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-01', 'income', 200000, 'Pay');
      INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-03', 'expense', 1250, 'Cinema');
      INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-04', 'expense', 900, '');
      INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-05', 'savings', 5000, '');
      `,
    );

    expect(screen.getByText('Pay')).toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    expect(screen.getByText('Expense')).toBeOnTheScreen();
    expect(screen.getAllByText('Savings')).toHaveLength(2); // the tile and the row
    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('21,50 €'))).toBeOnTheScreen();

    await press('Spent');
    expect(splitLabels()).toEqual(['Other']);
    expect(splitLine('Other', '21,50', 100)).toBeOnTheScreen();

    await press(/Cinema/);
    expect(screen.getByRole('radio', { name: 'Other' })).toBeSelected();
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('12,50');

    const [rows] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(rows).toEqual([
      expect.objectContaining({ date: '2026-11-01', kind: 'income', amount_cents: 200000, note: 'Pay', category: 'other' }),
      expect.objectContaining({ date: '2026-11-03', kind: 'expense', amount_cents: 1250, note: 'Cinema', category: 'other' }),
      expect.objectContaining({ date: '2026-11-04', kind: 'expense', amount_cents: 900, note: '', category: 'other' }),
      expect.objectContaining({ date: '2026-11-05', kind: 'savings', amount_cents: 5000, note: '', category: 'other' }),
    ]);
  });

  it('Repeat income: the income recorded by "Repeat last income" is in Other', async () => {
    await startApp({
      today: [2026, 11, 2],
      entries: [{ date: '2026-11-01', kind: 'income', amountCents: 150000, note: 'Pay', category: 'salary' }],
    });
    await press('Repeat last income');

    const [rows] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(rows.at(-1)).toMatchObject({ kind: 'income', amount_cents: 150000, note: 'Monthly income', category: 'other' });
    expect(screen.getByText('Monthly income')).toBeOnTheScreen();

    await press('Income');
    expect(splitLabels()).toEqual(['Other']);
    expect(splitLine('Other', '1 500,00', 100)).toBeOnTheScreen();
  });
});

describe('Unreadable category', () => {
  const UNREADABLE = /some of your data could not be read/i;
  const bad = (kind: string, category: string) => [
    ...RELAX_TABLES,
    `INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-06', '${kind}', 500, 'Broken', '${category}')`,
  ];

  it.each([
    ['an unknown category', 'expense', 'pets'],
    ['a category of another kind', 'expense', 'salary'],
    ['an income entry with an expense category', 'income', 'groceries'],
    ['a savings entry with a label instead of a key', 'savings', 'Goal'],
  ])('Stored entry with %s: home says data could not be read and the row stays as it was', async (_label, kind, category) => {
    await startApp({ today: TODAY, entries: [salary], raw: bad(kind, category) });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByText('Left to spend')).not.toBeOnTheScreen();
    expect(screen.queryByText('Broken')).not.toBeOnTheScreen();
    expect(screen.queryByText('By category')).not.toBeOnTheScreen();
    const [rows] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ kind, amount_cents: 500, note: 'Broken', category });
  });

  it('An earlier month with an unreadable income category: a month without income says data could not be read and changes nothing', async () => {
    await startApp({
      today: [2026, 11, 2],
      raw: [
        ...RELAX_TABLES,
        "INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-01', 'income', 150000, 'Pay', 'groceries')",
      ],
    });

    expect(screen.getByText(UNREADABLE)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Repeat last income' })).not.toBeOnTheScreen();
    const [rows] = (await dumpDevice()) as [Record<string, unknown>[]];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ category: 'groceries', note: 'Pay' });
  });
});
