import { screen, within } from 'expo-router/testing-library';
import type { TestInstance } from 'test-renderer';

import { Size } from '@/shared/theme/theme';
import { press, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 12];
const spends = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    date: `2026-11-${String(i + 1).padStart(2, '0')}`,
    kind: 'expense' as const,
    amountCents: 1000,
    note: `Spend ${String(i + 1).padStart(2, '0')}`,
  }));

type Style = { minHeight?: number };
const flatten = (style: unknown): Style[] =>
  Array.isArray(style) ? style.flatMap(flatten) : style && typeof style === 'object' ? [style as Style] : [];
const visibleHeight = (el: TestInstance) =>
  Math.max(0, ...flatten(el.props.style).map((s) => s.minHeight ?? 0));
const slop = (el: TestInstance) => {
  const h = el.props.hitSlop;
  if (typeof h === 'number') return h;
  return Math.min(h?.top ?? 0, h?.bottom ?? 0);
};
/** Visible height plus the hit slop on both sides: the vertical touch area. */
const touchHeight = (el: TestInstance) => visibleHeight(el) + 2 * slop(el);
const expectPill = (el: TestInstance) => {
  expect(visibleHeight(el)).toBe(Size.pill);
  expect(touchHeight(el)).toBeGreaterThanOrEqual(Size.control);
};

describe('One look for each kind of control', () => {
  it('Compact but easy to tap: home pills are 36 high visibly and reach 48 to the touch', async () => {
    await startApp({ today: TODAY, entries: spends(2) });
    for (const name of ['Add expense', 'Add income', 'My plan', /^Month: /]) {
      expectPill(screen.getByRole('button', { name }));
    }
  });

  it('Compact but easy to tap: Activity filters reach 48 to the touch', async () => {
    await startApp({ today: TODAY, entries: spends(7) });
    await press('See all 7 entries');
    for (const name of ['All', 'Income', 'Spent', 'Savings']) {
      expectPill(screen.getByRole('button', { name }));
    }
  });

  it('Compact but easy to tap: category options in the form reach 48 to the touch', async () => {
    await startApp({ today: TODAY, entries: [] });
    await press('Add expense');
    for (const name of ['Housing', 'Groceries', 'Other']) {
      expectPill(screen.getByRole('radio', { name }));
    }
  });
});

describe("Home's bottom actions fit the layout", () => {
  it('See all: with more than 5 entries "See all (N)" is the last child inside the Activity card, after the rows, and opens Activity', async () => {
    await startApp({ today: TODAY, entries: spends(8) });
    const link = screen.getByRole('button', { name: 'See all 8 entries' });
    expect(within(link).getByText('See all (8)')).toBeOnTheScreen();

    const card = link.parent as TestInstance;
    // The card that holds the link also holds the list rows.
    expect(within(card).getByText('Spend 08')).toBeOnTheScreen();
    expect(within(card).getByText('Spend 04')).toBeOnTheScreen();
    // The link comes after the rows.
    const kids = card.children.filter((c) => typeof c !== 'string') as TestInstance[];
    expect(kids[kids.length - 1]).toBe(link);
    expect(kids.length).toBeGreaterThan(1);

    await press('See all 8 entries');
    expect(screen).toHavePathname('/activity');
  });

  it('See all: with 5 entries there is no link', async () => {
    await startApp({ today: TODAY, entries: spends(5) });
    expect(screen.queryByRole('button', { name: /^See all/ })).not.toBeOnTheScreen();
  });

  it('Back to current month: on a past month the button returns to November 2026', async () => {
    await startApp({
      today: TODAY,
      entries: [{ date: '2026-09-03', kind: 'income', amountCents: 200000, note: 'Pay' }, ...spends(7)],
    });
    await press(/^Month: /);
    await press('Sep');
    const back = screen.getByRole('button', { name: 'Back to current month' });
    expect(within(back).getByText('Back to current month')).toBeOnTheScreen();

    await press('Back to current month');

    expect(screen.queryByRole('button', { name: 'Back to current month' })).not.toBeOnTheScreen();
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
  });
});
