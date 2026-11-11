import { Alert, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { act, screen, within } from 'expo-router/testing-library';

import {
  answerDialog,
  breakDeviceWrites,
  choose,
  exactText,
  expectLeftToSpend,
  press,
  startApp,
  type,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

const alertSpy = jest.spyOn(Alert, 'alert');
const haptic = Haptics.performAndroidHapticsAsync as jest.Mock;

beforeEach(() => haptic.mockClear());
afterEach(() => {
  alertSpy.mockClear();
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 7];
const salary = (cents: number) => ({ date: '2026-11-01', kind: 'income', amountCents: cents, note: 'Salary' }) as const;
const saving = (cents: number) => ({ date: '2026-11-02', kind: 'savings', amountCents: cents, note: 'Piggy bank' }) as const;
const spending = (cents: number, note = 'Rent') => ({ date: '2026-11-03', kind: 'expense', amountCents: cents, note }) as const;

const tile = (name: string) => within(screen.getByRole('button', { name }));
const bar = () => screen.queryByTestId('savings-goal-bar', { includeHiddenElements: true });
const fillWidth = () => {
  const fill = (bar()!.children[0] as unknown as { props: { style: unknown } }).props.style;
  return (StyleSheet.flatten(fill as never) as { width: string }).width;
};
/** The red layer on top of the green month card: opacity 1 is red, 0 is green. */
const redLayerOpacity = () => {
  const card = screen.getByLabelText(/^Left to spend/).parent as unknown as { children: { props: { style: unknown } }[] };
  return (StyleSheet.flatten(card.children[0].props.style as never) as { opacity: number }).opacity;
};
const textOf = (node: unknown): string =>
  typeof node === 'string' ? node : ((node as { children?: unknown[] }).children ?? []).map(textOf).join('');
/** The cents the card currently writes, read from its visible text (e.g. "1 187,50 €" is 118750). */
const shownLeft = () => {
  const text = textOf(screen.getByText('Left to spend').parent).replace('Left to spend', '');
  const [, sign, whole, cents] = text.match(/^(-?)([\d\s\u00a0\u202f]+),(\d\d)/)!;
  return (sign ? -1 : 1) * (Number(whole.replace(/\D/g, '')) * 100 + Number(cents));
};
const settle = () =>
  act(async () => {
    jest.advanceTimersByTime(600);
  });

describe('See savings progress at a glance', () => {
  it('Partly saved: a goal of 400,00 € and 100,00 € saved show a bar a quarter full under "of 400 €"', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), saving(10000)] });

    expect(tile('Savings').getByText(exactText('of 400 €'))).toBeOnTheScreen();
    expect(bar()).toBeTruthy();
    expect(fillWidth()).toBe('25%');
  });

  it('Goal reached: 400,00 € saved of a 400,00 € goal gives a full bar and "Goal reached"', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), saving(40000)] });

    expect(fillWidth()).toBe('100%');
    expect(tile('Savings').getByText('Goal reached')).toBeOnTheScreen();
  });

  it('Goal reached: more than the goal saved keeps the bar full, never beyond', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), saving(60000)] });

    expect(fillWidth()).toBe('100%');
    expect(tile('Savings').getByText('Goal reached')).toBeOnTheScreen();
  });

  it('Normal month (002): 150,00 € saved of 400,00 € is a little over a third full', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), saving(15000), spending(90000)] });

    expect(parseFloat(fillWidth())).toBeGreaterThan(33.4);
    expect(parseFloat(fillWidth())).toBeLessThan(40);
  });

  it('Nothing saved yet: the bar is empty', async () => {
    await startApp({ today: TODAY, entries: [salary(200000)] });

    expect(bar()).toBeTruthy();
    expect(parseFloat(fillWidth())).toBe(0);
  });

  it('No goal: a 0 % plan says "No goal" and shows no bar', async () => {
    await startApp({ today: TODAY, plans: [[0, '2026-07']], entries: [salary(200000), saving(10000)] });

    expect(tile('Savings').getByText('No goal')).toBeOnTheScreen();
    expect(bar()).toBeNull();
  });

  it('Savings bar: saving more in the same month makes the bar longer', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), saving(10000)] });
    expect(fillWidth()).toBe('25%');

    await press('Add expense');
    await choose('Savings');
    await type('Amount', '100,00');
    await press('Add to savings');

    expect(fillWidth()).toBe('50%');
  });
});

