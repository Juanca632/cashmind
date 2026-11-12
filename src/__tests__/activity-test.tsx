import { act, screen, testRouter, within } from 'expo-router/testing-library';

import { dumpDevice, headerTitles, expectLeftToSpend, answerDialog, exactText, press, startApp, type } from '../test-support/app';
import { RELAX_TABLES } from '../test-support/damaged-data';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 12];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Salary' } as const;
const expense = (day: number, note: string, amountCents = 1000) =>
  ({ date: `2026-11-${String(day).padStart(2, '0')}`, kind: 'expense', amountCents, note }) as const;
/** n expenses "Spend 01".."Spend nn" on days 1..n; the highest day is the newest. */
const spends = (n: number) => Array.from({ length: n }, (_, i) => expense(i + 1, `Spend ${String(i + 1).padStart(2, '0')}`));
const seeAll = (n: number) => screen.queryByRole('button', { name: `See all ${n} entries` });
const seeAllAny = () => screen.queryByRole('button', { name: /^See all \d+ entries$/ });
const has = (note: string) => screen.queryByText(note) !== null;

describe('Home stays short', () => {
  it('Five newest: 12 entries list only the 5 newest and "See all (12)"', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(11)] });

    for (const n of ['11', '10', '09', '08', '07']) expect(has(`Spend ${n}`)).toBe(true);
    for (const n of ['06', '05', '01']) expect(has(`Spend ${n}`)).toBe(false);
    expect(has('Salary')).toBe(false);
    expect(seeAll(12)).toBeOnTheScreen();
    expect(screen.getByText('See all (12)')).toBeOnTheScreen();
  });

  it('Few entries: 5 entries list all and show no link', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(4)] });

    for (const n of ['01', '02', '03', '04']) expect(has(`Spend ${n}`)).toBe(true);
    expect(has('Salary')).toBe(true);
    expect(seeAllAny()).not.toBeOnTheScreen();
  });

  it('Few entries: 6 entries show the link with 6', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(5)] });
    expect(seeAll(6)).toBeOnTheScreen();
  });

  it('Filtered: 8 expenses with Spent selected list the 5 newest expenses and "See all (8)"', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(8)] });
    await press('Spent');

    for (const n of ['08', '07', '06', '05', '04']) expect(has(`Spend ${n}`)).toBe(true);
    expect(has('Spend 03')).toBe(false);
    expect(seeAll(8)).toBeOnTheScreen();
  });

  it('Filtered: 3 savings with Savings selected list the 3 and no link', async () => {
    const savings = [1, 2, 3].map((d) => ({ date: `2026-11-0${d}`, kind: 'savings', amountCents: 500, note: `Save ${d}` }) as const);
    await startApp({ today: TODAY, entries: [salary, ...spends(6), ...savings] });
    expect(seeAll(10)).toBeOnTheScreen();
    await press('Savings');

    for (const d of [1, 2, 3]) expect(has(`Save ${d}`)).toBe(true);
    expect(seeAllAny()).not.toBeOnTheScreen();
  });

  it('New entry: adding one dated today puts it on top, drops the oldest of the 5 and raises the count', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(5)] });
    expect(seeAll(6)).toBeOnTheScreen();
    // Salary and Spend 01 share a day; the later recorded one is newer, so Salary is the one left out.
    expect(has('Salary')).toBe(false);
    expect(has('Spend 01')).toBe(true);

    await press('Add expense');
    await type('Amount', '3');
    await type('Note (optional)', 'Brand new');
    await press('Add expense');

    expect(screen).toHavePathname('/');
    expect(has('Brand new')).toBe(true);
    expect(has('Spend 01')).toBe(false);
    expect(has('Spend 02')).toBe(true);
    expect(seeAll(7)).toBeOnTheScreen();
  });
});

