import { screen, testRouter, within } from 'expo-router/testing-library';

import { seedDevice } from '../test-support/fake-sqlite';
import { answerDialog, choose, exactText, expectLeftToSpend, headerTitles, partialText, press, startApp, type, typeNote } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 12];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 400000, note: 'Pay' } as const;
const groceries = { date: '2026-11-03', kind: 'expense', amountCents: 10000, note: 'Shop', category: 'groceries' } as const;
const japan = { name: 'Japan trip', startingCents: 170000 };
const dinner = { date: '2026-11-05', kind: 'expense', amountCents: 3500, note: 'Dinner', category: 'eating_out', pocketId: 1 } as const;
const DINNER_LABEL = 'Dinner, Thu 5 Nov, 35,00 €, from Japan trip';
const DINNER_TODAY_LABEL = /^Dinner, .*35,00.€, from Japan trip$/;

const tile = (name: string) => within(screen.getByRole('button', { name }));
const pocketRow = (name: string, balance: string) => screen.getByRole('button', { name: exactText(`${name}, ${balance}`) });
const openPockets = () => press('See my pockets');
const labelOf = (re: RegExp) => screen.getByLabelText(re).props.accessibilityLabel as string;
const splitLabels = () =>
  screen
    .queryAllByLabelText(/: .*, \d+\s?%$/)
    .map((n) => (n.props.accessibilityLabel as string).split(':')[0]);
const rows = async (sql: string) => {
  let result: any[] = [];
  await seedDevice(async (db) => {
    result = await db.getAllAsync(sql);
  });
  return result;
};
const monthFigures = () => ({
  leftToSpend: labelOf(/^Left to spend/),
  pace: labelOf(/^Spending pace/),
});

