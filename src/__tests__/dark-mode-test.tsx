import * as ReactNative from 'react-native';
import { StyleSheet } from 'react-native';
import { screen } from 'expo-router/testing-library';

import { DARK, LIGHT } from '@/shared/theme/theme';

import { press, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const styleOf = (node: unknown) =>
  StyleSheet.flatten((node as { props: { style: never } }).props.style) as { color?: string; backgroundColor?: string };

/** The background color of the closest ancestor that sets one: what the user sees behind the node. */
function backgroundBehind(node: { parent: unknown; props?: unknown } | null): string | undefined {
  for (let n: any = node; n; n = n.parent) {
    const bg = n.props?.style ? styleOf(n).backgroundColor : undefined;
    if (bg) return bg;
  }
}

const entries = [{ date: '2026-11-01', kind: 'income', amountCents: 100000, note: 'Salary' }] as const;

describe.each([
  ['dark', DARK],
  ['light', LIGHT],
] as const)('The app follows the phone\'s theme (%s phone)', (scheme, theme) => {
  beforeEach(() => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);
  });

  it('Home: text, income color and background come from the theme', async () => {
    await startApp({ today: [2026, 10, 7], entries: [...entries] });

    const plan = screen.getByText('My plan');
    expect(styleOf(plan).color).toBe(theme.text);
    expect(backgroundBehind(plan as never)).toBe(theme.backgroundElement);
    expect(styleOf(screen.getByText('received')).color).toBe(theme.kindInk.income);
  });

  it('Plan screen: text and background come from the theme', async () => {
    await startApp({ today: [2026, 10, 7], entries: [...entries] });
    await press('My plan');

    const heading = screen.getByText('How much do you want to save?');
    expect(styleOf(heading).color).toBe(theme.text);
    expect(styleOf(screen.getByText(/^A share of every income/)).color).toBe(theme.textSecondary);
    expect(backgroundBehind(heading as never)).toBe(theme.background);
  });

  it('Month picker: text and background come from the theme', async () => {
    await startApp({ today: [2026, 10, 7], entries: [...entries] });
    await press(/^Month:/);

    const bgs = [theme.background, theme.backgroundElement];
    expect(bgs).toContain(backgroundBehind(screen.getByText('Oct') as never));
  });
});