describe('Notice when the month is overspent', () => {
  it('Overspent: 20 %, income 1000,00 € and 900,00 € spent turn the card red with -100,00 € left', async () => {
    await startApp({ today: TODAY, entries: [salary(100000), spending(90000)] });

    await expectLeftToSpend('-100,00 €');
    expect(redLayerOpacity()).toBe(1);
  });

  it('Back in budget: deleting expenses until left to spend is 0 or more makes the card green again', async () => {
    await startApp({ today: TODAY, entries: [salary(100000), spending(90000)] });
    expect(redLayerOpacity()).toBe(1);

    await press(/Rent/);
    await press('Delete');
    await answerDialog('Delete');

    await expectLeftToSpend('800,00 €');
    expect(redLayerOpacity()).toBe(0);
  });

  it('Exactly zero: left to spend of 0,00 € is green', async () => {
    await startApp({ today: TODAY, entries: [salary(100000), spending(80000)] });

    await expectLeftToSpend('0,00 €');
    expect(redLayerOpacity()).toBe(0);
  });

  it('Just below zero: -0,01 € is red', async () => {
    await startApp({ today: TODAY, entries: [salary(100000), spending(80001)] });

    await expectLeftToSpend('-0,01 €');
    expect(redLayerOpacity()).toBe(1);
  });

  it('No income: a month with expenses but no income stays green', async () => {
    await startApp({ today: TODAY, entries: [spending(5000)] });

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    const card = screen.getByText("Add this month's income").parent!.parent as unknown as {
      children: { props: { style: unknown } }[];
    };
    const layer = StyleSheet.flatten(card.children[0].props.style as never) as { opacity: number };
    expect(layer.opacity).toBe(0);
  });

  it('A normal month is green', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), saving(15000), spending(90000)] });

    expect(redLayerOpacity()).toBe(0);
  });

  it('Nothing else on the card changes: the red card still shows the same label and income, spent and savings tiles', async () => {
    await startApp({ today: TODAY, entries: [salary(100000), spending(90000)] });

    expect(screen.getByText('Left to spend')).toBeOnTheScreen();
    expect(tile('Income').getByText(exactText('1 000 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('900 €'))).toBeOnTheScreen();
  });
});

describe('The app feels smooth', () => {
  it('Figure changes: after adding an expense the figure ends on the exact new amount', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), spending(40000)] });
    await expectLeftToSpend('1 200,00 €');

    await press('Add expense');
    await type('Amount', '12,50');
    await press('Add expense');
    await settle();

    await expectLeftToSpend('1 187,50 €');
  });

  it('Figure changes: on returning home the figure runs between the old and the new amount within half a second', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), spending(40000)] });
    await expectLeftToSpend('1 200,00 €');

    await press('Add expense');
    await type('Amount', '100,00');
    await press('Add expense');
    const seen = new Set<number>();
    for (let step = 0; step < 30; step++) {
      await act(async () => {
        jest.advanceTimersByTime(17);
      });
      seen.add(shownLeft());
    }

    const between = [...seen].filter((cents) => cents < 120000 && cents > 110000);
    expect(between.length).toBeGreaterThan(0);
    expect([...seen].every((cents) => cents <= 120000 && cents >= 110000)).toBe(true);
    expect(shownLeft()).toBe(110000);
  });

  it('Opening the app: the first time home appears the figure is shown at once, not counted up from zero', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), spending(40000)] });

    expect(screen.getByText('Left to spend').parent).toHaveTextContent(/^Left to spend1[\s  ]200,00[\s  ]€/);
  });
});

