import { screen, testRouter, within } from 'expo-router/testing-library';

import { seedDevice } from '../test-support/fake-sqlite';
import {
  answerDialog,
  choose,
  DISCARD_DIALOG,
  exactText,
  expectBalance,
  expectDialog,
  expectLeftToSpend,
  expectNoDialog,
  expectPocketBalance,
  headerTitles,
  openSpaces,
  partialText,
  pickSpace,
  press,
  reopenApp,
  savedPart,
  savingsBlock,
  showPocket,
  spaceRows,
  startApp,
  startAppOnReleasedVersion,
  type,
  typeNote,
} from '../test-support/app';
import { RELAX_TABLES } from '../test-support/damaged-data';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 12];
const DEC_4: [number, number, number] = [2026, 11, 4];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 400000, note: 'Pay' } as const;
const tile = (name: string) => within(screen.getByRole('button', { name }));
/** The balance of a pocket as the sheet of spaces shows it. */
const pocketRow = expectPocketBalance;
/** The pockets the sheet lists, as "<name>, <balance>", without "Main". */
const pocketsListed = async () => (await spaceRows()).filter((row) => !row.startsWith('Main'));
const pocketListed = async (name: string) => (await pocketsListed()).some((row) => row.startsWith(`${name}, `));
const totalInPockets = () => screen.getByText(/^In pockets/);
const radioNames = () => screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel as string);
/** Everything on the form after the three kinds. */
const choicesOnForm = () => radioNames().slice(3);

const rows = async (sql: string) => {
  let result: any[] = [];
  await seedDevice(async (db) => {
    result = await db.getAllAsync(sql);
  });
  return result;
};
const pocketsInDb = () => rows('SELECT name, starting_cents FROM pocket ORDER BY id');

/** Creates a pocket from the sheet of spaces; home then shows it. */
async function createPocket(name: string, amount?: string) {
  await openSpaces();
  await press(/New pocket$/);
  await type('Name', name);
  if (amount) await type('Amount', amount);
  await press('Create pocket');
}

describe('Create my pockets, with what I already have', () => {
  it('Opening: the "See pockets ›" link is gone from the Overview and the My pockets route no longer exists', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Car' }] });

    expect(screen.queryByText('See pockets ›')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'See my pockets' })).not.toBeOnTheScreen();
    expect(screen.getByText('Overview')).toBeOnTheScreen();
  });

  it('No income this month: the sheet still lists the pockets, and "Main" has no figure', async () => {
    await startApp({ today: TODAY, pockets: [{ name: 'Japan trip', startingCents: 150000 }] });
    expect(screen.queryByText('See pockets ›')).not.toBeOnTheScreen();

    expect(await spaceRows()).toEqual(['Main', expect.stringMatching(/^Japan trip, 1.500,00.€$/)]);
  });

  it('No pockets: the sheet lists only "Main", no "In pockets" line, and a "New pocket" button', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();

    expect(screen.getAllByRole('radio')).toHaveLength(1);
    expect(screen.queryByText(/^In pockets/)).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /New pocket$/ })).toBeOnTheScreen();
  });

  it('Create: "Japan trip" starting at 1 500,00 shows it on home, lists "Japan trip, 1 500,00 €" and "In pockets 1 500,00 €"', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);

    expect(screen).toHavePathname('/pocket-edit');
    expect(headerTitles().at(-1)).toBe('New pocket');
    await type('Name', 'Japan trip');
    await type('Amount', '1500,00');
    await press('Create pocket');

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
    expect(screen.getByText('Balance')).toBeOnTheScreen();
    await openSpaces();
    expect(screen.getByRole('radio', { name: exactText('Japan trip, 1 500,00 €') })).toBeOnTheScreen();
    expect(totalInPockets()).toHaveTextContent(/^In pockets.1.500,00.€$/);
  });

  it('No starting amount: the amount may be left empty and the pocket starts at 0,00 €', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await createPocket('Car');

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Car, change' })).toBeOnTheScreen();
    await pocketRow('Car', '0,00 €');
    expect(await pocketsInDb()).toEqual([{ name: 'Car', starting_cents: 0 }]);
  });

  it('Not this month\'s savings: the Savings tile, left to spend and the savings figure do not change', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary] });
    await expectLeftToSpend('3 000,00 €');
    expect(savingsBlock().getByText(savedPart('0 €'))).toBeOnTheScreen();
    expect(savingsBlock().getByText(partialText('of 1 000 €'))).toBeOnTheScreen();

    await createPocket('Japan trip', '1500');
    await pickSpace(/^Main/);

    expect(screen).toHavePathname('/');
    await expectLeftToSpend('3 000,00 €');
    expect(savingsBlock().getByText(savedPart('0 €'))).toBeOnTheScreen();
    expect(savingsBlock().getByText(partialText('of 1 000 €'))).toBeOnTheScreen();
  });

  it('Not this month\'s savings: Trends shows no savings for the starting amount', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary], pockets: [{ name: 'Japan trip', startingCents: 150000 }] });
    await press(/^See trends/);
    await choose('Saved');

    expect(screen.queryByText(partialText('1 500'))).not.toBeOnTheScreen();
    expect(screen.queryByText(partialText('1.500'))).not.toBeOnTheScreen();
  });

  it('Name required: an empty or blank name says "Give the pocket a name." and saves nothing', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);
    await type('Amount', '10');
    await press('Create pocket');

    expect(screen.getByText('Give the pocket a name.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/pocket-edit');

    await type('Name', '   ');
    await press('Create pocket');
    expect(screen.getByText('Give the pocket a name.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/pocket-edit');
    expect(await pocketsInDb()).toEqual([]);
  });

  it('Leaving: leaving the form with unsaved changes asks before discarding', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);
    await type('Name', 'Japan trip');

    await testRouter.back();
    expectDialog(DISCARD_DIALOG);
    await answerDialog('Keep editing');
    expectNoDialog();
    expect(screen).toHavePathname('/pocket-edit');

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(await pocketsInDb()).toEqual([]);
  });

  it('Leaving: an untouched form closes without asking', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);

    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/');
  });

  it('Two pockets with the same name are allowed and listed separately', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await createPocket('Trip', '100');
    await createPocket('Trip', '200');

    expect(await pocketsListed()).toEqual([expect.stringMatching(/^Trip, 100,00.€$/), expect.stringMatching(/^Trip, 200,00.€$/)]);
    await openSpaces();
    expect(totalInPockets()).toHaveTextContent(/300,00.€$/);
  });
});

