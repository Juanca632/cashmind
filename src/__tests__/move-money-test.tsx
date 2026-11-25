import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { fireEvent, screen, testRouter, within } from 'expo-router/testing-library';

import { seedDevice } from '../test-support/fake-sqlite';
import {
  DISCARD_DIALOG,
  answerDialog,
  exactText,
  expectBalance,
  expectDialog,
  expectLeftToSpend,
  expectNoDialog,
  headerTitles,
  expectPocketBalance,
  openSpaces,
  partialText,
  pickSpace,
  press,
  showPocket,
  startApp,
  type,
  typeNote,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 25];
const NO_GOAL: [number, string][] = [[0, '2026-01']];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Pay' } as const;
const rent = { date: '2026-11-02', kind: 'expense', amountCents: 180000, note: 'Rent', category: 'housing' } as const;
const emergency = { name: 'Emergency fund', startingCents: 100000 };
const japan = { name: 'Japan trip', startingCents: 50000 };
const car = { name: 'Car', startingCents: 0 };
/** Emergency fund is pocket 1, Japan trip pocket 2, Car pocket 3. */
const toMain = { date: '2026-11-20', amountCents: 30000, from: 1, to: null } as const;
const toJapan = { date: '2026-11-20', amountCents: 30000, from: 1, to: 2 } as const;

const tile = (name: string) => within(screen.getByRole('button', { name }));
const labelOf = (re: RegExp) => screen.getByLabelText(re).props.accessibilityLabel as string;
const dbRows = async (sql: string) => {
  let result: any[] = [];
  await seedDevice(async (db) => {
    result = await db.getAllAsync(sql);
  });
  return result;
};
const movesInDb = () => dbRows('SELECT date, amount_cents, from_pocket_id, to_pocket_id, note FROM move ORDER BY id');
const radiosOf = (group: string) =>
  within(screen.getByLabelText(group))
    .getAllByRole('radio')
    .map((r) => r.props.accessibilityLabel as string);
/** A move row's accessible name: "<title>, <day>, <amount with sign>". */
const moveRow = (title: string, day: string, amount: string) =>
  new RegExp(`^${title}, ${day}, ${amount.replace(/[+-]/, (c) => `\\${c}`).replace(/ /g, '.')}$`);
/** The From and To groups share pocket names, so a radio is looked up in its group. */
const chooseIn = (group: string, name: string) =>
  fireEvent.press(within(screen.getByLabelText(group)).getByRole('radio', { name }));
const chooseTo = (name: string) => chooseIn('To', name);
const fireFrom = (name: string) => chooseIn('From', name);
const TO_MAIN_ROW = moveRow('To Main', 'Fri 20 Nov', '-300,00 €');
const FROM_EMERGENCY_ROW = moveRow('From Emergency fund', 'Fri 20 Nov', '+300,00 €');

