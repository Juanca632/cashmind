import { screen, testRouter, within } from 'expo-router/testing-library';

import { seedDevice } from '../test-support/fake-sqlite';
import {
  answerDialog,
  backOnSheet,
  choose,
  closeSpaces,
  exactText,
  expectBalance,
  expectDialog,
  installBackButton,
  openSpaces,
  partialText,
  pickSpace,
  press,
  reopenApp,
  showPocket,
  spaceRows,
  startApp,
  startAppOnReleasedVersion,
  type,
  typeNote,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

let backButton: ReturnType<typeof installBackButton>;

beforeEach(() => {
  backButton = installBackButton();
});

afterEach(() => {
  backButton.restore();
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 12];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 400000, note: 'Pay' } as const;
const japan = { name: 'Japan trip', startingCents: 150000, emoji: '✈️', color: 'pink' } as const;
const car = { name: 'Car', startingCents: 0 };

const sheet = () => screen.queryByTestId('spaces-sheet');
const buttonNames = () => screen.getAllByRole('button').map((b) => b.props.accessibilityLabel as string | undefined);
const tile = (name: string) => within(screen.getByRole('button', { name }));
const rows = async (sql: string) => {
  let result: any[] = [];
  await seedDevice(async (db) => {
    result = await db.getAllAsync(sql);
  });
  return result;
};

describe('Switch between my spaces in one place', () => {
  it('Selector: the top row is the month pill, My plan and Settings, and "Space: Main, change" comes after them, in every month', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    const names = buttonNames();
    const at = (name: string) => names.indexOf(name);

    expect(names[0]).toBe('Month: November 2026');
    expect(at('Month: November 2026')).toBeLessThan(at('My plan'));
    expect(at('My plan')).toBeLessThan(at('Settings'));
    expect(at('Settings')).toBeLessThan(at('Space: Main, change'));
    expect(within(screen.getByRole('button', { name: 'Space: Main, change' })).getByText('Main')).toBeOnTheScreen();
    expect(screen.queryByText('This month')).not.toBeOnTheScreen();
  });

  it('Selector: it is there without income and in a past month, where My plan is not', async () => {
    await startApp({ today: TODAY });
    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();

    await press(/^Month:/);
    await press('Sep');
    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Month: September 2026' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'My plan' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeOnTheScreen();
  });

  it('Sheet: it lists "Main" with its left to spend, every pocket in creation order with its balance, "In pockets <total>" and "New pocket"', async () => {
    await startApp({
      today: TODAY,
      plans: [[25, '2026-01']],
      pockets: [japan, car],
      entries: [salary, { date: '2026-11-04', kind: 'expense', amountCents: 6000, note: 'Fuel', pocketId: 2 }],
    });

    expect(sheet()).toBeNull();
    await openSpaces();

    expect(screen.getByRole('header', { name: 'Spaces' })).toBeOnTheScreen();
    expect(screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel)).toEqual([
      expect.stringMatching(/^Main, 3.000,00.€$/),
      expect.stringMatching(/^Japan trip, 1.500,00.€$/),
      expect.stringMatching(/^Car, -60,00.€$/),
    ]);
    expect(screen.getByText(/^In pockets/)).toHaveTextContent(/^In pockets.1.440,00.€$/);
    expect(screen.getByRole('button', { name: /New pocket$/ })).toBeOnTheScreen();
    expect(within(screen.getByRole('radio', { name: /^Japan trip/ })).getByText('✈️')).toBeOnTheScreen();
    expect(within(screen.getByRole('radio', { name: /^Japan trip/ })).getByText('Japan trip')).toBeOnTheScreen();
    expect(screen.queryByText('✈️ Japan trip')).not.toBeOnTheScreen();
  });

  it('Sheet: the current space is marked as selected', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan, car] });
    await openSpaces();
    expect(screen.getByRole('radio', { name: /^Main/ })).toBeSelected();
    expect(screen.getByRole('radio', { name: /^Japan trip/ })).not.toBeSelected();
    await closeSpaces();

    await showPocket('Japan trip');
    await openSpaces();
    expect(screen.getByRole('radio', { name: /^Japan trip/ })).toBeSelected();
    expect(screen.getByRole('radio', { name: /^Main/ })).not.toBeSelected();
  });

  it('Sheet: without income "Main" shows no figure, and without pockets there is no "In pockets" line', async () => {
    await startApp({ today: TODAY });
    await openSpaces();

    expect(screen.getByRole('radio', { name: exactText('Main') })).toBeOnTheScreen();
    expect(screen.queryByText(/^In pockets/)).not.toBeOnTheScreen();
  });

  it('Switch: tapping "Japan trip" closes the sheet and home shows that pocket, with the button showing "✈️" and "Japan trip"', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan, car] });
    await pickSpace(/^Japan trip, /);

    expect(sheet()).toBeNull();
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
    expect(within(screen.getByRole('button', { name: 'Space: Japan trip, change' })).getByText('✈️')).toBeOnTheScreen();
    expect(within(screen.getByRole('button', { name: 'Space: Japan trip, change' })).getByText('Japan trip')).toBeOnTheScreen();
    expect(screen.queryByText('✈️ Japan trip')).not.toBeOnTheScreen();
    expect(screen.getByText('Balance')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Left to spend: /)).not.toBeOnTheScreen();
  });

  it('Switch: picking "Main" again goes back to the month, and the month chosen before is kept', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await press(/^Month:/);
    await press('Sep');

    await pickSpace(/^Japan trip, /);
    expect(screen.getByText('Balance')).toBeOnTheScreen();
    await pickSpace(/^Main/);

    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Month: September 2026' })).toBeOnTheScreen();
  });

  it('Switch: moving between pockets does not stack screens, so one back from the last leaves the app', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan, car] });
    await pickSpace(/^Japan trip, /);
    await pickSpace(/^Car, /);
    expect(screen.getByRole('button', { name: 'Space: Car, change' })).toBeOnTheScreen();

    expect(await backButton.press()).toBe('handled');
    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(await backButton.press()).toBe('exit');
  });

  it('Back: from a pocket Android back shows "Main" again; from "Main" back leaves the app', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await showPocket('Japan trip');

    expect(await backButton.press()).toBe('handled');

    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Left to spend: /)).toBeOnTheScreen();
    expect(await backButton.press()).toBe('exit');
  });

  it('Back: on a form opened from a pocket it closes the form and the pocket stays', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await showPocket('Japan trip');
    await press('Save into');
    expect(screen).toHavePathname('/entry');

    await testRouter.back();

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
    expect(screen.getByText('Balance')).toBeOnTheScreen();
  });

  it('Back: pressing Android back on a form opened from a pocket does not send home to "Main"', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await showPocket('Japan trip');
    await press('Save into');

    await backButton.press();
    // Whoever closes the form, home's own handler must stay silent while the form is on top.
    if (screen.queryByRole('radio', { name: 'Savings' })) await testRouter.back();

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
    expect(screen.getByText('Balance')).toBeOnTheScreen();
  });

  it('Opening the app: it always opens on "Main"', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await showPocket('Japan trip');

    await reopenApp();

    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Left to spend: /)).toBeOnTheScreen();
  });

  it('Closing: tapping outside the sheet closes it without changing the space', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await showPocket('Japan trip');
    await openSpaces();
    expect(sheet()).not.toBeNull();

    await closeSpaces();

    expect(sheet()).toBeNull();
    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
  });

  it('Closing: Android back closes the sheet without changing the space, and the next back still works as before', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await showPocket('Japan trip');
    await openSpaces();

    await backOnSheet();

    expect(sheet()).toBeNull();
    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
    expect(await backButton.press()).toBe('handled');
    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
  });

  it('New pocket: "New pocket" in the sheet opens the pocket form, and after creating it home shows the new pocket', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await openSpaces();
    await press(/New pocket$/);

    expect(screen).toHavePathname('/pocket-edit');
    await type('Name', 'Car');
    await type('Amount', '250');
    await press('Create pocket');

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Car, change' })).toBeOnTheScreen();
    await expectBalance('250,00 €');
    expect(await spaceRows()).toEqual([
      expect.stringMatching(/^Main/),
      expect.stringMatching(/^Japan trip, /),
      expect.stringMatching(/^Car, 250,00.€$/),
    ]);
  });
});