describe('See the whole month', () => {
  it('Open: See all opens "Activity · November 2026" listing all 30 entries, newest first', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(29)] });
    expect(seeAll(30)).toBeOnTheScreen();
    await press('See all 30 entries');

    expect(screen).toHavePathname('/activity');
    expect(screen).toHaveSearchParams({ month: '2026-11' });
    expect(headerTitles()).toContain('Activity · November 2026');
    // The list is virtualized (FR-006), so only the first rows are rendered: the newest ones come first.
    expect(has('Spend 29')).toBe(true);
    expect(has('Spend 28')).toBe(true);
    // Day names like home
    expect(screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+ Nov$/).length).toBeGreaterThan(0);
    // Newest first
    const notes = screen.getAllByText(/^Spend \d\d$/).map((n) => n.props.children);
    const sorted = [...notes].sort().reverse();
    expect(notes).toEqual(sorted);
    expect(notes[0]).toBe('Spend 29');
    expect(notes.length).toBeGreaterThan(5);
  });

  it('Edit from Activity: tapping opens the form; saving returns to Activity with the change', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(8)] });
    await press('See all 9 entries');
    await press(/Spend 01/);
    expect(screen).toHavePathname('/entry');
    await type('Amount', '15,00');
    await press('Save changes');

    expect(screen).toHavePathname('/activity');
    expect(headerTitles()).toContain('Activity · November 2026');
    expect(screen.getByText(exactText('15,00 €'))).toBeOnTheScreen();
  });

  it('Edit from Activity: deleting returns to Activity without the entry', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(8)] });
    await press('See all 9 entries');
    await press(/Spend 01/);
    await press('Delete');
    await answerDialog('Delete');

    expect(screen).toHavePathname('/activity');
    expect(has('Spend 01')).toBe(false);
    expect(has('Spend 02')).toBe(true);
  });

  it('Back: home shows the same month with figures that include the changes', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(8)] });
    await press('See all 9 entries');
    await press(/Spend 01/);
    await press('Delete');
    await answerDialog('Delete');
    await act(async () => {
      testRouter.back();
    });

    expect(screen).toHavePathname('/');
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    // 2000 - 20% default goal (400) - 7 * 10 spent
    await expectLeftToSpend('1 530,00 €');
    expect(seeAll(8)).toBeOnTheScreen();
  });

  it('Past month: See all on a past month lists that month entries', async () => {
    const october = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, '0')}`,
      kind: 'expense',
      amountCents: 500,
      note: `Oct ${i + 1}`,
    }) as const);
    await startApp({
      today: TODAY,
      entries: [{ date: '2026-10-01', kind: 'income', amountCents: 100000, note: 'Oct pay' }, ...october, ...spends(2)],
    });
    await press(/^Month:/);
    await press('Oct');
    expect(seeAll(8)).toBeOnTheScreen();
    await press('See all 8 entries');

    expect(screen).toHavePathname('/activity');
    expect(screen).toHaveSearchParams({ month: '2026-10' });
    expect(headerTitles()).toContain('Activity · October 2026');
    expect(has('Oct 1')).toBe(true);
    expect(has('Oct pay')).toBe(true);
    expect(has('Spend 01')).toBe(false);
  });

  it('All entries deleted from Activity: the screen stays open with the empty text', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(5)] });
    await press('See all 6 entries');
    for (const note of ['Spend 01', 'Spend 02', 'Spend 03', 'Spend 04', 'Spend 05', 'Salary']) {
      await press(new RegExp(note));
      await press('Delete');
      await answerDialog('Delete');
    }

    expect(screen).toHavePathname('/activity');
    expect(screen.getByText('Nothing was recorded this month.')).toBeOnTheScreen();
  });

  it('Month without income: no tiles on home, See all still works with the four filters', async () => {
    await startApp({ today: TODAY, entries: spends(7) });
    expect(screen.queryByRole('button', { name: 'Spent' })).not.toBeOnTheScreen();
    await press('See all 7 entries');

    expect(screen).toHavePathname('/activity');
    for (const name of ['All', 'Income', 'Spent', 'Savings']) expect(screen.getByRole('button', { name })).toBeOnTheScreen();
    expect(has('Spend 01')).toBe(true);
  });
});

describe('Filter by kind on the Activity screen', () => {
  const mixed = [
    salary,
    ...spends(6),
    { date: '2026-11-02', kind: 'savings', amountCents: 5000, note: 'Piggy' },
  ] as const;

  it('Starts on the home filter: Spent selected on home opens Activity on Spent with only expenses', async () => {
    await startApp({ today: TODAY, entries: [...mixed] });
    await press('Spent');
    await press('See all 6 entries');

    expect(screen).toHavePathname('/activity');
    expect(screen).toHaveSearchParams({ month: '2026-11', kind: 'expense' });
    expect(screen.getByRole('button', { name: 'Spent' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'All' })).not.toBeSelected();
    expect(has('Spend 01')).toBe(true);
    expect(has('Salary')).toBe(false);
    expect(has('Piggy')).toBe(false);
  });

  it('Starts on the home filter: with no tile selected it opens on All', async () => {
    await startApp({ today: TODAY, entries: [...mixed] });
    await press('See all 8 entries');

    expect(screen.getByRole('button', { name: 'All' })).toBeSelected();
    expect(has('Salary')).toBe(true);
    expect(has('Piggy')).toBe(true);
  });

  it('Switch filter: All, Income, Spent and Savings show only those entries', async () => {
    await startApp({ today: TODAY, entries: [...mixed] });
    await press('See all 8 entries');

    await press('Income');
    expect(screen.getByRole('button', { name: 'Income' })).toBeSelected();
    expect(has('Salary')).toBe(true);
    expect(has('Piggy')).toBe(false);
    expect(has('Spend 01')).toBe(false);

    await press('Savings');
    expect(screen.getByRole('button', { name: 'Savings' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Income' })).not.toBeSelected();
    expect(has('Piggy')).toBe(true);
    expect(has('Salary')).toBe(false);

    await press('Spent');
    expect(has('Spend 01')).toBe(true);
    expect(has('Spend 06')).toBe(true);
    expect(has('Piggy')).toBe(false);

    await press('All');
    for (const note of ['Salary', 'Piggy', 'Spend 01', 'Spend 06']) expect(has(note)).toBe(true);
  });

  it('Empty filter: no savings says "No savings this month."', async () => {
    await startApp({ today: TODAY, entries: [salary, ...spends(6)] });
    await press('See all 7 entries');

    await press('Savings');
    expect(screen.getByText('No savings this month.')).toBeOnTheScreen();
    await press('Income');
    expect(has('Salary')).toBe(true);
  });

  it.each([
    ['Income', 'No income this month.'],
    ['Spent', 'No expenses this month.'],
  ])('Empty filter: %s with none says "%s"', async (name, text) => {
    await startApp({ today: TODAY, entries: spends(6).map((e, i) => (i === 0 ? { ...e, kind: 'savings' as const } : e)) });
    // month has no income and no ... expenses only when all removed; use a fresh month instead
    await testRouter.push(name === 'Income' ? '/activity?month=2026-11' : '/activity?month=2026-10');
    await press(name);
    expect(screen.getByText(text)).toBeOnTheScreen();
  });

  it('Empty filter: All on an empty month says "Nothing was recorded this month."', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await testRouter.push('/activity?month=2026-10');
    expect(screen.getByText('Nothing was recorded this month.')).toBeOnTheScreen();
  });

  it('Home unchanged: changing the filter on Activity and going back keeps the home tile', async () => {
    await startApp({ today: TODAY, entries: [...mixed] });
    await press('Spent');
    await press('See all 6 entries');
    await press('Savings');
    await act(async () => {
      testRouter.back();
    });

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Show all' })).toBeOnTheScreen();
    expect(has('Spend 06')).toBe(true);
    expect(has('Piggy')).toBe(false);
    expect(seeAll(6)).toBeOnTheScreen();
  });
});

describe('Activity route params', () => {
  const entries = [salary, ...spends(6), { date: '2026-11-02', kind: 'savings', amountCents: 5000, note: 'Piggy' }] as const;

  it('Invalid month falls back to the current month', async () => {
    await startApp({ today: TODAY, entries: [...entries] });
    await testRouter.push('/activity?month=banana');

    expect(headerTitles()).toContain('Activity · November 2026');
    expect(has('Spend 01')).toBe(true);
  });

  it('Future month falls back to the current month', async () => {
    await startApp({ today: TODAY, entries: [...entries] });
    await testRouter.push('/activity?month=2027-03');

    expect(headerTitles()).toContain('Activity · November 2026');
    expect(has('Spend 01')).toBe(true);
  });

  it('Missing month falls back to the current month', async () => {
    await startApp({ today: TODAY, entries: [...entries] });
    await testRouter.push('/activity');

    expect(headerTitles()).toContain('Activity · November 2026');
  });

  it('Invalid kind falls back to All', async () => {
    await startApp({ today: TODAY, entries: [...entries] });
    await testRouter.push('/activity?month=2026-11&kind=leisure');

    expect(screen.getByRole('button', { name: 'All' })).toBeSelected();
    expect(has('Salary')).toBe(true);
    expect(has('Piggy')).toBe(true);
  });

  it('Valid kind preselects its filter', async () => {
    await startApp({ today: TODAY, entries: [...entries] });
    await testRouter.push('/activity?month=2026-11&kind=savings');

    expect(screen.getByRole('button', { name: 'Savings' })).toBeSelected();
    expect(has('Piggy')).toBe(true);
    expect(has('Salary')).toBe(false);
  });
});

describe('Unreadable data', () => {
  it('Activity shows the "some data could not be read" screen and changes nothing', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      raw: [...RELAX_TABLES, "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-06', 'expense', 12.5, 'Broken')"],
    });
    const before = await dumpDevice();
    await testRouter.push('/activity?month=2026-11');

    expect(screen).toHavePathname('/activity');
    expect(screen.getByText(/some of your data could not be read/i)).toBeOnTheScreen();
    expect(has('Broken')).toBe(false);
    expect(has('Salary')).toBe(false);
    expect(await dumpDevice()).toEqual(before);
  });
});

// keep `within` referenced for row queries in future journeys
void within;
