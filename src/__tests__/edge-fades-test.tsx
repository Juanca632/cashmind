import * as ReactNative from 'react-native';
import { StyleSheet } from 'react-native';
import { screen } from 'expo-router/testing-library';
import type { TestInstance } from 'test-renderer';

import { DARK, LIGHT, type Theme } from '@/shared/theme/theme';
import { press, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

let mockInsets = { top: 24, bottom: 48, left: 0, right: 0 };
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context/jest/mock').default,
  useSafeAreaInsets: () => mockInsets,
}));

beforeEach(() => {
  mockInsets = { top: 24, bottom: 48, left: 0, right: 0 };
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 12];
const entries = [
  { date: '2026-11-01', kind: 'income' as const, amountCents: 100000, note: 'Pay' },
  ...Array.from({ length: 7 }, (_, i) => ({
    date: `2026-11-0${i + 2}`,
    kind: 'expense' as const,
    amountCents: 1000,
    note: `Spend ${i + 1}`,
  })),
];

type Fade = { direction: 'top' | 'bottom'; height: number; color: string; pointerEvents: unknown };

/** The edge fades on the screen: the non-interactive vertical gradients, as the user sees them. */
function fades(): Fade[] {
  // The stack keeps earlier screens mounted underneath: look only at the one on top.
  const stacked = screen.container.queryAll((n: TestInstance) => (n.type as unknown) === 'RNSScreen');
  const visible = stacked[stacked.length - 1] ?? screen.container;
  return visible
    .queryAll((n: TestInstance) => n.props?.pointerEvents === 'none')
    .flatMap((n) => {
      const s = StyleSheet.flatten(n.props.style) as { height?: number; experimental_backgroundImage?: string };
      const m = /^linear-gradient\(to (top|bottom), (#[0-9A-Fa-f]{6}),/.exec(s.experimental_backgroundImage ?? '');
      if (!m) return [];
      return [{ direction: m[1] === 'top' ? ('bottom' as const) : ('top' as const), height: s.height ?? NaN, color: m[2], pointerEvents: n.props.pointerEvents }];
    });
}
// "to top" gradients are drawn over the navigation bar (bottom edge); "to bottom" over the status bar.
const bottomFades = () => fades().filter((f) => f.direction === 'bottom');
const topFades = () => fades().filter((f) => f.direction === 'top');

const SCREENS: [string, () => Promise<void>, boolean][] = [
  ['Home', async () => {}, true],
  ['Activity', async () => press('See all 8 entries'), false],
  ['My plan', async () => press('My plan'), false],
  ['Entry form', async () => press('Add expense'), false],
];

describe('Content fades before the system bars', () => {
  it.each(SCREENS)('Bottom: %s fades into the background over the navigation bar, as tall as the bar', async (_n, go) => {
    await startApp({ today: TODAY, entries });
    await go();
    const bottom = bottomFades();
    expect(bottom).toHaveLength(1);
    expect(bottom[0].height).toBe(48);
    expect(bottom[0].color.toLowerCase()).toBe(LIGHT.background.toLowerCase());
  });

  it('Top: home fades over the status bar, as tall as the bar', async () => {
    await startApp({ today: TODAY, entries });
    const top = topFades();
    expect(top).toHaveLength(1);
    expect(top[0].height).toBe(24);
    expect(top[0].color.toLowerCase()).toBe(LIGHT.background.toLowerCase());
  });

  it.each(SCREENS.filter(([, , home]) => !home))('Top: %s has a header and needs no top fade', async (_n, go) => {
    await startApp({ today: TODAY, entries });
    await go();
    expect(topFades()).toHaveLength(0);
  });

  it('Bar sizes: the fades follow the inset of the phone, not a fixed height', async () => {
    mockInsets = { top: 31, bottom: 17, left: 0, right: 0 };
    await startApp({ today: TODAY, entries });
    expect(topFades()[0].height).toBe(31);
    expect(bottomFades()[0].height).toBe(17);
  });

  it('Themes: dark phone fades into the dark background', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    await startApp({ today: TODAY, entries });
    for (const f of [...topFades(), ...bottomFades()]) expect(f.color.toLowerCase()).toBe(DARK.background.toLowerCase());
    expect(topFades()).toHaveLength(1);
    expect(bottomFades()).toHaveLength(1);
  });

  it('Touch: the fades never block a tap on what is under them', async () => {
    await startApp({ today: TODAY, entries });
    const all = fades();
    expect(all).toHaveLength(2);
    for (const f of all) expect(f.pointerEvents).toBe('none');
  });

  it('Touch: content is still pressable with the fades on screen', async () => {
    await startApp({ today: TODAY, entries });
    await press('My plan');
    expect(screen).toHavePathname('/plan');
  });

  it('No fade is drawn when an inset is 0', async () => {
    mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
    await startApp({ today: TODAY, entries });
    expect(fades()).toHaveLength(0);
  });

  it('No fade is drawn when only the top inset is 0', async () => {
    mockInsets = { top: 0, bottom: 48, left: 0, right: 0 };
    await startApp({ today: TODAY, entries });
    expect(topFades()).toHaveLength(0);
    expect(bottomFades()).toHaveLength(1);
  });
});

type Style = { boxShadow?: string };
const flatten = (style: unknown): Style[] =>
  Array.isArray(style) ? style.flatMap(flatten) : style && typeof style === 'object' ? [style as Style] : [];
const shadowOf = (el: TestInstance): string | undefined =>
  flatten(el.props.style).reduce<string | undefined>((acc, s) => s.boxShadow ?? acc, undefined);

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
] as [string, Theme][])('One rule for shadows: tiles and month card pills (%s)', (scheme, theme) => {
  beforeEach(() => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme as 'light' | 'dark');
  });

  it('Three levels: the kind tiles on home (Income, Spent, Savings) are raised', async () => {
    await startApp({ today: TODAY, entries });
    for (const name of ['Income', 'Spent', 'Savings']) {
      expect(shadowOf(screen.getByRole('button', { name }))).toBe(theme.shadow.raised);
    }
  });

  it('Three levels: the month card pills (Add income, Repeat last income) stay flat', async () => {
    await startApp({ today: TODAY, entries: [{ ...entries[0], date: '2026-09-03' }] });
    await press(/^Month: /);
    await press('Oct');
    for (const name of ['Add income', 'Repeat last income']) {
      expect(shadowOf(screen.getByRole('button', { name }))).toBeUndefined();
    }
  });
});