describe('Take money out of a pocket for the month (Story 1)', () => {
  const setup = { today: TODAY, plans: NO_GOAL, pockets: [emergency], entries: [salary, rent] };

  it('Opening: a pocket offers "Save into", "Spend from" and "Move"; "Move" opens "Move money" with From the pocket and To "Main"', async () => {
    await startApp(setup);
    await showPocket('Emergency fund');
    expect(screen.getByRole('button', { name: 'Save into' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Spend from' })).toBeOnTheScreen();

    await press('Move');

    expect(screen).toHavePathname('/move');
    expect(headerTitles()).toContain('Move money');
    expect(radiosOf('From')).toEqual(['Emergency fund']);
    expect(within(screen.getByLabelText('From')).getByRole('radio', { name: 'Emergency fund' })).toBeSelected();
    expect(within(screen.getByLabelText('To')).getByRole('radio', { name: 'Main' })).toBeSelected();
  });

  it('Opening: Main\'s space has no "Move" action', async () => {
    await startApp({ ...setup, pockets: [emergency, japan] });
    expect(screen.queryByRole('button', { name: 'Move' })).not.toBeOnTheScreen();
  });

  it('Moved: typing 300,00 and saving leaves "Emergency fund" at 700,00 € and lists "To Main" with "-300,00 €"', async () => {
    await startApp(setup);
    await showPocket('Emergency fund');
    await expectBalance('1 000,00 €');
    await press('Move');
    await type('Amount', '300');
    await press('Move');

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Emergency fund, change' })).toBeOnTheScreen();
    await expectBalance('700,00 €');
    expect(screen.getByRole('button', { name: moveRow('To Main', '.+', '-300,00 €') })).toBeOnTheScreen();
    expect(await movesInDb()).toEqual([{ date: '2026-11-25', amount_cents: 30000, from_pocket_id: 1, to_pocket_id: null, note: '' }]);
  });

  it('More left to spend: Main goes from 200,00 € to 500,00 €, and the daily budget and the pace follow it', async () => {
    await startApp(setup);
    await expectLeftToSpend('200,00 €');
    expect(labelOf(/^Left to spend/)).toMatch(partialText('≈ 33,33 € / day · 6 days left'));
    expect(labelOf(/^Spending pace/)).toMatch(partialText('to 2 000,00 €.'));

    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '300');
    await press('Move');
    await pickSpace(/^Main/);

    await expectLeftToSpend('500,00 €');
    expect(labelOf(/^Left to spend/)).toMatch(partialText('≈ 83,33 € / day · 6 days left'));
    expect(screen.getByText(exactText('≈ 83,33 € / day · 6 days left'))).toBeOnTheScreen();
    expect(labelOf(/^Spending pace/)).toMatch(partialText('to 2 300,00 €.'));
  });

  it('Not income, not savings: the Income and Savings tiles, the goal and Trends are the same after the move', async () => {
    await startApp({ ...setup, plans: [[20, '2026-01']] });
    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 400 €'))).toBeOnTheScreen();

    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '300');
    await press('Move');
    await pickSpace(/^Main/);

    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('1 800 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('0 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 400 €'))).toBeOnTheScreen();
    await expectLeftToSpend('100,00 €'); // 2 000 + 300 - 1 800 - 400

    await press(/^See trends/);
    expect(screen.queryByLabelText(/300,00/)).not.toBeOnTheScreen();
    expect(screen.queryByText(partialText('2 300'))).not.toBeOnTheScreen();
  });

  it('In Main\'s list: Main\'s list and Activity show the move on its day as "From Emergency fund" with "+300,00 €"', async () => {
    const extras = [2, 4, 5, 6].map((d) => ({ date: `2026-11-0${d}`, kind: 'expense', amountCents: 100, note: `Extra ${d}` }) as const);
    await startApp({ ...setup, entries: [salary, ...extras], moves: [toMain] });

    expect(screen.getByRole('button', { name: FROM_EMERGENCY_ROW })).toBeOnTheScreen();
    await press('See all 6 entries');
    expect(screen.getByRole('button', { name: FROM_EMERGENCY_ROW })).toBeOnTheScreen();
  });

  it('Date: the form starts on today and the date can be changed; a move into Main counts in the month of its date', async () => {
    jest.spyOn(DateTimePickerAndroid, 'open').mockImplementation((args) => {
      (args.onValueChange as unknown as (event: unknown, date: Date) => void)({}, new Date(2026, 9, 20));
    });
    await startApp({
      ...setup,
      entries: [salary, rent, { date: '2026-10-01', kind: 'income', amountCents: 100000, note: 'Oct pay' }],
    });
    await showPocket('Emergency fund');
    await press('Move');
    expect(screen.getByRole('button', { name: /^Date: Wed 25 Nov/ })).toBeOnTheScreen();
    await press(/^Date: /);
    expect(screen.getByRole('button', { name: /^Date: Tue 20 Oct/ })).toBeOnTheScreen();
    await type('Amount', '300');
    await press('Move');

    expect(await movesInDb()).toEqual([expect.objectContaining({ date: '2026-10-20', amount_cents: 30000 })]);
    await pickSpace(/^Main/);
    await expectLeftToSpend('200,00 €'); // November is untouched
    await press(/^Month:/);
    await press('Oct');
    await expectLeftToSpend('1 300,00 €'); // October: 1 000 + 300
  });

  it('Note: a note shows as the move\'s title instead of "To Main" and "From Emergency fund"', async () => {
    await startApp(setup);
    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '300');
    await typeNote('Car repair');
    await press('Move');

    expect(screen.getByRole('button', { name: moveRow('Car repair', '.+', '-300,00 €') })).toBeOnTheScreen();
    expect(screen.queryByText('To Main')).not.toBeOnTheScreen();
    await pickSpace(/^Main/);
    expect(screen.getByRole('button', { name: moveRow('Car repair', '.+', '+300,00 €') })).toBeOnTheScreen();
    expect(screen.queryByText('From Emergency fund')).not.toBeOnTheScreen();
  });

  it('Amount: an empty amount cannot be saved and a zero amount is refused with the entry form\'s message', async () => {
    await startApp(setup);
    await showPocket('Emergency fund');
    await press('Move');
    expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled();

    await type('Amount', '0');
    await press('Move');
    expect(screen.getByText('The amount must be greater than 0.')).toBeOnTheScreen();
    expect(await movesInDb()).toEqual([]);
  });

  it('Amount: an amount above the app limit is refused with "This amount is too large."', async () => {
    await startApp({ ...setup, pockets: [{ name: 'Emergency fund', startingCents: 90_000_000_000 }] });
    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '900000000,01');
    await press('Move');

    expect(screen.getByText('This amount is too large.')).toBeOnTheScreen();
    expect(await movesInDb()).toEqual([]);
  });
});

