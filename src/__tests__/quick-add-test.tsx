import { fireEvent, screen, testRouter } from 'expo-router/testing-library';

import { answerDialog, choose, expectDialog, press, startApp, type } from '../test-support/app';
import { seedDevice } from '../test-support/fake-sqlite';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => jest.useRealTimers());

const NOV_20: [number, number, number] = [2026, 10, 20];

const cafe = (date: string) => ({ date, kind: 'expense', amountCents: 250, note: 'Café', category: 'eating_out' }) as const;
const CAFES = [cafe('2026-11-03'), cafe('2026-11-10'), cafe('2026-11-18')];
const FILL_CAFE = 'Fill with Café, Eating out, 2,50 €';

const suggestion = (name: string | RegExp) => screen.queryByRole('button', { name });
const fillButtons = () => screen.queryAllByRole('button', { name: /^Fill with / });
const savedEntries = async () => {
  let rows: any[] = [];
  await seedDevice(async (db) => {
    rows = await db.getAllAsync('SELECT date, kind, category, amount_cents, note, recurring_id FROM entry ORDER BY id');
  });
  return rows;
};
const amountField = () => screen.getByLabelText('Amount');
const noteField = () => screen.getByLabelText('Note (optional)');

describe('US1 Fill a new expense from one I often record', () => {
  it('Shown: with Café 2,50 € on 3, 10 and 18 November, adding an expense shows a "Recent" row with the suggestion', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await press('Add expense');

    expect(screen.getByText('Recent')).toBeOnTheScreen();
    expect(suggestion(FILL_CAFE)).toBeOnTheScreen();
    expect(screen.getByText(/Café · 2,50/)).toBeOnTheScreen();
  });

  it('Fill: tapping it sets amount, category and note; kind, date and the repeat switch keep their values', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await press('Add expense');
    expect(screen.getByText(/Fri 20 Nov/)).toBeOnTheScreen();
    await type('Amount', '99');
    await choose('Transport');
    await type('Note (optional)', 'Bus');
    await press(FILL_CAFE);

    expect(amountField().props.value).toMatch(/^2[,.]50$/);
    expect(screen.getByRole('radio', { name: 'Eating out' })).toBeSelected();
    expect(noteField().props.value).toBe('Café');
    expect(screen.getByRole('radio', { name: 'Expense' })).toBeSelected();
    expect(screen.getByText(/Fri 20 Nov/)).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Repeat every month' })).not.toBeChecked();
  });

  it('Fill: keeps the repeat switch on when it was on', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await press('Add expense');
    const control = screen.getByRole('switch', { name: 'Repeat every month' });
    await fireEvent(control, 'valueChange', true);
    await press(FILL_CAFE);

    expect(screen.getByRole('switch', { name: 'Repeat every month' })).toBeChecked();
  });

  it('Nothing saved by the tap: nothing is recorded until the add button, then an ordinary expense with the form date', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await press('Add expense');
    await press(FILL_CAFE);
    expect(await savedEntries()).toHaveLength(3);
    expect(screen).toHavePathname('/entry');

    await press('Add expense');
    const rows = await savedEntries();
    expect(rows).toHaveLength(4);
    expect(rows[3]).toMatchObject({ date: '2026-11-20', kind: 'expense', category: 'eating_out', amount_cents: 250, note: 'Café', recurring_id: null });
    expect(screen).toHavePathname('/');
  });

  it('Still editable: changing the amount to 3,00 after the fill records 3,00 €', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await press('Add expense');
    await press(FILL_CAFE);
    await type('Amount', '3,00');
    await press('Add expense');

    const rows = await savedEntries();
    expect(rows[3]).toMatchObject({ amount_cents: 300, category: 'eating_out', note: 'Café' });
  });

  it('Overwrites the three fields: typed amount, category and note are replaced by the suggestion', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await press('Add expense');
    await type('Amount', '77');
    await choose('Health');
    await type('Note (optional)', 'Pharmacy');
    await press(FILL_CAFE);
    await press('Add expense');

    const rows = await savedEntries();
    expect(rows[3]).toMatchObject({ amount_cents: 250, category: 'eating_out', note: 'Café' });
  });

  it('Leaving: after a fill, going back asks before discarding, and discarding records nothing', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await press('Add expense');
    await press(FILL_CAFE);
    await testRouter.back();

    expectDialog('Discard changes?');
    await answerDialog('Discard');
    expect(screen).toHavePathname('/');
    expect(await savedEntries()).toHaveLength(3);
  });

  it('Past month: adding an expense in October from the month view shows the same suggestions and keeps the October date', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await press(/^Month:/);
    await press('Oct');
    await press('Add expense');
    expect(suggestion(FILL_CAFE)).toBeOnTheScreen();
    await press(FILL_CAFE);
    await press('Add expense');

    const rows = await savedEntries();
    expect(rows).toHaveLength(4);
    expect(rows[3].date).toMatch(/^2026-10-/);
    expect(rows[3]).toMatchObject({ amount_cents: 250, note: 'Café' });
  });
});