describe('Pay a trip expense from its pocket', () => {
  it('From the pocket: "Spend from this pocket" opens the expense form with "Paid from" set to the pocket', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await openPockets();
    await press(exactText('Japan trip, 1 700,00 €'));
    await press('Spend from this pocket');

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('radio', { name: 'Expense' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'This month' })).not.toBeSelected();
  });

  it('Recorded: a dinner of 35,00 € in Eating out leaves "Japan trip" at 1 665,00 € and is listed on its screen', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await openPockets();
    await press(exactText('Japan trip, 1 700,00 €'));
    await press('Spend from this pocket');
    await type('Amount', '35');
    await choose('Eating out');
    await typeNote('Dinner');
    await press('Add expense');

    expect(screen).toHavePathname('/pocket');
    expect(screen.getByText('Balance')).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 665,00 €'))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: DINNER_TODAY_LABEL })).toBeOnTheScreen();
    expect(await rows("SELECT kind, amount_cents, category, pocket_id FROM entry WHERE kind = 'expense'")).toEqual([
      { kind: 'expense', amount_cents: 3500, category: 'eating_out', pocket_id: 1 },
    ]);
  });

  it('Not this month\'s spending: Spent, left to spend, the daily budget, the pace and the split are the same as before the dinner', async () => {
    const setup = { today: TODAY, plans: [[25, '2026-01']] as [number, string][], pockets: [japan] };
    await startApp({ ...setup, entries: [salary, groceries] });
    const before = monthFigures();
    const spentBefore = tile('Spent').getByText(exactText('100 €'));
    expect(spentBefore).toBeOnTheScreen();
    await press('Spent');
    const splitBefore = splitLabels();
    expect(splitBefore).toEqual(['Groceries']);

    await startApp({ ...setup, entries: [salary, groceries, dinner] });
    expect(monthFigures()).toEqual(before);
    expect(tile('Spent').getByText(exactText('100 €'))).toBeOnTheScreen();
    await press('Spent');
    expect(splitLabels()).toEqual(splitBefore);
    expect(screen.queryByLabelText(/^Eating out: /)).not.toBeOnTheScreen();
  });

  it('Not this month\'s spending: with only a pocket expense the month shows nothing spent and the full budget', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary, dinner], pockets: [japan] });
    await expectLeftToSpend('3 000,00 €');
    expect(tile('Spent').getByText(exactText('0 €'))).toBeOnTheScreen();
  });

  it('Not this month\'s spending: Trends does not count it', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary, dinner], pockets: [japan] });
    await press(/^See trends/);

    expect(screen.queryByText(partialText('35'))).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/35,00/)).not.toBeOnTheScreen();
  });

  it('Still in the month\'s lists: home and Activity show the dinner on its day, marked "from Japan trip"', async () => {
    const more = [1, 2, 3, 4].map((d) => ({ date: `2026-11-0${d}`, kind: 'expense', amountCents: 100, note: `Extra ${d}` }) as const);
    await startApp({ today: TODAY, entries: [salary, ...more, dinner], pockets: [japan] });

    expect(screen.getByRole('button', { name: DINNER_LABEL })).toBeOnTheScreen();
    expect(screen.getByText(partialText('from Japan trip'))).toBeOnTheScreen();

    await press('See all 6 entries');
    expect(headerTitles()).toContain('Activity · November 2026');
    expect(screen.getByRole('button', { name: DINNER_LABEL })).toBeOnTheScreen();
  });

  it('From the expense form: picking "Japan trip" under "Paid from" gives the same result', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary, groceries], pockets: [japan] });
    const before = monthFigures();
    await press('Add expense');
    await type('Amount', '35');
    await choose('Eating out');
    await typeNote('Dinner');
    await choose('Japan trip');
    await press('Add expense');

    expect(screen).toHavePathname('/');
    expect(monthFigures()).toEqual(before);
    expect(screen.getByRole('button', { name: DINNER_TODAY_LABEL })).toBeOnTheScreen();
    await openPockets();
    expect(pocketRow('Japan trip', '1 665,00 €')).toBeOnTheScreen();
  });

  it('Default: "Paid from" starts on "This month", and an expense paid from the month counts as before', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary], pockets: [japan] });
    await press('Add expense');
    expect(screen.getByRole('radio', { name: 'This month' })).toBeSelected();
    await type('Amount', '35');
    await press('Add expense');

    await expectLeftToSpend('2 965,00 €');
    expect(tile('Spent').getByText(exactText('35 €'))).toBeOnTheScreen();
    await openPockets();
    expect(pocketRow('Japan trip', '1 700,00 €')).toBeOnTheScreen();
    expect(await rows("SELECT pocket_id FROM entry WHERE kind = 'expense'")).toEqual([{ pocket_id: null }]);
  });

  it('Change later: switching "Paid from" between "This month" and a pocket moves the expense in the figures and the balance', async () => {
    await startApp({ today: TODAY, plans: [[25, '2026-01']], entries: [salary, { ...groceries, note: 'Shop', pocketId: null }], pockets: [japan] });
    await expectLeftToSpend('2 900,00 €');

    await press(/Shop/);
    expect(screen.getByRole('radio', { name: 'This month' })).toBeSelected();
    await choose('Japan trip');
    await press('Save changes');
    await expectLeftToSpend('3 000,00 €');
    await openPockets();
    expect(pocketRow('Japan trip', '1 600,00 €')).toBeOnTheScreen();
    await testRouter.back();

    await press(/Shop/);
    expect(screen.getByRole('radio', { name: 'Japan trip' })).toBeSelected();
    await choose('This month');
    await press('Save changes');
    await expectLeftToSpend('2 900,00 €');
    await openPockets();
    expect(pocketRow('Japan trip', '1 700,00 €')).toBeOnTheScreen();
  });

  it('No pockets: the expense form shows no "Paid from" choice', async () => {
    await startApp({ today: TODAY, entries: [salary] });
    await press('Add expense');

    expect(screen.queryByLabelText('Paid from')).not.toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'This month' })).not.toBeOnTheScreen();
  });

  it('Income is never paid from a pocket: the choice is not offered and switching kind resets it', async () => {
    await startApp({ today: TODAY, entries: [salary], pockets: [japan] });
    await press('Add expense');
    await choose('Japan trip');
    await choose('Income');
    expect(screen.queryByRole('radio', { name: 'This month' })).not.toBeOnTheScreen();

    await choose('Expense');
    expect(screen.getByRole('radio', { name: 'This month' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Japan trip' })).not.toBeSelected();
  });
});

describe('See what a pocket spent, and when it runs out', () => {
  const withSpending = {
    today: TODAY,
    plans: [[25, '2026-01']] as [number, string][],
    pockets: [japan],
    entries: [
      salary,
      { date: '2026-11-02', kind: 'savings', amountCents: 20000, note: 'Bonus', pocketId: 1 },
      { ...dinner, date: '2026-11-04' },
      { date: '2026-11-06', kind: 'expense', amountCents: 6500, note: 'Train', category: 'transport', pocketId: 1 },
      { date: '2026-11-07', kind: 'expense', amountCents: 1500, note: 'Snack', category: 'eating_out', pocketId: 1 },
    ],
  } satisfies Parameters<typeof startApp>[0];

  it('Balance: starting amount plus savings minus expenses: 1 700,00 + 200,00 - 35,00 - 65,00 - 15,00 = 1 785,00', async () => {
    await startApp(withSpending);
    await openPockets();
    expect(pocketRow('Japan trip', '1 785,00 €')).toBeOnTheScreen();
  });

  it('In and out: the screen shows "Saved 200,00 € · Spent 115,00 €" and lists savings and expenses together, newest first', async () => {
    await startApp(withSpending);
    await openPockets();
    await press(/^Japan trip/);

    expect(screen.getByText(partialText('Saved 200,00 € · Spent 115,00 €'))).toBeOnTheScreen();
    const notes = screen.getAllByText(/^(Bonus|Dinner|Train|Snack)$/).map((n) => n.props.children);
    expect(notes).toEqual(['Snack', 'Train', 'Dinner', 'Bonus']);
  });

  it('In and out: nothing spent shows no "Spent" text', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary, { date: '2026-11-02', kind: 'savings', amountCents: 20000, note: 'Bonus', pocketId: 1 }] });
    await openPockets();
    await press(/^Japan trip/);

    expect(screen.queryByText(/Spent/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Spent by category')).not.toBeOnTheScreen();
  });

  it('By category: "Spent by category" lists each category with amount and share, largest first', async () => {
    await startApp(withSpending);
    await openPockets();
    await press(/^Japan trip/);

    expect(screen.getByText('Spent by category')).toBeOnTheScreen();
    expect(splitLabels()).toEqual(['Transport', 'Eating out']);
    expect(screen.getByLabelText(/^Transport: 65,00.€, 57.%$/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Eating out: 50,00.€, 43.%$/)).toBeOnTheScreen();
  });

  it('Overspent: paying 150,00 € from "Car" holding 100,00 € is saved and shows "−50,00 €" with "This pocket is 50,00 € short."', async () => {
    await startApp({
      today: TODAY,
      pockets: [{ name: 'Car', startingCents: 10000 }],
      entries: [salary],
    });
    await openPockets();
    await press(/^Car/);
    await press('Spend from this pocket');
    await type('Amount', '150');
    await press('Add expense');

    expect(screen).toHavePathname('/pocket');
    expect(screen.getByText(/^[-−]50,00.€$/)).toBeOnTheScreen();
    expect(screen.getByText('This pocket is 50,00 € short.')).toBeOnTheScreen();
    expect(await rows('SELECT amount_cents, pocket_id FROM entry WHERE kind = \'expense\'')).toEqual([{ amount_cents: 15000, pocket_id: 1 }]);

    await testRouter.back();
    expect(screen.getByRole('button', { name: /^Car, [-−]50,00.€$/ })).toBeOnTheScreen();
  });

  it('Overspent: the balance is written as the currency formatter writes it, "-50,00 €"', async () => {
    await startApp({ today: TODAY, pockets: [{ name: 'Car', startingCents: 10000 }], entries: [salary, { date: '2026-11-04', kind: 'expense', amountCents: 15000, note: 'Repair', pocketId: 1 }] });
    await openPockets();
    expect(screen.getByRole('button', { name: exactText('Car, -50,00 €') })).toBeOnTheScreen();
    await press(/^Car/);
    expect(screen.getByText(exactText('-50,00 €'))).toBeOnTheScreen();
  });

  it('Overspent: a pocket in credit shows no "short" text', async () => {
    await startApp(withSpending);
    await openPockets();
    await press(/^Japan trip/);
    expect(screen.queryByText(/short\.$/)).not.toBeOnTheScreen();
  });

  it('Total: "Total saved" adds up the balances, negative ones included', async () => {
    await startApp({
      today: TODAY,
      pockets: [{ name: 'Car', startingCents: 10000 }, japan],
      entries: [salary, { date: '2026-11-04', kind: 'expense', amountCents: 15000, note: 'Repair', category: 'transport', pocketId: 1 }],
    });
    await openPockets();
    expect(screen.getByText('Total saved').parent).toHaveTextContent(/1.650,00.€$/);
  });
});