describe('Move money between pockets (Story 2)', () => {
  const setup = { today: TODAY, plans: NO_GOAL, pockets: [emergency, japan], entries: [salary, rent] };
  const moveToJapan = async () => {
    await showPocket('Emergency fund');
    await press('Move');
    await chooseTo('Japan trip');
    await type('Amount', '300');
    await press('Move');
  };

  it('To another pocket: moving 300,00 € from "Emergency fund" to "Japan trip" leaves 700,00 € and 800,00 €', async () => {
    await startApp(setup);
    await moveToJapan();

    expect(screen).toHavePathname('/');
    await expectPocketBalance('Emergency fund', '700,00 €');
    await expectPocketBalance('Japan trip', '800,00 €');
    expect(await movesInDb()).toEqual([{ date: '2026-11-25', amount_cents: 30000, from_pocket_id: 1, to_pocket_id: 2, note: '' }]);
  });

  it('Both lists: "Emergency fund" lists "To Japan trip" with "-300,00 €" and "Japan trip" lists "From Emergency fund" with "+300,00 €"', async () => {
    await startApp({ ...setup, moves: [toJapan] });

    await showPocket('Emergency fund');
    expect(screen.getByRole('button', { name: moveRow('To Japan trip', 'Fri 20 Nov', '-300,00 €') })).toBeOnTheScreen();
    await showPocket('Japan trip');
    expect(screen.getByRole('button', { name: FROM_EMERGENCY_ROW })).toBeOnTheScreen();
  });

  it('No month change: none of Main\'s figures or lists change', async () => {
    await startApp(setup);
    await expectLeftToSpend('200,00 €');
    const before = {
      card: labelOf(/^Left to spend/),
      pace: labelOf(/^Spending pace/),
      rows: screen.getAllByRole('button').map((b) => b.props.accessibilityLabel).filter((l) => /Pay|Rent/.test(l ?? '')),
    };
    await moveToJapan();
    await pickSpace(/^Main/);

    await expectLeftToSpend('200,00 €');
    expect(labelOf(/^Left to spend/)).toBe(before.card);
    expect(labelOf(/^Spending pace/)).toBe(before.pace);
    expect(screen.queryByText(partialText('From Emergency fund'))).not.toBeOnTheScreen();
    expect(screen.queryByText(partialText('To Japan trip'))).not.toBeOnTheScreen();
    expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel).filter((l) => /Pay|Rent/.test(l ?? ''))).toEqual(before.rows);
  });

  it('Choices: To offers "Main" and every other pocket, never the From pocket; From offers every pocket and no "New pocket"', async () => {
    await startApp({ ...setup, pockets: [emergency, japan, car] });
    await showPocket('Emergency fund');
    await press('Move');

    expect(radiosOf('From')).toEqual(['Emergency fund', 'Japan trip', 'Car']);
    expect(radiosOf('To')).toEqual(['Main', 'Japan trip', 'Car']);
    expect(screen.queryByRole('radio', { name: /New pocket/ })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /New pocket/ })).not.toBeOnTheScreen();

    await chooseTo('Car');
    await fireFrom('Japan trip');
    expect(radiosOf('To')).toEqual(['Main', 'Emergency fund', 'Car']);
  });

  it('Choices: changing From to the pocket chosen as To sets To back to "Main"', async () => {
    await startApp(setup);
    await showPocket('Emergency fund');
    await press('Move');
    await chooseTo('Japan trip');
    expect(within(screen.getByLabelText('To')).getByRole('radio', { name: 'Japan trip' })).toBeSelected();

    await fireFrom('Japan trip');

    expect(within(screen.getByLabelText('From')).getByRole('radio', { name: 'Japan trip' })).toBeSelected();
    expect(within(screen.getByLabelText('To')).getByRole('radio', { name: 'Main' })).toBeSelected();
  });

  it('Choices: with only one pocket To offers only "Main"', async () => {
    await startApp({ ...setup, pockets: [emergency] });
    await showPocket('Emergency fund');
    await press('Move');
    expect(radiosOf('To')).toEqual(['Main']);
  });

  it('Choices: From can be changed, and the move then leaves that pocket', async () => {
    await startApp(setup);
    await showPocket('Emergency fund');
    await press('Move');
    await fireFrom('Japan trip');
    await type('Amount', '100');
    await press('Move');

    expect(await movesInDb()).toEqual([expect.objectContaining({ from_pocket_id: 2, to_pocket_id: null, amount_cents: 10000 })]);
    await expectPocketBalance('Japan trip', '400,00 €');
    await expectPocketBalance('Emergency fund', '1 000,00 €');
  });

  it('Total: "In pockets" is the same after a move between pockets and lower by the amount after a move into Main', async () => {
    const inPockets = () => screen.getByText(/^In pockets/);
    await startApp(setup);
    await openSpaces();
    expect(inPockets()).toHaveTextContent(/1.500,00.€$/);

    await startApp({ ...setup, moves: [toJapan] });
    await openSpaces();
    expect(inPockets()).toHaveTextContent(/1.500,00.€$/);

    await startApp({ ...setup, moves: [toMain] });
    await openSpaces();
    expect(inPockets()).toHaveTextContent(/1.200,00.€$/);
  });
});