describe('US2 Which suggestions show (form)', () => {
  it('Same thing: Café 2,50 € and Café 3,00 € are two suggestions', async () => {
    const dear = (date: string) => ({ ...cafe(date), amountCents: 300 });
    await startApp({ today: NOV_20, entries: [...CAFES, dear('2026-11-04'), dear('2026-11-05')] });
    await press('Add expense');

    expect(suggestion(FILL_CAFE)).toBeOnTheScreen();
    expect(suggestion('Fill with Café, Eating out, 3,00 €')).toBeOnTheScreen();
  });

  it('At least twice: an expense recorded once is not suggested', async () => {
    await startApp({
      today: NOV_20,
      entries: [...CAFES, { date: '2026-11-12', kind: 'expense', amountCents: 1200, note: 'Cinema', category: 'leisure' }],
    });
    await press('Add expense');

    expect(suggestion(/Cinema/)).not.toBeOnTheScreen();
    expect(fillButtons()).toHaveLength(1);
  });

  it('Last 60 days: an expense from 22 September (59 days before today) counts', async () => {
    await startApp({ today: NOV_20, entries: [cafe('2026-09-22'), cafe('2026-11-01')] });
    await press('Add expense');
    expect(suggestion(FILL_CAFE)).toBeOnTheScreen();
  });

  it('Last 60 days: an expense from 21 September does not count', async () => {
    await startApp({ today: NOV_20, entries: [cafe('2026-09-21'), cafe('2026-11-01')] });
    await press('Add expense');
    expect(screen.queryByText('Recent')).not.toBeOnTheScreen();
  });

  it('Order and count: most recorded first, at most 4 show', async () => {
    const e = (note: string, cents: number, date: string) => ({ date, kind: 'expense', amountCents: cents, note, category: 'other' }) as const;
    await startApp({
      today: NOV_20,
      entries: [
        e('Alpha', 100, '2026-11-01'), e('Alpha', 100, '2026-11-02'),
        e('Bravo', 200, '2026-11-03'), e('Bravo', 200, '2026-11-04'),
        e('Charlie', 300, '2026-11-05'), e('Charlie', 300, '2026-11-06'),
        e('Delta', 400, '2026-11-07'), e('Delta', 400, '2026-11-08'),
        e('Echo', 500, '2026-10-07'), e('Echo', 500, '2026-10-08'),
        e('Top', 600, '2026-10-01'), e('Top', 600, '2026-10-02'), e('Top', 600, '2026-10-03'),
      ],
    });
    await press('Add expense');

    const names = fillButtons().map((b) => b.props['aria-label'] ?? b.props.accessibilityLabel);
    expect(names).toHaveLength(4);
    expect(names[0]).toMatch(/^Fill with Top, /);
    expect(names[1]).toMatch(/^Fill with Delta, /);
    expect(names.join('|')).not.toMatch(/Echo/);
  });

  it('Repeats left out: entries recorded by a monthly repeat are not suggested', async () => {
    const item = "INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month) VALUES (1, 'expense', 'housing', 90000, 'Rent', 1, '2026-11');";
    const linked = (date: string) =>
      `INSERT INTO entry (date, kind, category, amount_cents, note, recurring_id) VALUES ('${date}', 'expense', 'housing', 90000, 'Rent', 1);`;
    await startApp({ today: NOV_20, raw: [item, linked('2026-11-02'), linked('2026-10-02')] });
    await press('Add expense');

    expect(screen.queryByText('Recent')).not.toBeOnTheScreen();
  });

  it('Expenses only: income and savings entries are not suggested, and switching kind hides and restores the row', async () => {
    const income = (date: string) => ({ date, kind: 'income', amountCents: 5000, note: 'Gift', category: 'other' }) as const;
    await startApp({ today: NOV_20, entries: [...CAFES, income('2026-11-02'), income('2026-11-03')] });
    await press('Add expense');
    expect(fillButtons()).toHaveLength(1);

    await choose('Income');
    expect(screen.queryByText('Recent')).not.toBeOnTheScreen();
    expect(fillButtons()).toHaveLength(0);
    await choose('Savings');
    expect(screen.queryByText('Recent')).not.toBeOnTheScreen();
    expect(fillButtons()).toHaveLength(0);
    await choose('Expense');
    expect(screen.getByText('Recent')).toBeOnTheScreen();
    expect(suggestion(FILL_CAFE)).toBeOnTheScreen();
  });

  it('Expenses only: two income or savings entries alone give no row', async () => {
    const sav = (date: string) => ({ date, kind: 'savings', amountCents: 5000, note: 'Piggy', category: 'other' }) as const;
    await startApp({ today: NOV_20, entries: [sav('2026-11-02'), sav('2026-11-03')] });
    await press('Add expense');
    expect(screen.queryByText('Recent')).not.toBeOnTheScreen();
  });

  it('No note: a suggestion without a note reads the category name, or "Expense" for Other', async () => {
    const e = (cat: string, cents: number, date: string) => ({ date, kind: 'expense', amountCents: cents, note: '', category: cat }) as any;
    await startApp({
      today: NOV_20,
      entries: [e('groceries', 4000, '2026-11-02'), e('groceries', 4000, '2026-11-03'), e('other', 700, '2026-11-04'), e('other', 700, '2026-11-05')],
    });
    await press('Add expense');

    expect(suggestion('Fill with Groceries, Groceries, 40,00 €')).toBeOnTheScreen();
    expect(suggestion('Fill with Expense, Other, 7,00 €')).toBeOnTheScreen();
  });

  it('Nothing to suggest: with no repeated expense the row and its title are not shown', async () => {
    await startApp({ today: NOV_20, entries: [cafe('2026-11-03')] });
    await press('Add expense');

    expect(screen.queryByText('Recent')).not.toBeOnTheScreen();
    expect(fillButtons()).toHaveLength(0);
  });

  it('Editing: opening an existing entry shows no suggestions', async () => {
    await startApp({ today: NOV_20, entries: CAFES });
    await fireEvent.press(screen.getAllByRole('button', { name: /Café/ })[0]);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeOnTheScreen();
    expect(screen.queryByText('Recent')).not.toBeOnTheScreen();
    expect(fillButtons()).toHaveLength(0);
  });
});