describe('Save into a pocket', () => {
  const japan = { name: 'Japan trip', startingCents: 150000 };

  it('Choose a pocket: with Savings the form shows the pockets as radio buttons and a "New pocket" choice, not the savings categories', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan, { name: 'Car' }] });
    await press('Add expense');
    await choose('Savings');

    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Car' })).toBeOnTheScreen();
    expect(screen.getByText('New pocket')).toBeOnTheScreen();
    for (const category of ['Emergency fund', 'Investments', 'Travel', 'Goal', 'Other']) {
      expect(screen.queryByRole('radio', { name: category })).not.toBeOnTheScreen();
    }
    expect(choicesOnForm().slice(0, 2)).toEqual(['Japan trip', 'Car']);
  });

  it('Choose a pocket: income shows no pockets; an expense offers them as "Paid from" (026)', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await press('Add expense');
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Main' })).toBeSelected();
    await choose('Income');
    expect(screen.queryByRole('radio', { name: 'Japan trip' })).not.toBeOnTheScreen();
  });

  it('Saved: saving 200,00 € into "Japan trip" grows this month\'s savings by 200,00 € and the pocket shows 1 700,00 €', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary], pockets: [japan] });
    await press('Add expense');
    await choose('Savings');
    await choose('Japan trip');
    await type('Amount', '200');
    await press('Add to savings');

    expect(screen).toHavePathname('/');
    expect(savingsBlock().getByText(savedPart('200 €'))).toBeOnTheScreen();
    await expectLeftToSpend('3 000,00 €');
    await pocketRow('Japan trip', '1 700,00 €');
    await openSpaces();
    expect(totalInPockets()).toHaveTextContent(/1.700,00.€$/);
  });

  it('Pocket required: saving with no pocket chosen says "Pick a pocket." and saves nothing', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await press('Add expense');
    await choose('Savings');
    await type('Amount', '200');
    await press('Add to savings');

    expect(screen.getByText('Pick a pocket.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/entry');
    expect(await rows("SELECT * FROM entry WHERE kind = 'savings'")).toEqual([]);
  });

  it('Pocket required: once a pocket is picked the saving goes through', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await press('Add expense');
    await choose('Savings');
    await type('Amount', '200');
    await press('Add to savings');
    await choose('Japan trip');
    await press('Add to savings');

    expect(screen).toHavePathname('/');
    expect(await rows("SELECT amount_cents FROM entry WHERE kind = 'savings'")).toEqual([{ amount_cents: 20000 }]);
  });

  it('New pocket from the form: creating "Car" and coming back lists it among the choices and keeps what was typed', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await press('Add expense');
    await choose('Savings');
    await type('Amount', '75,50');
    await typeNote('Spare change');
    await press(/New pocket$/);

    expect(screen).toHavePathname('/pocket-edit');
    await type('Name', 'Car');
    await press('Create pocket');

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Car' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Savings' })).toBeSelected();
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('75,50');
    expect(screen.getByLabelText('Note (optional)')).toHaveDisplayValue('Spare change');

    await choose('Car');
    await press('Add to savings');
    await pocketRow('Car', '75,50 €');
  });

  it('Titles: a saving with no note is titled with its pocket in home and in Activity; a note wins', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      pockets: [japan, { name: 'Car' }],
      raw: [
        "INSERT INTO entry (date, kind, category, amount_cents, note, pocket_id) VALUES ('2026-11-02', 'savings', 'other', 10000, '', 1)",
        "INSERT INTO entry (date, kind, category, amount_cents, note, pocket_id) VALUES ('2026-11-03', 'savings', 'other', 20000, 'Bonus', 2)",
      ],
    });

    expect(screen.getByText('Japan trip')).toBeOnTheScreen();
    expect(screen.getByText('Bonus')).toBeOnTheScreen();
    expect(screen.queryByText('Car')).not.toBeOnTheScreen();
  });

  it('Titles: the pocket name is also the title in the Activity list', async () => {
    const entries = Array.from({ length: 6 }, (_, i) => ({
      date: `2026-11-0${i + 1}`,
      kind: 'expense' as const,
      amountCents: 100,
      note: `Buy ${i}`,
    }));
    await startApp({
      today: TODAY,
      entries: [salary, ...entries],
      pockets: [japan],
      raw: ["INSERT INTO entry (date, kind, category, amount_cents, note, pocket_id) VALUES ('2026-11-07', 'savings', 'other', 10000, '', 1)"],
    });
    await press(/^See all \d+ entries$/);

    expect(screen).toHavePathname('/activity');
    expect(screen.getByText('Japan trip')).toBeOnTheScreen();
  });

  it('Moving a saving: editing it into another pocket changes both balances', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-02', kind: 'savings', amountCents: 20000, note: 'Bonus', pocketId: 1 }],
      pockets: [japan, { name: 'Car', startingCents: 5000 }],
    });
    await pocketRow('Japan trip', '1 700,00 €');
    await pocketRow('Car', '50,00 €');

    await press(/Bonus/);
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
    await choose('Car');
    await press('Save changes');

    await pocketRow('Japan trip', '1 500,00 €');
    await pocketRow('Car', '250,00 €');
  });

  it('Moving a saving: a saving changed from savings to an expense leaves its pocket', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-02', kind: 'savings', amountCents: 20000, note: 'Oops', pocketId: 1 }],
      pockets: [japan],
    });
    await press(/Oops/);
    await choose('Expense');
    await press('Save changes');

    await pocketRow('Japan trip', '1 500,00 €');
  });

  it('Deleting a saving lowers its pocket\'s balance', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-02', kind: 'savings', amountCents: 20000, note: 'Bonus', pocketId: 1 }],
      pockets: [japan],
    });
    await press(/Bonus/);
    await press('Delete');
    await answerDialog('Delete');

    await pocketRow('Japan trip', '1 500,00 €');
  });

  it('The balance counts savings of every month', async () => {
    await startApp({
      today: TODAY,
      entries: [
        salary,
        { date: '2026-09-02', kind: 'savings', amountCents: 10000, note: 'Sep', pocketId: 1 },
        { date: '2026-10-02', kind: 'savings', amountCents: 20000, note: 'Oct', pocketId: 1 },
        { date: '2026-11-02', kind: 'savings', amountCents: 5, note: 'Nov', pocketId: 1 },
      ],
      pockets: [{ name: 'Car', startingCents: 1 }],
    });
    await pocketRow('Car', '300,06 €');
  });
});