describe('Edge cases of spending from a pocket', () => {
  const rent = (pocket: string) =>
    `INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month, pocket_id) VALUES (1, 'expense', 'housing', 90000, 'Rent', 1, '2026-11', ${pocket});
     INSERT INTO entry (date, kind, category, amount_cents, note, recurring_id, pocket_id) VALUES ('2026-11-02', 'expense', 'housing', 90000, 'Rent', 1, ${pocket});`;
  const netflix = `INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month, pocket_id) VALUES (2, 'expense', 'subscriptions', 1299, 'Netflix', 1, '2026-11', NULL);
     INSERT INTO entry (date, kind, category, amount_cents, note, recurring_id, pocket_id) VALUES ('2026-11-03', 'expense', 'subscriptions', 1299, 'Netflix', 2, NULL);`;

  it('Monthly expenses from a pocket: My plan\'s "Fixed costs" leaves them out', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary], raw: [rent('1'), netflix] });
    await press('My plan');

    expect(screen.getByText(partialText('Fixed costs: 12,99 € a month'))).toBeOnTheScreen();
  });

  it('Monthly expenses from a pocket: the monthly entry form offers "Paid from" and keeps the choice', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary], raw: [rent('NULL')] });
    await press('My plan');
    await press(/Rent/);

    expect(screen.getByRole('radio', { name: 'This month' })).toBeSelected();
    await choose('Japan trip');
    await press(/^Save/);

    expect(await rows('SELECT pocket_id FROM recurring')).toEqual([{ pocket_id: 1 }]);
  });

  it('Monthly expenses from a pocket: next month\'s entry is paid from the pocket too', async () => {
    await startApp({ today: [2026, 11, 4], pockets: [japan], entries: [salary], raw: [rent('1')] });

    expect(await rows("SELECT date, pocket_id FROM entry WHERE recurring_id = 1 ORDER BY date")).toEqual([
      { date: '2026-11-02', pocket_id: 1 },
      { date: '2026-12-01', pocket_id: 1 },
    ]);
  });

  it('Quick add: expenses paid from a pocket are not suggested', async () => {
    const ramen = (date: string) => ({ date, kind: 'expense', amountCents: 900, note: 'Ramen', category: 'eating_out', pocketId: 1 }) as const;
    await startApp({ today: [2026, 10, 20], pockets: [japan], entries: [ramen('2026-11-03'), ramen('2026-11-10'), ramen('2026-11-18')] });
    await press('Add expense');

    expect(screen.queryByText('Often recorded')).not.toBeOnTheScreen();
  });

  it('Deleting a pocket: one with only an expense paid from it has no delete button and says why', async () => {
    await startApp({ today: TODAY, pockets: [{ name: 'Car' }], entries: [salary, { date: '2026-11-04', kind: 'expense', amountCents: 500, note: 'Fuel', pocketId: 1 }] });
    await openPockets();
    await press(/^Car/);
    await press('Edit Car');

    expect(screen.queryByRole('button', { name: 'Delete pocket' })).not.toBeOnTheScreen();
    expect(screen.getByText("A pocket with savings or spending can't be deleted. You can rename it.")).toBeOnTheScreen();
  });

  it('Deleting an expense paid from a pocket gives its money back to the pocket', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary, dinner] });
    await press(/Dinner/);
    await press('Delete');
    await answerDialog('Delete');

    await openPockets();
    expect(pocketRow('Japan trip', '1 700,00 €')).toBeOnTheScreen();
  });
});