describe('The app feels smooth: edge cases', () => {
  it('Changing month: switching month shows the new month figure at once', async () => {
    await startApp({
      today: TODAY,
      entries: [salary(200000), { date: '2026-10-01', kind: 'income', amountCents: 50000, note: 'Old pay' }],
    });
    await expectLeftToSpend('1 600,00 €');

    await press(/^Month:/);
    await press('Oct');

    expect(shownLeft()).toBe(40000);
  });
});

describe('Feel that an action worked', () => {
  it('Saved: adding an entry gives one success vibration', async () => {
    await startApp({ today: TODAY, entries: [salary(200000)] });
    await press('Add expense');
    await type('Amount', '12,50');
    haptic.mockClear();
    await press('Add expense');

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith(Haptics.AndroidHaptics.Confirm);
  });

  it('Saved: editing an entry gives one success vibration', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), spending(1250, 'Cinema')] });
    await press(/Cinema/);
    await type('Amount', '15,00');
    haptic.mockClear();
    await press('Save changes');

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith(Haptics.AndroidHaptics.Confirm);
  });

  it('Saved: saving the plan gives one success vibration', async () => {
    await startApp({ today: TODAY, entries: [salary(200000)] });
    await press('My plan');
    await type('Savings percentage', '30');
    haptic.mockClear();
    await press('Save plan');

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith(Haptics.AndroidHaptics.Confirm);
  });

  it('Saved: repeating the last income gives one success vibration', async () => {
    await startApp({ today: TODAY, entries: [{ date: '2026-10-01', kind: 'income', amountCents: 150000, note: 'Pay' }] });
    haptic.mockClear();
    await press('Repeat last income');

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith(Haptics.AndroidHaptics.Confirm);
  });

  it('Deleted: confirming a delete gives one firm vibration', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), spending(1250, 'Cinema')] });
    await press(/Cinema/);
    await press('Delete');
    haptic.mockClear();
    await answerDialog('Delete');

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith(Haptics.AndroidHaptics.Long_Press);
  });

  it('Deleted: cancelling the delete does not vibrate', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), spending(1250, 'Cinema')] });
    await press(/Cinema/);
    await press('Delete');
    haptic.mockClear();
    await answerDialog('Cancel');

    expect(haptic).not.toHaveBeenCalled();
  });

  it('Choice: picking a kind on the entry form gives a light tick', async () => {
    await startApp({ today: TODAY, entries: [salary(200000)] });
    await press('Add expense');
    haptic.mockClear();
    await choose('Savings');

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith(Haptics.AndroidHaptics.Clock_Tick);
  });

  it('Choice: tapping a tile on home gives a light tick', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), spending(1250, 'Cinema')] });
    haptic.mockClear();
    await press('Spent');

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith(Haptics.AndroidHaptics.Clock_Tick);
  });

  it('Failure: an entry that cannot be saved gives no success vibration', async () => {
    await startApp({ today: TODAY, entries: [salary(200000)] });
    await press('Add expense');
    await type('Amount', '12,50');
    await breakDeviceWrites();
    haptic.mockClear();
    await press('Add expense');

    expect(haptic).not.toHaveBeenCalledWith(Haptics.AndroidHaptics.Confirm);
    expect(haptic).not.toHaveBeenCalled();
  });

  it('Failure: a plan that cannot be saved gives no success vibration', async () => {
    await startApp({ today: TODAY, entries: [salary(200000)] });
    await press('My plan');
    await type('Savings percentage', '30');
    await breakDeviceWrites();
    haptic.mockClear();
    await press('Save plan');

    expect(haptic).not.toHaveBeenCalled();
  });

  it('Failure: a delete that cannot be done gives no vibration', async () => {
    await startApp({ today: TODAY, entries: [salary(200000), spending(1250, 'Cinema')] });
    await press(/Cinema/);
    await press('Delete');
    await breakDeviceWrites();
    haptic.mockClear();
    await answerDialog('Delete');

    expect(haptic).not.toHaveBeenCalled();
  });

  it('Failure: an invalid entry (no amount) gives no vibration', async () => {
    await startApp({ today: TODAY, entries: [salary(200000)] });
    await press('Add expense');
    haptic.mockClear();
    await press('Add expense');

    expect(haptic).not.toHaveBeenCalled();
  });
});