describe('See and manage a pocket', () => {
  const withSaving = {
    today: TODAY,
    pockets: [{ name: 'Japan trip', startingCents: 150000 }, { name: 'Car' }],
    entries: [
      salary,
      { date: '2026-10-05', kind: 'savings', amountCents: 10000, note: 'Older', pocketId: 1 },
      { date: '2026-11-03', kind: 'savings', amountCents: 20000, note: 'Newer', pocketId: 1 },
      { date: '2026-11-04', kind: 'savings', amountCents: 999, note: 'Elsewhere', pocketId: 2 },
    ],
  } satisfies Parameters<typeof startApp>[0];

  async function openJapan() {
    await startApp(withSaving);
    await showPocket('Japan trip');
  }

  it('Pocket view: home shows the balance, "Started with", and its savings of every month newest first', async () => {
    await openJapan();

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Japan trip, change' })).toBeOnTheScreen();
    await expectBalance('1 800,00 €');
    expect(screen.getByText(partialText('Started with 1 500,00 €'))).toBeOnTheScreen();
    const notes = screen.getAllByText(/^(Older|Newer|Elsewhere)$/).map((n) => n.props.children);
    expect(notes).toEqual(['Newer', 'Older']);
  });

  it('Pocket view: a saving opens the entry form', async () => {
    await openJapan();
    await press(/Newer/);

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Savings' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
  });

  it('Pocket view: no "Started with" when the starting amount is 0', async () => {
    await startApp(withSaving);
    await showPocket('Car');

    expect(screen.queryByText(/Started with/)).not.toBeOnTheScreen();
    await expectBalance('9,99 €');
  });

  it('Pocket view: an empty pocket says "Nothing saved in or spent from this pocket yet."', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Car' }] });
    await showPocket('Car');

    expect(screen.getByText('Nothing saved in or spent from this pocket yet.')).toBeOnTheScreen();
  });

  it('Pocket view: a pocket id that does not exist shows the month', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await testRouter.navigate('/?space=999');

    expect(screen.queryByText('Balance')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Left to spend: /)).toBeOnTheScreen();
  });

  it('Edit: the form opens with the name and starting amount, and saving updates them everywhere', async () => {
    await openJapan();
    await press('Edit Japan trip');

    expect(screen).toHavePathname('/pocket-edit');
    expect(headerTitles().at(-1)).toBe('Edit pocket');
    expect(screen.getByLabelText('Name')).toHaveDisplayValue('Japan trip');
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('1500,00');

    await type('Name', 'Tokyo');
    await type('Amount', '1000');
    await press('Save changes');

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Tokyo, change' })).toBeOnTheScreen();
    await expectBalance('1 300,00 €');
    await pocketRow('Tokyo', '1 300,00 €');
    expect(await pocketListed('Japan trip')).toBe(false);
  });

  it('Edit: an empty name says "Give the pocket a name." and changes nothing', async () => {
    await openJapan();
    await press('Edit Japan trip');
    await type('Name', '');
    await press('Save changes');

    expect(screen.getByText('Give the pocket a name.')).toBeOnTheScreen();
    expect(await pocketsInDb()).toEqual([
      { name: 'Japan trip', starting_cents: 150000 },
      { name: 'Car', starting_cents: 0 },
    ]);
  });

  it('Delete an empty pocket: after confirming it is gone and home shows Main', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Car' }, { name: 'Boat' }] });
    await showPocket('Car');
    await press('Edit Car');
    await press('Delete pocket');

    expectDialog('Delete Car?');
    await answerDialog('Delete');

    expect(screen).toHavePathname('/');
    expect(screen.getByRole('button', { name: 'Space: Main, change' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Left to spend: /)).toBeOnTheScreen();
    expect(await pocketListed('Car')).toBe(false);
    await pocketRow('Boat', '0,00 €');
    expect(await pocketsInDb()).toEqual([{ name: 'Boat', starting_cents: 0 }]);
  });

  it('Delete an empty pocket: cancelling the dialog keeps it', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Car' }] });
    await showPocket('Car');
    await press('Edit Car');
    await press('Delete pocket');
    await answerDialog('Cancel');

    expectNoDialog();
    expect(await pocketsInDb()).toEqual([{ name: 'Car', starting_cents: 0 }]);
  });

  it('Cannot delete with savings: no delete button, the text explains and renaming is still possible', async () => {
    await openJapan();
    await press('Edit Japan trip');

    expect(screen.queryByRole('button', { name: 'Delete pocket' })).not.toBeOnTheScreen();
    expect(screen.getByText("A pocket with savings, spending or moves can't be deleted. You can rename it.")).toBeOnTheScreen();
    await type('Name', 'Tokyo');
    await press('Save changes');
    expect(screen.getByRole('button', { name: 'Space: Tokyo, change' })).toBeOnTheScreen();
  });

  it('A new pocket form has no delete button', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openSpaces();
    await press(/New pocket$/);
    expect(screen.queryByRole('button', { name: 'Delete pocket' })).not.toBeOnTheScreen();
  });

  it('Order: the sheet lists pockets in creation order, not by name or balance', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await createPocket('Zebra', '1');
    await createPocket('Apple', '1000');
    await createPocket('Mango', '50');

    const names = (await pocketsListed()).map((row) => row.split(',')[0]);
    expect(names).toEqual(['Zebra', 'Apple', 'Mango']);
  });
});