describe('Fix or undo a move (Story 3)', () => {
  const setup = { today: TODAY, plans: NO_GOAL, pockets: [emergency, japan], entries: [salary, rent], moves: [{ ...toMain, note: 'Car repair' }] };
  const openMove = async () => {
    await showPocket('Emergency fund');
    await press(moveRow('Car repair', 'Fri 20 Nov', '-300,00 €'));
  };

  it('Edit: tapping a move opens the form with its From, To, amount, date and note', async () => {
    await startApp(setup);
    await openMove();

    expect(screen).toHavePathname('/move');
    expect(within(screen.getByLabelText('From')).getByRole('radio', { name: 'Emergency fund' })).toBeSelected();
    expect(within(screen.getByLabelText('To')).getByRole('radio', { name: 'Main' })).toBeSelected();
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue(/^300[,.]00$/);
    expect(screen.getByLabelText('Note (optional)')).toHaveDisplayValue('Car repair');
    expect(screen.getByRole('button', { name: /^Date: Fri 20 Nov/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Delete move' })).toBeOnTheScreen();
  });

  it('Edit: a move is also opened from Main\'s list and from the other pocket\'s list', async () => {
    await startApp({ ...setup, moves: [{ ...toJapan, note: 'Flights' }] });
    await showPocket('Japan trip');
    await press(moveRow('Flights', 'Fri 20 Nov', '+300,00 €'));
    expect(screen).toHavePathname('/move');
  });

  it('Edit: saving a new amount updates the balance and Main\'s left to spend', async () => {
    await startApp(setup);
    await openMove();
    await type('Amount', '500');
    await press('Save changes');

    expect(screen).toHavePathname('/');
    await expectBalance('500,00 €');
    expect(screen.getByRole('button', { name: moveRow('Car repair', 'Fri 20 Nov', '-500,00 €') })).toBeOnTheScreen();
    await pickSpace(/^Main/);
    await expectLeftToSpend('700,00 €'); // 2 000 + 500 - 1 800
    expect(await movesInDb()).toEqual([expect.objectContaining({ amount_cents: 50000 })]);
  });

  it('Edit: changing To from Main to a pocket takes the money out of Main\'s month', async () => {
    await startApp(setup);
    await openMove();
    await chooseTo('Japan trip');
    await press('Save changes');

    await expectBalance('700,00 €');
    await expectPocketBalance('Japan trip', '800,00 €');
    await pickSpace(/^Main/);
    await expectLeftToSpend('200,00 €');
    expect(await movesInDb()).toEqual([expect.objectContaining({ from_pocket_id: 1, to_pocket_id: 2 })]);
  });

  it('Delete: "Delete move" asks first through the shared dialog', async () => {
    await startApp(setup);
    await openMove();
    await press('Delete move');
    expectDialog('Delete this move?');
  });

  it('Delete: confirming removes the move and every balance and figure is as before it', async () => {
    await startApp(setup);
    await openMove();
    await press('Delete move');
    await answerDialog('Delete');

    expect(screen).toHavePathname('/');
    await expectBalance('1 000,00 €');
    expect(screen.queryByRole('button', { name: /Car repair/ })).not.toBeOnTheScreen();
    await pickSpace(/^Main/);
    await expectLeftToSpend('200,00 €');
    expect(await movesInDb()).toEqual([]);
  });

  it('Delete: cancelling the dialog keeps the move', async () => {
    await startApp(setup);
    await openMove();
    await press('Delete move');
    await answerDialog('Cancel');

    expectNoDialog();
    expect(screen).toHavePathname('/move');
    expect(await movesInDb()).toHaveLength(1);
  });

  it('Leaving: leaving the form with unsaved changes asks; Keep editing stays and Discard closes without saving', async () => {
    await startApp({ ...setup, moves: [] });
    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '50');

    await testRouter.back();
    expectDialog(DISCARD_DIALOG);
    await answerDialog('Keep editing');
    expectNoDialog();
    expect(screen).toHavePathname('/move');

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen).toHavePathname('/');
    expect(await movesInDb()).toEqual([]);
  });

  it('Leaving: an edited move that is left through Discard stays as it was', async () => {
    await startApp(setup);
    await openMove();
    await type('Amount', '999');
    await testRouter.back();
    await answerDialog('Discard');

    expect(await movesInDb()).toEqual([expect.objectContaining({ amount_cents: 30000 })]);
  });

  it('Leaving: an untouched form closes without asking', async () => {
    await startApp({ ...setup, moves: [] });
    await showPocket('Emergency fund');
    await press('Move');
    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/');
  });
});

describe('Edge cases of moving money', () => {
  const setup = { today: TODAY, plans: NO_GOAL, pockets: [emergency, japan], entries: [salary, rent] };

  it('Not enough in the pocket: with 700,00 € left, 701 shows "Emergency fund holds only 700,00 €." and saves nothing', async () => {
    await startApp({ ...setup, moves: [toMain] });
    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '701');

    expect(screen.getByText('Emergency fund holds only 700,00 €.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled();
    await press('Move');
    expect(screen).toHavePathname('/move');
    expect(await movesInDb()).toHaveLength(1);
  });

  it('Not enough in the pocket: exactly 700,00 € is allowed, with no hint, and leaves the pocket at 0,00 €', async () => {
    await startApp({ ...setup, moves: [toMain] });
    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '700');

    expect(screen.queryByText(/holds only/)).not.toBeOnTheScreen();
    await press('Move');
    await expectBalance('0,00 €');
    expect(await movesInDb()).toHaveLength(2);
  });

  it('Not enough in the pocket: the hint names the From pocket chosen in the form', async () => {
    await startApp(setup);
    await showPocket('Emergency fund');
    await press('Move');
    await fireFrom('Japan trip');
    await type('Amount', '500,01');

    expect(screen.getByText('Japan trip holds only 500,00 €.')).toBeOnTheScreen();
  });

  it('Not enough in the pocket: when editing, its own amount counts as still in the pocket', async () => {
    await startApp({ ...setup, moves: [toMain] });
    await showPocket('Emergency fund');
    await press(moveRow('To Main', 'Fri 20 Nov', '-300,00 €'));

    await type('Amount', '1000');
    expect(screen.queryByText(/holds only/)).not.toBeOnTheScreen();
    await type('Amount', '1001');
    expect(screen.getByText('Emergency fund holds only 1 000,00 €.')).toBeOnTheScreen();
    await type('Amount', '1000');
    await press('Save changes');
    await expectBalance('0,00 €');
  });

  it('Not enough in the pocket: a pocket at 0 cannot be moved from', async () => {
    await startApp({ ...setup, pockets: [car, japan] });
    await showPocket('Car');
    await press('Move');
    await type('Amount', '1');

    expect(screen.getByText('Car holds only 0,00 €.')).toBeOnTheScreen();
    await press('Move');
    expect(await movesInDb()).toEqual([]);
  });

  it('Not enough in the pocket: a pocket below zero cannot be moved from', async () => {
    const spend = { date: '2026-11-04', kind: 'expense', amountCents: 5000, note: 'Fuel', pocketId: 1 } as const;
    await startApp({ ...setup, pockets: [{ name: 'Car', startingCents: 2000 }, japan], entries: [salary, rent, spend] });
    await showPocket('Car');
    await press('Move');
    await type('Amount', '1');

    expect(screen.getByText('Car holds only -30,00 €.')).toBeOnTheScreen();
    expect(await movesInDb()).toEqual([]);
  });

  it('Deleting a pocket: one a move comes from has no delete button and says why', async () => {
    await startApp({ ...setup, moves: [toMain] });
    await showPocket('Emergency fund');
    await press('Edit Emergency fund');

    expect(screen.queryByRole('button', { name: 'Delete pocket' })).not.toBeOnTheScreen();
    expect(screen.getByText("A pocket with savings, spending or moves can't be deleted. You can rename it.")).toBeOnTheScreen();
  });

  it('Deleting a pocket: one a move goes to cannot be deleted either, and an unused one still can', async () => {
    await startApp({ ...setup, pockets: [emergency, japan, car], moves: [toJapan] });
    await showPocket('Japan trip');
    await press('Edit Japan trip');
    expect(screen.queryByRole('button', { name: 'Delete pocket' })).not.toBeOnTheScreen();
    expect(screen.getByText(partialText("moves can't be deleted"))).toBeOnTheScreen();

    await startApp({ ...setup, pockets: [emergency, japan, car], moves: [toJapan] });
    await showPocket('Car');
    await press('Edit Car');
    expect(screen.getByRole('button', { name: 'Delete pocket' })).toBeOnTheScreen();
  });

  it('Month without income: the card keeps asking for income, and the moved money counts once the month has income', async () => {
    await startApp({ today: TODAY, plans: NO_GOAL, pockets: [emergency], moves: [toMain] });

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Left to spend: /)).not.toBeOnTheScreen();

    await press('Add income');
    await type('Amount', '1000');
    await press('Add income');
    await expectLeftToSpend('1 300,00 €');
  });

  it('Pocket tiles: Saved and Spent stay savings and expenses only; the move is in Activity and the balance', async () => {
    const saving = { date: '2026-11-02', kind: 'savings', amountCents: 20000, note: 'Bonus', pocketId: 1 } as const;
    const dinner = { date: '2026-11-04', kind: 'expense', amountCents: 5000, note: 'Dinner', category: 'eating_out', pocketId: 1 } as const;
    await startApp({ ...setup, pockets: [emergency], entries: [salary, rent, saving, dinner], moves: [toMain] });
    await showPocket('Emergency fund');

    await expectBalance('850,00 €'); // 1 000 + 200 - 50 - 300
    expect(tile('Saved').getByText(exactText('200 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('50 €'))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: TO_MAIN_ROW })).toBeOnTheScreen();

    await press('Saved');
    expect(screen.queryByRole('button', { name: TO_MAIN_ROW })).not.toBeOnTheScreen();
    await press('Saved');
    await press('Spent');
    expect(screen.queryByRole('button', { name: TO_MAIN_ROW })).not.toBeOnTheScreen();
    await press('Spent');
    expect(screen.getByRole('button', { name: TO_MAIN_ROW })).toBeOnTheScreen();
  });

  it('Main\'s tiles: filtering Main\'s list by a kind does not show moves; the unfiltered list does', async () => {
    await startApp({ ...setup, moves: [toMain] });
    expect(screen.getByRole('button', { name: FROM_EMERGENCY_ROW })).toBeOnTheScreen();

    await press('Spent');
    expect(screen.queryByRole('button', { name: FROM_EMERGENCY_ROW })).not.toBeOnTheScreen();
    await press('Spent');
    expect(screen.getByRole('button', { name: FROM_EMERGENCY_ROW })).toBeOnTheScreen();
    await press('Income');
    expect(screen.queryByRole('button', { name: FROM_EMERGENCY_ROW })).not.toBeOnTheScreen();
  });

  it('Main\'s list: a move between pockets is not in Main\'s list or Activity', async () => {
    await startApp({ ...setup, moves: [toJapan] });
    expect(screen.queryByText(partialText('From Emergency fund'))).not.toBeOnTheScreen();
    expect(screen.queryByText(partialText('To Japan trip'))).not.toBeOnTheScreen();
  });

  it('Main\'s list: a move into Main dated in another month is not in this month\'s list', async () => {
    await startApp({ ...setup, moves: [{ ...toMain, date: '2026-10-20' }] });
    expect(screen.queryByText(partialText('From Emergency fund'))).not.toBeOnTheScreen();
    await expectLeftToSpend('200,00 €');
  });

  it('Quick add and monthly entries ignore moves: three moves with the same note suggest nothing and make no monthly item', async () => {
    const again = (date: string) => ({ date, amountCents: 1000, from: 1, to: null, note: 'Ramen' }) as const;
    await startApp({ ...setup, moves: [again('2026-11-03'), again('2026-11-10'), again('2026-11-18')] });
    await press('Add expense');

    expect(screen.queryByText('Often recorded')).not.toBeOnTheScreen();
    expect(await dbRows('SELECT * FROM recurring')).toEqual([]);
  });

  it('Accessibility: a move row reads "<title>, <day>, <amount with sign>"', async () => {
    await startApp({ ...setup, moves: [toMain] });
    expect(screen.getByRole('button', { name: FROM_EMERGENCY_ROW })).toBeOnTheScreen();
    await showPocket('Emergency fund');
    expect(screen.getByRole('button', { name: TO_MAIN_ROW })).toBeOnTheScreen();
  });
});

describe('Lists keep time order (FR-006)', () => {
  const lunch = { date: '2026-11-25', kind: 'expense', amountCents: 900, note: 'Lunch', category: 'eating_out' } as const;
  const stamp = (note: string, at: string) => `UPDATE entry SET created_at = '${at}' WHERE note = '${note}';`;
  const order = () =>
    screen.queryAllByText(/^(Lunch|Coffee|To Main|From Emergency fund|To Japan trip)$/).map((t) => t.props.children as string);
  const base = { today: TODAY, plans: NO_GOAL, pockets: [emergency, japan] };
  const todayMove = { date: '2026-11-25', amountCents: 30000, from: 1, to: null, createdAt: '2026-11-25 10:00:00' } as const;

  it('Main: a move into Main made after an expense of the same day lists above it', async () => {
    await startApp({ ...base, entries: [salary, lunch], moves: [todayMove], raw: [stamp('Lunch', '2026-11-25 09:00:00')] });
    expect(order()).toEqual(['From Emergency fund', 'Lunch']);
  });

  it('Main: an expense recorded after a move of the same day lists above the move', async () => {
    await startApp({ ...base, entries: [salary, lunch], moves: [todayMove], raw: [stamp('Lunch', '2026-11-25 11:00:00')] });
    expect(order()).toEqual(['Lunch', 'From Emergency fund']);
  });

  it('Main: a move recorded through the form after an expense lists above it', async () => {
    await startApp({ ...base, entries: [salary, lunch], raw: [stamp('Lunch', '2026-11-25 09:00:00')] });
    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '100');
    await press('Move');
    await pickSpace(/^Main/);
    expect(order()).toEqual(['From Emergency fund', 'Lunch']);
  });

  it('Pocket: a move out made after a pocket expense of the same day lists above it, and below one recorded later', async () => {
    const paid = { ...lunch, pocketId: 1 } as const;
    await startApp({ ...base, entries: [salary, paid, { ...paid, note: 'Coffee' }], moves: [todayMove], raw: [stamp('Lunch', '2026-11-25 09:00:00'), stamp('Coffee', '2026-11-25 11:00:00')] });
    await showPocket('Emergency fund');
    expect(order()).toEqual(['Coffee', 'To Main', 'Lunch']);
  });
});