describe('A pocket looks like home', () => {
  const trip = {
    today: TODAY,
    plans: [[25, '2026-01']] as [number, string][],
    pockets: [japan, car],
    entries: [
      salary,
      { date: '2026-08-02', kind: 'savings', amountCents: 10000, note: 'August saving', pocketId: 1 },
      { date: '2026-09-09', kind: 'expense', amountCents: 2000, note: 'September ticket', category: 'transport', pocketId: 1 },
      { date: '2026-11-03', kind: 'savings', amountCents: 20000, note: 'Bonus', pocketId: 1 },
      { date: '2026-11-04', kind: 'expense', amountCents: 3500, note: 'Dinner', category: 'eating_out', pocketId: 1 },
      { date: '2026-11-05', kind: 'expense', amountCents: 1000, note: 'Lunch', category: 'eating_out' },
      { date: '2026-11-06', kind: 'savings', amountCents: 999, note: 'Car saving', pocketId: 2 },
    ],
  } satisfies Parameters<typeof startApp>[0];

  it('Hero: "Japan trip" holding 1 665,00 € shows "Balance", "1 665,00 €" and "Started with 1 500,00 €"', async () => {
    await startApp({
      today: TODAY,
      pockets: [japan],
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 20000, note: 'Bonus', pocketId: 1 }, { date: '2026-11-04', kind: 'expense', amountCents: 3500, note: 'Dinner', pocketId: 1 }],
    });
    await showPocket('Japan trip');

    await expectBalance('1 665,00 €');
    expect(screen.getByText('Started with 1 500,00 €')).toBeOnTheScreen();
  });

  it('Overdrawn: a pocket holding -50,00 € shows the balance and "This pocket is 50,00 € short."', async () => {
    await startApp({
      today: TODAY,
      pockets: [{ name: 'Car', startingCents: 10000 }],
      entries: [salary, { date: '2026-11-04', kind: 'expense', amountCents: 15000, note: 'Repair', pocketId: 1 }],
    });
    await showPocket('Car');

    await expectBalance('-50,00 €');
    expect(screen.getByText('This pocket is 50,00 € short.')).toBeOnTheScreen();
    expect(screen.queryByText(/^Started with/)).not.toBeOnTheScreen();
  });

  it('Top row: it has "Edit Japan trip" and the gear, the selector comes after them and shows "✈️" and "Japan trip" once, and no month pill, no "My plan"', async () => {
    await startApp(trip);
    await showPocket('Japan trip');
    const names = buttonNames();

    expect(names[0]).toBe('Edit Japan trip');
    expect(names.indexOf('Edit Japan trip')).toBeLessThan(names.indexOf('Settings'));
    expect(names.indexOf('Settings')).toBeLessThan(names.indexOf('Space: Japan trip, change'));
    expect(screen.getAllByText('✈️')).toHaveLength(1);
    expect(screen.queryByText('✈️ Japan trip')).not.toBeOnTheScreen();
    expect(names).toContain('Edit Japan trip');
    expect(names).toContain('Settings');
    expect(screen.queryByRole('button', { name: /^Month:/ })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'My plan' })).not.toBeOnTheScreen();
  });

  it('Top row: "Edit Japan trip" opens that pocket\'s form', async () => {
    await startApp(trip);
    await showPocket('Japan trip');
    await press('Edit Japan trip');

    expect(screen).toHavePathname('/pocket-edit');
    expect(screen).toHaveSearchParams({ id: '1' });
  });

  it('Top row: the gear opens Settings', async () => {
    await startApp(trip);
    await showPocket('Japan trip');
    await press('Settings');

    expect(screen).toHavePathname('/settings');
  });

  it('Not month-bound: a pocket shows no spending pace, daily budget, Trends or Overview of the month', async () => {
    await startApp(trip);
    await showPocket('Japan trip');

    expect(screen.queryByText('Spending pace')).not.toBeOnTheScreen();
    expect(screen.queryByText(/ \/ day/)).not.toBeOnTheScreen();
    expect(screen.queryByText(/See trends/)).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Left to spend: /)).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Income' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Savings' })).not.toBeOnTheScreen();
  });

  it('Actions: "Save into" opens the form as Savings into that pocket, and saving returns to the pocket with its new balance', async () => {
    await startApp(trip);
    await showPocket('Japan trip');
    await press('Save into');

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Savings' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
    await type('Amount', '100');
    await press('Add to savings');

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
    await expectBalance('1 845,00 €');
    expect(await rows("SELECT amount_cents, pocket_id FROM entry WHERE kind = 'savings' AND amount_cents = 10000 AND date >= '2026-11-01'")).toEqual([
      { amount_cents: 10000, pocket_id: 1 },
    ]);
  });

  it('Actions: "Spend from" opens the form as an Expense paid from that pocket, and the pocket shows the new balance', async () => {
    await startApp(trip);
    await showPocket('Japan trip');
    await press('Spend from');

    expect(screen.getByRole('radio', { name: 'Expense' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
    await type('Amount', '45');
    await typeNote('Souvenirs');
    await press('Add expense');

    await expectBalance('1 700,00 €');
    expect(screen.getByText('Souvenirs')).toBeOnTheScreen();
  });

  it('Tiles: Saved shows 200 € "into it" without the starting amount, Spent shows 55 € "from it"', async () => {
    await startApp(trip);
    await showPocket('Japan trip');

    expect(screen.getByText('Overview')).toBeOnTheScreen();
    expect(tile('Saved').getByText(exactText('300 €'))).toBeOnTheScreen();
    expect(tile('Saved').getByText('into it')).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('55 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText('from it')).toBeOnTheScreen();
  });

  it('Tiles: tapping Saved filters the list, tapping it again shows all, and "By category" only appears with Spent selected', async () => {
    await startApp(trip);
    await showPocket('Japan trip');
    const listed = () => screen.queryAllByText(/^(August saving|September ticket|Bonus|Dinner|Lunch|Car saving)$/).map((n) => n.props.children);

    await press('Saved');
    expect(listed()).toEqual(['Bonus', 'August saving']);
    expect(screen.queryByText('By category')).not.toBeOnTheScreen();
    await press('Saved');
    expect(listed()).toEqual(['Dinner', 'Bonus', 'September ticket', 'August saving'].sort((a, b) => ['Dinner', 'Bonus', 'September ticket', 'August saving'].indexOf(a) - ['Dinner', 'Bonus', 'September ticket', 'August saving'].indexOf(b)));

    await press('Spent');
    expect(listed()).toEqual(['Dinner', 'September ticket']);
    expect(screen.getByText('By category')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Eating out: 35,00.€, 64.%$/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Transport: 20,00.€, 36.%$/)).toBeOnTheScreen();
  });

  it('Activity: it lists the pocket\'s entries of every month newest first, and nothing of the month or of other pockets', async () => {
    await startApp(trip);
    await showPocket('Japan trip');

    expect(screen.getByText('Activity')).toBeOnTheScreen();
    expect(screen.getAllByText(/^(August saving|September ticket|Bonus|Dinner|Lunch|Car saving)$/).map((n) => n.props.children)).toEqual([
      'Dinner',
      'Bonus',
      'September ticket',
      'August saving',
    ]);
  });

  it('Activity: a pocket with none says "Nothing saved in or spent from this pocket yet."', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [car] });
    await showPocket('Car');

    expect(screen.getByText('Nothing saved in or spent from this pocket yet.')).toBeOnTheScreen();
  });

  it('Activity: an entry opens its form, and deleting it gives the money back to the pocket', async () => {
    await startApp(trip);
    await showPocket('Japan trip');
    await press(/Dinner/);
    expect(screen).toHavePathname('/entry');
    await press('Delete');
    expectDialog('Delete this entry?');
    await answerDialog('Delete');

    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
    await expectBalance('1 780,00 €');
  });

  it('Deleted pocket while shown: home falls back to "Main"', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [car] });
    await showPocket('Car');
    await press('Edit Car');
    await press('Delete pocket');
    await answerDialog('Delete');

    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
  });

  it('Unknown pocket: an id that does not exist shows the month view', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [car] });
    await testRouter.navigate('/?space=42');

    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Left to spend: /)).toBeOnTheScreen();
  });

  it('Pocket entries show only in their pocket\'s list, unmarked, and count in no month figure', async () => {
    await startApp(trip);

    expect(screen.queryByRole('button', { name: /Dinner/ })).not.toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('10 €'))).toBeOnTheScreen();
  });
});

