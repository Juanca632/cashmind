import { screen } from 'expo-router/testing-library';
import type { TestInstance } from 'test-renderer';

import { LIGHT } from '@/shared/theme/theme';
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
const income = (cents: number) => ({ date: '2026-11-01', kind: 'income' as const, amountCents: cents, note: 'Pay' });

type Style = { boxShadow?: string };
const flatten = (style: unknown): Style[] =>
  Array.isArray(style) ? style.flatMap(flatten) : style && typeof style === 'object' ? [style as Style] : [];
const shadowOf = (el: TestInstance): string | undefined =>
  flatten(el.props.style).reduce<string | undefined>((acc, s) => s.boxShadow ?? acc, undefined);
/** The shadow of the element itself or, failing that, of the nearest ancestor carrying one. */
const shadowAround = (el: TestInstance): string | undefined => {
  for (let n: TestInstance | null = el; n; n = n.parent) {
    const s = shadowOf(n);
    if (s) return s;
  }
  return undefined;
};

describe('One rule for shadows', () => {
  it('Three levels: buttons and the Add / month / My plan pills are raised', async () => {
    await startApp({ today: TODAY, entries: spends(2) });
    for (const name of ['Add expense', 'My plan', /^Month: /]) {
      expect(shadowOf(screen.getByRole('button', { name }))).toBe(LIGHT.shadow.raised);
    }
  });

  it('Three levels: the month card pill "Add income" is flat', async () => {
    await startApp({ today: TODAY, entries: [] });
    expect(shadowOf(screen.getByRole('button', { name: 'Add income' }))).toBeUndefined();
  });

  it('Three levels: a full-width button (Back to current month) is raised', async () => {
    await startApp({ today: TODAY, entries: [{ ...income(100000), date: '2026-09-03' }, ...spends(2)] });
    await press(/^Month: /);
    await press('Sep');
    expect(shadowOf(screen.getByRole('button', { name: 'Back to current month' }))).toBe(LIGHT.shadow.raised);
  });

  it('Three levels: Activity filter pills are flat', async () => {
    await startApp({ today: TODAY, entries: spends(7) });
    await press('See all 7 entries');
    for (const name of ['All', 'Income', 'Spent', 'Savings']) {
      expect(shadowOf(screen.getByRole('button', { name }))).toBeUndefined();
    }
  });

  it('Three levels: category option pills in the form are flat', async () => {
    await startApp({ today: TODAY, entries: [] });
    await press('Add expense');
    for (const name of ['Housing', 'Groceries', 'Other']) {
      expect(shadowOf(screen.getByRole('radio', { name }))).toBeUndefined();
    }
  });

  it('Three levels: cards (the Activity list card) are flat', async () => {
    await startApp({ today: TODAY, entries: spends(8) });
    const link = screen.getByRole('button', { name: 'See all 8 entries' });
    expect(shadowOf(link.parent as TestInstance)).toBeUndefined();
  });

  it('Month card: casts the hero shadow while there is money left to spend', async () => {
    await startApp({ today: TODAY, entries: [income(200000), ...spends(1)] });
    expect(shadowAround(screen.getByText('Left to spend'))).toBe(LIGHT.shadow.hero);
  });

  it('Month card: casts the red shadow while the month is overspent (left to spend below 0)', async () => {
    await startApp({ today: TODAY, entries: [income(1000), { ...spends(1)[0], amountCents: 5000 }] });
    expect(shadowAround(screen.getByText('Left to spend'))).toBe(LIGHT.shadow.heroOverspent);
  });
});