describe('My savings so far move into pockets', () => {
  const V8_DATA = `
    INSERT INTO plan_version VALUES ('2026-07', 20);
    INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-01', 'income', 400000, 'Pay', 'salary');
    INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-10-04', 'savings', 30000, 'Flights', 'travel');
    INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-02', 'savings', 10000, '', 'emergency_fund');
    INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-03', 'savings', 5000, 'Hotel', 'travel');
    INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-05', 'expense', 1250, 'Cinema', 'leisure');
    INSERT INTO recurring (kind, category, amount_cents, note, active, last_month) VALUES ('savings', 'investments', 20000, 'Fund', 1, '2026-11');
  `;

  it('Update: Emergency fund, Investments and Travel are listed in that order with every saving of the old category and no starting amount', async () => {
    await startAppOnReleasedVersion(TODAY, 8, V8_DATA);

    const listed = await pocketsListed();
    expect(listed.map((row) => row.split(',')[0])).toEqual(['Emergency fund', 'Investments', 'Travel']);
    await pocketRow('Emergency fund', '100,00 €');
    await pocketRow('Investments', '0,00 €');
    await pocketRow('Travel', '350,00 €');
    await openSpaces();
    expect(totalInPockets()).toHaveTextContent(/450,00.€$/);
    expect(await pocketsInDb()).toEqual([
      { name: 'Emergency fund', starting_cents: 0 },
      { name: 'Investments', starting_cents: 0 },
      { name: 'Travel', starting_cents: 0 },
    ]);
  });

  it('Update: the old monthly saving is not recorded next month (030)', async () => {
    await startAppOnReleasedVersion(TODAY, 8, V8_DATA);
    await reopenApp(DEC_4);

    await pocketRow('Investments', '0,00 €');
    await pocketRow('Emergency fund', '100,00 €');
  });

  it('Unused categories: Goal and Other become no pocket', async () => {
    await startAppOnReleasedVersion(TODAY, 8, V8_DATA);

    expect(await pocketListed('Goal')).toBe(false);
    expect(await pocketListed('Other')).toBe(false);
  });

  it('Nothing changes elsewhere: entries keep date, amount and note, and the month figures stay the same', async () => {
    await startAppOnReleasedVersion(TODAY, 8, V8_DATA);

    await expectLeftToSpend('3 187,50 €');
    expect(tile('Income').getByText(exactText('4 000 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('12,50 €'))).toBeOnTheScreen();
    expect(savingsBlock().getByText(savedPart('150 €'))).toBeOnTheScreen();
    expect(savingsBlock().getByText(partialText('of 800 €'))).toBeOnTheScreen();
    expect(screen.getByText('Hotel')).toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    // The saving with no note is titled with its new pocket.
    expect(screen.getByText('Emergency fund')).toBeOnTheScreen();
  });
});

describe('Edge cases', () => {
  it('Trends: with Savings selected there is the chart and goals, but no category list', async () => {
    await startApp({
      today: TODAY,
      plans: [[25, '2026-01']],
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 10000, note: 'x' }],
    });
    await press(/^See trends/);
    await choose('Saved');

    expect(screen.queryByText('By category')).not.toBeOnTheScreen();
    expect(screen.getByText(partialText('100,00 €'))).toBeOnTheScreen();
  });

  it('Accessibility: each pocket row of the sheet is a radio reading "<name>, <balance>"', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Japan trip', startingCents: 123456 }] });
    await openSpaces();

    expect(screen.getByRole('radio', { name: exactText('Japan trip, 1 234,56 €') })).toBeOnTheScreen();
  });

  it('Unreadable data: a saving with no pocket shows "Some of your data could not be read" on home', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      pockets: [{ name: 'Car' }],
      raw: [
        ...RELAX_TABLES,
        "INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-03', 'savings', 100, 'orphan', 'other')",
      ],
    });

    expect(screen.getByText(/some of your data could not be read/i)).toBeOnTheScreen();
  });
});