describe('Recognise each pocket', () => {
  it('Form: it has "Emoji (optional)" and a "Colour" choice of eight radios, Blue selected by default', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);

    expect(screen.getByLabelText('Emoji (optional)')).toBeOnTheScreen();
    expect(screen.getByLabelText('Emoji (optional)').props.maxLength).toBe(8);
    expect(screen.getByLabelText('Colour').props.accessibilityRole).toBe('radiogroup');
    const group = within(screen.getByLabelText('Colour'));
    expect(group.getAllByRole('radio').map((r) => r.props.accessibilityLabel)).toEqual([
      'Blue',
      'Indigo',
      'Purple',
      'Pink',
      'Orange',
      'Amber',
      'Green',
      'Slate',
    ]);
    expect(group.getByRole('radio', { name: 'Blue' })).toBeSelected();
    expect(group.getByRole('radio', { name: 'Pink' })).not.toBeSelected();
  });

  it('Form: the emoji and the colour picked are stored and shown on the pocket', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);
    await type('Name', 'Japan trip');
    await type('Emoji (optional)', '✈️');
    await choose('Pink');
    expect(screen.getByRole('radio', { name: 'Pink' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Blue' })).not.toBeSelected();
    await press('Create pocket');

    expect(await rows('SELECT name, emoji, color FROM pocket')).toEqual([{ name: 'Japan trip', emoji: '✈️', color: 'pink' }]);
    expect(within(screen.getByRole('button', { name: 'Space: Japan trip, change' })).getByText('✈️')).toBeOnTheScreen();
    expect(within(screen.getByRole('button', { name: 'Space: Japan trip, change' })).getByText('Japan trip')).toBeOnTheScreen();
    expect(screen.queryByText('✈️ Japan trip')).not.toBeOnTheScreen();
  });

  it('Form: with no colour touched the pocket is Blue and with no emoji the name stands alone', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);
    await type('Name', 'Car');
    await press('Create pocket');

    expect(await rows('SELECT emoji, color FROM pocket')).toEqual([{ emoji: '', color: 'blue' }]);
    expect(within(screen.getByRole('button', { name: 'Space: Car, change' })).getByText('Car')).toBeOnTheScreen();
  });

  it('Form: editing opens with the pocket\'s emoji and colour, and changing them updates the pocket everywhere', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await showPocket('Japan trip');
    await press('Edit Japan trip');

    expect(screen.getByLabelText('Emoji (optional)')).toHaveDisplayValue('✈️');
    expect(screen.getByRole('radio', { name: 'Pink' })).toBeSelected();
    await type('Emoji (optional)', '🚗');
    await choose('Green');
    await press('Save changes');

    expect(await rows('SELECT emoji, color FROM pocket')).toEqual([{ emoji: '🚗', color: 'green' }]);
    expect(within(screen.getByRole('button', { name: 'Space: Japan trip, change' })).getByText('🚗')).toBeOnTheScreen();
    expect(within(screen.getByRole('button', { name: 'Space: Japan trip, change' })).getByText('Japan trip')).toBeOnTheScreen();
  });

  it('Form: an emoji of more than 8 characters says "Use one emoji." and saves nothing', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);
    await type('Name', 'Car');
    await type('Emoji (optional)', '123456789');
    await press('Create pocket');

    expect(screen.getByText('Use one emoji.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/pocket-edit');
    expect(await rows('SELECT * FROM pocket')).toEqual([]);
  });

  it('Everywhere: the savings form and the expense form show "✈️ Japan trip" for a pocket named "Japan trip"', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan, car] });
    await press('Add expense');

    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeOnTheScreen();
    expect(within(screen.getByRole('radio', { name: 'Japan trip' })).getByText('✈️ Japan trip')).toBeOnTheScreen();
    await choose('Savings');
    expect(within(screen.getByRole('radio', { name: 'Japan trip' })).getByText('✈️ Japan trip')).toBeOnTheScreen();
    expect(within(screen.getByRole('radio', { name: 'Car' })).getByText('Car')).toBeOnTheScreen();
  });

  it('Everywhere: an expense paid from the pocket reads like any entry, without a "from" mark, in its pocket\'s list', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-04', kind: 'expense', amountCents: 3500, note: 'Dinner', pocketId: 1 }],
      pockets: [japan],
    });

    await showPocket('Japan trip');
    expect(within(screen.getByRole('button', { name: /Dinner/ })).getByText(partialText('35,00'))).toBeOnTheScreen();
    expect(screen.queryByText(partialText('from ✈️ Japan trip'))).not.toBeOnTheScreen();
  });

  it('Everywhere: the monthly entry form shows the emoji on the pocket choices', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      pockets: [japan],
      raw: ["INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month, pocket_id) VALUES (1, 'savings', 'other', 30000, 'Plan', 1, '2026-11', 1)"],
    });
    await press('My plan');
    await press(/^Plan, .*every month$/);

    expect(within(screen.getByRole('radio', { name: 'Japan trip' })).getByText('✈️ Japan trip')).toBeOnTheScreen();
  });

  it('Update: pockets made before this version open with their names and balances, no emoji and colours in turn', async () => {
    await startAppOnReleasedVersion(
      TODAY,
      9,
      `
      INSERT INTO pocket (id, name, starting_cents) VALUES (1, 'Rainy day', 5000);
      INSERT INTO pocket (id, name, starting_cents) VALUES (2, 'Bike', 0);
      INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-01', 'income', 400000, 'Pay', 'salary');
      INSERT INTO entry (date, kind, amount_cents, note, category, pocket_id) VALUES ('2026-11-02', 'savings', 2500, 'Coins', 'other', 2);
      `,
    );

    expect(await spaceRows()).toEqual([
      expect.stringMatching(/^Main/),
      expect.stringMatching(/^Rainy day, 50,00.€$/),
      expect.stringMatching(/^Bike, 25,00.€$/),
    ]);
    expect(await rows('SELECT emoji, color FROM pocket ORDER BY id')).toEqual([
      { emoji: '', color: 'blue' },
      { emoji: '', color: 'indigo' },
    ]);
    await showPocket('Bike');
    await press('Edit Bike');
    expect(screen.getByRole('radio', { name: 'Indigo' })).toBeSelected();
    expect(screen.getByLabelText('Emoji (optional)')).toHaveDisplayValue('');
  });
});
