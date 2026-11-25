import { fireEvent, screen, testRouter, within } from 'expo-router/testing-library';

import { seedDevice } from '../test-support/fake-sqlite';
import {
  DISCARD_DIALOG,
  answerDialog,
  choose,
  exactText,
  expectDialog,
  expectLeftToSpend,
  expectNoDialog,
  headerTitles,
  partialText,
  press,
  reopenApp,
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
/** A pocket row on My pockets, by its accessible name "<name>, <balance>". */
const pocketRow = (name: string, balance: string) => screen.getByRole('button', { name: exactText(`${name}, ${balance}`) });
const queryPocketRow = (name: string) => screen.queryByRole('button', { name: new RegExp(`^${name}, `) });
const openPockets = () => press('See my pockets');
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

async function createPocket(name: string, amount?: string) {
  await press('New pocket');
  await type('Name', name);
  if (amount) await type('Amount', amount);
  await press('Create pocket');
}

describe('Create my pockets, with what I already have', () => {
  it('Opening: tapping "See pockets ›" next to the Overview title opens My pockets', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    expect(screen.getByText('See pockets ›')).toBeOnTheScreen();

    await openPockets();

    expect(screen).toHavePathname('/pockets');
    expect(headerTitles()).toContain('My pockets');
  });

  it('No income this month: home hides the Overview and the link, but My pockets still opens', async () => {
    await startApp({ today: TODAY, pockets: [{ name: 'Japan trip', startingCents: 150000 }] });
    expect(screen.queryByText('See pockets ›')).not.toBeOnTheScreen();

    await testRouter.navigate('/pockets');

    expect(screen.getByRole('button', { name: exactText('Japan trip, 1 500,00 €') })).toBeOnTheScreen();
  });

  it('No pockets: My pockets says "No pockets yet. Make one for each thing you save for." with a "New pocket" button', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openPockets();

    expect(screen.getByText('No pockets yet. Make one for each thing you save for.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'New pocket' })).toBeOnTheScreen();
  });

  it('Create: "Japan trip" starting at 1 500,00 lists "Japan trip 1 500,00 €" and the total "1 500,00 €"', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openPockets();
    await press('New pocket');

    expect(screen).toHavePathname('/pocket-edit');
    expect(headerTitles().at(-1)).toBe('New pocket');
    await type('Name', 'Japan trip');
    await type('Amount', '1500,00');
    await press('Create pocket');

    expect(screen).toHavePathname('/pockets');
    expect(pocketRow('Japan trip', '1 500,00 €')).toBeOnTheScreen();
    expect(screen.getByText('Total saved')).toBeOnTheScreen();
    expect(screen.getByText('Total saved').parent).toHaveTextContent(/Total saved.*1.500,00.€$/);
    expect(screen.queryByText('No pockets yet. Make one for each thing you save for.')).not.toBeOnTheScreen();
  });

  it('No starting amount: the amount may be left empty and the pocket starts at 0,00 €', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openPockets();
    await createPocket('Car');

    expect(screen).toHavePathname('/pockets');
    expect(pocketRow('Car', '0,00 €')).toBeOnTheScreen();
    expect(await pocketsInDb()).toEqual([{ name: 'Car', starting_cents: 0 }]);
  });

  it('Not this month\'s savings: the Savings tile, left to spend and the savings figure do not change', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary] });
    await expectLeftToSpend('3 000,00 €');
    expect(tile('Savings').getByText(exactText('0 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 1 000 €'))).toBeOnTheScreen();

    await openPockets();
    await createPocket('Japan trip', '1500');
    await testRouter.back();

    expect(screen).toHavePathname('/');
    await expectLeftToSpend('3 000,00 €');
    expect(tile('Savings').getByText(exactText('0 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 1 000 €'))).toBeOnTheScreen();
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
    await openPockets();
    await press('New pocket');
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
    await openPockets();
    await press('New pocket');
    await type('Name', 'Japan trip');

    await testRouter.back();
    expectDialog(DISCARD_DIALOG);
    await answerDialog('Keep editing');
    expectNoDialog();
    expect(screen).toHavePathname('/pocket-edit');

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen).toHavePathname('/pockets');
    expect(await pocketsInDb()).toEqual([]);
  });

  it('Leaving: an untouched form closes without asking', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openPockets();
    await press('New pocket');

    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/pockets');
  });

  it('Two pockets with the same name are allowed and listed separately', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openPockets();
    await createPocket('Trip', '100');
    await createPocket('Trip', '200');

    expect(screen.getAllByRole('button', { name: /^Trip, / })).toHaveLength(2);
    expect(screen.getByText('Total saved').parent).toHaveTextContent(/300,00.€$/);
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
    expect(screen.getByRole('radio', { name: 'This month' })).toBeSelected();
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
    expect(tile('Savings').getByText(exactText('200 €'))).toBeOnTheScreen();
    await expectLeftToSpend('3 000,00 €');
    await openPockets();
    expect(pocketRow('Japan trip', '1 700,00 €')).toBeOnTheScreen();
    expect(screen.getByText('Total saved').parent).toHaveTextContent(/1.700,00.€$/);
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
    await press('New pocket');

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
    await openPockets();
    expect(pocketRow('Car', '75,50 €')).toBeOnTheScreen();
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

    await press('Savings');
    expect(screen.getByText('Japan trip')).toBeOnTheScreen();
    expect(screen.queryByText('Bonus')).toBeOnTheScreen();
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
    await openPockets();
    expect(pocketRow('Japan trip', '1 700,00 €')).toBeOnTheScreen();
    expect(pocketRow('Car', '50,00 €')).toBeOnTheScreen();
    await testRouter.back();

    await press(/Bonus/);
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
    await choose('Car');
    await press('Save changes');

    await openPockets();
    expect(pocketRow('Japan trip', '1 500,00 €')).toBeOnTheScreen();
    expect(pocketRow('Car', '250,00 €')).toBeOnTheScreen();
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

    await openPockets();
    expect(pocketRow('Japan trip', '1 500,00 €')).toBeOnTheScreen();
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

    await openPockets();
    expect(pocketRow('Japan trip', '1 500,00 €')).toBeOnTheScreen();
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
    await openPockets();
    expect(pocketRow('Car', '300,06 €')).toBeOnTheScreen();
  });

  describe('Monthly savings', () => {
    const monthly = (pocketId: number) =>
      `INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month, pocket_id) VALUES (1, 'savings', 'other', 30000, 'Plan', 1, '2026-11', ${pocketId})`;

    it('a saving that repeats records into the same pocket each month', async () => {
      await startApp({ today: TODAY, entries: [salary], pockets: [japan], raw: [monthly(1)] });
      await reopenApp(DEC_4);
      await testRouter.navigate('/pockets');

      expect(pocketRow('Japan trip', '1 800,00 €')).toBeOnTheScreen();
    });

    it('marking a new saving to repeat keeps its pocket for next month', async () => {
      await startApp({ today: TODAY, entries: [salary], pockets: [japan, { name: 'Car' }] });
      await press('Add expense');
      await choose('Savings');
      await choose('Car');
      await type('Amount', '40');
      await typeNote('Monthly car');
      await fireEvent(screen.getByRole('switch', { name: 'Repeat every month' }), 'valueChange', true);
      await press('Add to savings');

      await reopenApp(DEC_4);
      await testRouter.navigate('/pockets');
      expect(pocketRow('Car', '80,00 €')).toBeOnTheScreen();
      expect(pocketRow('Japan trip', '1 500,00 €')).toBeOnTheScreen();
    });

    it('the monthly entry form shows the pocket choices and lets the user change the pocket', async () => {
      await startApp({ today: TODAY, entries: [salary], pockets: [japan, { name: 'Car' }], raw: [monthly(1)] });
      await press('My plan');
      await press(/^Plan, .*every month$/);

      expect(screen).toHavePathname('/recurring');
      expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
      expect(screen.getByRole('radio', { name: 'Car' })).not.toBeSelected();
      expect(screen.queryByRole('radio', { name: 'Emergency fund' })).not.toBeOnTheScreen();

      await choose('Car');
      await press('Save changes');

      await reopenApp(DEC_4);
      await testRouter.navigate('/pockets');
      expect(pocketRow('Car', '300,00 €')).toBeOnTheScreen();
      expect(pocketRow('Japan trip', '1 500,00 €')).toBeOnTheScreen();
    });
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
    await openPockets();
    await press(exactText('Japan trip, 1 800,00 €'));
  }

  it('Pocket screen: titled with the pocket name, shows balance, "Started with", and its savings newest first', async () => {
    await openJapan();

    expect(screen).toHavePathname('/pocket');
    expect(headerTitles().at(-1)).toBe('Japan trip');
    expect(screen.getByText('Balance')).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 800,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(partialText('Started with 1 500,00 €'))).toBeOnTheScreen();
    const notes = screen.getAllByText(/^(Older|Newer|Elsewhere)$/).map((n) => n.props.children);
    expect(notes).toEqual(['Newer', 'Older']);
  });

  it('Pocket screen: a saving opens the entry form', async () => {
    await openJapan();
    await press(/Newer/);

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Savings' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
  });

  it('Pocket screen: no "Started with" when the starting amount is 0', async () => {
    await startApp(withSaving);
    await openPockets();
    await press(exactText('Car, 9,99 €'));

    expect(screen.queryByText(/Started with/)).not.toBeOnTheScreen();
    expect(screen.getAllByText(exactText('9,99 €')).length).toBeGreaterThan(0);
  });

  it('Pocket screen: an empty pocket says "Nothing saved in this pocket yet."', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Car' }] });
    await openPockets();
    await press(exactText('Car, 0,00 €'));

    expect(screen.getByText('Nothing saved in this pocket yet.')).toBeOnTheScreen();
  });

  it('Pocket screen: a pocket that was not found does not crash', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await testRouter.navigate('/pocket?id=999');
    expect(screen.queryByText('Balance')).not.toBeOnTheScreen();
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

    expect(headerTitles().at(-1)).toBe('Tokyo');
    expect(screen.getByText(exactText('1 300,00 €'))).toBeOnTheScreen();
    await testRouter.back();
    expect(pocketRow('Tokyo', '1 300,00 €')).toBeOnTheScreen();
    expect(queryPocketRow('Japan trip')).not.toBeOnTheScreen();
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

  it('Delete an empty pocket: after confirming it is gone', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Car' }, { name: 'Boat' }] });
    await openPockets();
    await press(exactText('Car, 0,00 €'));
    await press('Edit Car');
    await press('Delete pocket');

    expectDialog('Delete Car?');
    await answerDialog('Delete');

    await testRouter.navigate('/pockets');
    expect(queryPocketRow('Car')).not.toBeOnTheScreen();
    expect(pocketRow('Boat', '0,00 €')).toBeOnTheScreen();
    expect(await pocketsInDb()).toEqual([{ name: 'Boat', starting_cents: 0 }]);
  });

  it('Delete an empty pocket: cancelling the dialog keeps it', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Car' }] });
    await openPockets();
    await press(exactText('Car, 0,00 €'));
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
    expect(screen.getByText("A pocket with savings or spending can't be deleted. You can rename it.")).toBeOnTheScreen();
    await type('Name', 'Tokyo');
    await press('Save changes');
    expect(headerTitles().at(-1)).toBe('Tokyo');
  });

  it('Cannot delete with a monthly saving even without savings', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      pockets: [{ name: 'Car' }],
      raw: ["INSERT INTO recurring (kind, category, amount_cents, note, active, last_month, pocket_id) VALUES ('savings', 'other', 500, 'x', 1, '2026-11', 1)"],
    });
    await openPockets();
    await press(exactText('Car, 0,00 €'));
    await press('Edit Car');

    expect(screen.queryByRole('button', { name: 'Delete pocket' })).not.toBeOnTheScreen();
    expect(screen.getByText("A pocket with savings or spending can't be deleted. You can rename it.")).toBeOnTheScreen();
  });

  it('A new pocket form has no delete button', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openPockets();
    await press('New pocket');
    expect(screen.queryByRole('button', { name: 'Delete pocket' })).not.toBeOnTheScreen();
  });

  it('Order: My pockets lists pockets in creation order, not by name or balance', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await openPockets();
    await createPocket('Zebra', '1');
    await createPocket('Apple', '1000');
    await createPocket('Mango', '50');

    const names = screen.getAllByRole('button', { name: /, \d/ }).map((b) => b.props.accessibilityLabel.split(',')[0]);
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
    await openPockets();

    const names = screen.getAllByRole('button', { name: /, \d/ }).map((b) => b.props.accessibilityLabel.split(',')[0]);
    expect(names).toEqual(['Emergency fund', 'Investments', 'Travel']);
    expect(pocketRow('Emergency fund', '100,00 €')).toBeOnTheScreen();
    expect(pocketRow('Investments', '0,00 €')).toBeOnTheScreen();
    expect(pocketRow('Travel', '350,00 €')).toBeOnTheScreen();
    expect(screen.getByText('Total saved').parent).toHaveTextContent(/450,00.€$/);
    expect(await pocketsInDb()).toEqual([
      { name: 'Emergency fund', starting_cents: 0 },
      { name: 'Investments', starting_cents: 0 },
      { name: 'Travel', starting_cents: 0 },
    ]);
  });

  it('Update: the monthly saving records into its category\'s pocket next month', async () => {
    await startAppOnReleasedVersion(TODAY, 8, V8_DATA);
    await reopenApp(DEC_4);
    await testRouter.navigate('/pockets');

    expect(pocketRow('Investments', '200,00 €')).toBeOnTheScreen();
  });

  it('Unused categories: Goal and Other become no pocket', async () => {
    await startAppOnReleasedVersion(TODAY, 8, V8_DATA);
    await openPockets();

    expect(queryPocketRow('Goal')).not.toBeOnTheScreen();
    expect(queryPocketRow('Other')).not.toBeOnTheScreen();
  });

  it('Nothing changes elsewhere: entries keep date, amount and note, and the month figures stay the same', async () => {
    await startAppOnReleasedVersion(TODAY, 8, V8_DATA);

    await expectLeftToSpend('3 187,50 €');
    expect(tile('Income').getByText(exactText('4 000 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('12,50 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('150 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 800 €'))).toBeOnTheScreen();
    expect(screen.getByText('Hotel')).toBeOnTheScreen();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    // The saving with no note is titled with its new pocket.
    expect(screen.getByText('Emergency fund')).toBeOnTheScreen();
  });
});

describe('Edge cases', () => {
  it('Home\'s savings split: with the Savings tile selected there is no "By category" split', async () => {
    await startApp({
      today: TODAY,
      entries: [salary, { date: '2026-11-03', kind: 'savings', amountCents: 10000, note: 'x' }],
    });
    await press('Savings');

    expect(screen.queryByText('By category')).not.toBeOnTheScreen();
    expect(screen.getByText('x')).toBeOnTheScreen();
  });

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

  it('Accessibility: each pocket row is a button reading "<name>, <balance>"', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [{ name: 'Japan trip', startingCents: 123456 }] });
    await openPockets();

    expect(screen.getByRole('button', { name: exactText('Japan trip, 1 234,56 €') })).toBeOnTheScreen();
  });

  it('Unreadable data: My pockets shows "Some of your data could not be read" and changes nothing', async () => {
    await startApp({
      today: TODAY,
      entries: [salary],
      pockets: [{ name: 'Car' }],
      raw: [
        ...RELAX_TABLES,
        "INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-03', 'savings', 100, 'orphan', 'other')",
      ],
    });
    await testRouter.navigate('/pockets');

    expect(screen.getByText(/some of your data could not be read/i)).toBeOnTheScreen();
  });
});
