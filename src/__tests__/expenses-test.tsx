import { Alert } from 'react-native';
import { fireEvent, screen, testRouter, within } from 'expo-router/testing-library';

import {
  DELETE_DIALOG,
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
  startApp,
  type,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

const alertSpy = jest.spyOn(Alert, 'alert');

afterEach(() => {
  alertSpy.mockClear();
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 7];
const salary = { date: '2026-11-01', bucket: 'income', amountCents: 200000, note: 'Salary' } as const;
const cinema = { date: '2026-11-05', bucket: 'expense', amountCents: 1250, note: 'Cinema' } as const;
const tile = (name: string) => within(screen.getByRole('button', { name }));

describe('Record an expense', () => {
  it('Add an expense: 12,50 € with the note "Cinema" and today\'s date appears in the list and counts as spending', async () => {
    await startApp({ today: TODAY, expenses: [salary] });
    expect(tile('Spent').getByText(exactText('0 €'))).toBeOnTheScreen();

    await press('Add expense');
    expect(screen).toHavePathname('/expense');
    expect(screen.getByText(/Today/)).toBeOnTheScreen();
    await type('Amount', '12,50');
    await type('Note (optional)', 'Cinema');
    await press('Add expense');

    expect(screen).toHavePathname('/');
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    expect(screen.getAllByText(exactText('12,50 €'))).toHaveLength(2);
    expect(tile('Spent').getByText(exactText('12,50 €'))).toBeOnTheScreen();
    expectLeftToSpend('1 587,50 €');
  });

  it.each([
    ['zero', '0'],
    ['negative', '-5'],
  ])('Invalid amount (%s): it is not saved and the form says it must be greater than zero', async (_label, amount) => {
    await startApp({ today: TODAY, expenses: [salary] });
    await press('Add expense');
    await type('Amount', '5');
    await type('Amount', amount);

    expect(screen.getByText(/greater than 0/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled();
    await press('Add expense');
    expect(screen).toHavePathname('/expense');

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen.queryByText(exactText('0,00 €'))).not.toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('0 €'))).toBeOnTheScreen();
  });

  it('Empty amount: the save action is disabled', async () => {
    await startApp({ today: TODAY, expenses: [salary] });
    await press('Add expense');
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled();

    await type('Amount', '5');
    await type('Amount', '');
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled();

    await testRouter.back();
    expect(screen).toHavePathname('/');
  });
});

describe('Three kinds of entry', () => {
  it('The form chooses: Income, Savings or Expense, and nothing else', async () => {
    await startApp({ today: TODAY, expenses: [salary] });
    await press('Add expense');

    expect(screen.getAllByRole('radio').map((radio) => radio.props.accessibilityLabel)).toEqual(['Income', 'Savings', 'Expense']);
  });

  it('The submit button follows the kind chosen', async () => {
    await startApp({ today: TODAY, expenses: [salary] });
    await press('Add expense');
    await type('Amount', '5');

    await choose('Savings');
    expect(screen.getByRole('button', { name: 'Add to savings' })).toBeOnTheScreen();
    await choose('Income');
    expect(screen.getByRole('button', { name: 'Add income' })).toBeOnTheScreen();
    await choose('Expense');
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeOnTheScreen();
  });

  it('One entry of each kind is recorded and listed in Activity under its own kind of figure', async () => {
    await startApp({ today: TODAY });
    for (const [kind, amount, note, button] of [
      ['Income', '2000', 'Pay', 'Add income'],
      ['Savings', '150', 'Piggy bank', 'Add to savings'],
      ['Expense', '900', 'Rent', 'Add expense'],
    ] as const) {
      await press('Add expense');
      await choose(kind);
      await type('Amount', amount);
      await type('Note (optional)', note);
      await press(button);
    }

    expect(screen.getByText('Pay')).toBeOnTheScreen();
    expect(screen.getByText('Piggy bank')).toBeOnTheScreen();
    expect(screen.getByText('Rent')).toBeOnTheScreen();
    expect(tile('Income').getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('150 €'))).toBeOnTheScreen();
    expect(tile('Spent').getByText(exactText('900 €'))).toBeOnTheScreen();
  });
});

describe('Entry screen', () => {
  it.each([
    ['Income', 'Add income'],
    ['Savings', 'Add to savings'],
    ['Expense', 'Add expense'],
  ])('When adding, the title is the same as the button: %s gives "%s"', async (kind, label) => {
    await startApp({ today: TODAY, expenses: [salary] });
    await press('Add expense');
    await choose(kind);

    expect(headerTitles().at(-1)).toBe(label);
    expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
  });

  it('An entry that no longer exists says so', async () => {
    await startApp({ today: TODAY, expenses: [salary] });
    await testRouter.navigate('/expense?id=999');

    expect(screen.getByText('This entry no longer exists.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeOnTheScreen();
  });
});

describe('Savings entries count towards the savings goal', () => {
  it('Saving after payday: with a goal of 900,00 € (30 % of 3000,00 €), saving 600,00 € shows 600 € of 900 €', async () => {
    await startApp({
      today: TODAY,
      plans: [[30, '2026-07']],
      expenses: [{ ...salary, amountCents: 300000 }],
    });
    expect(tile('Savings').getByText(exactText('of 900 €'))).toBeOnTheScreen();

    await press('Add expense');
    await choose('Savings');
    await type('Amount', '600');
    await press('Add to savings');

    expect(tile('Savings').getByText(exactText('600 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('of 900 €'))).toBeOnTheScreen();
  });
});

describe('Edit and delete an expense', () => {
  it('Correct an amount: 12,50 € becomes 15,00 € in the list and in the month spending', async () => {
    await startApp({ today: TODAY, expenses: [salary, cinema] });
    await press(/Cinema/);
    expect(screen).toHavePathname('/expense');
    await type('Amount', '15,00');
    await press('Save changes');

    expect(screen.getByText(exactText('15,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText(exactText('12,50 €'))).not.toBeOnTheScreen();
    expectLeftToSpend('1 585,00 €');
  });

  it('Delete an expense: after confirming it disappears and no longer counts', async () => {
    await startApp({ today: TODAY, expenses: [salary, cinema] });
    await press(/Cinema/);
    await press('Delete');
    await answerDialog('Delete');

    expect(screen).toHavePathname('/');
    expect(screen.queryByText('Cinema')).not.toBeOnTheScreen();
    expectLeftToSpend('1 600,00 €');
  });

  it('Deleting an expense can be cancelled: nothing changes', async () => {
    await startApp({ today: TODAY, expenses: [salary, cinema] });
    await press(/Cinema/);
    await press('Delete');
    expectDialog(DELETE_DIALOG);
    await answerDialog('Cancel');
    expectNoDialog();
    expect(screen).toHavePathname('/expense');

    await testRouter.back();
    expectNoDialog();
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    expectLeftToSpend('1 587,50 €');
  });

  it('Leaving with changes: the app asks before discarding them', async () => {
    await startApp({ today: TODAY, expenses: [salary, cinema] });
    await press(/Cinema/);
    await type('Amount', '99');

    await testRouter.back();
    expectDialog(DISCARD_DIALOG);
    await answerDialog('Discard');

    expect(screen).toHavePathname('/');
    expect(tile('Spent').getByText(exactText('12,50 €'))).toBeOnTheScreen();
    expect(screen.queryByText(exactText('99,00 €'))).not.toBeOnTheScreen();
  });

  it('Leaving with changes: "Keep editing" closes the question and keeps the form as typed', async () => {
    await startApp({ today: TODAY, expenses: [salary, cinema] });
    await press(/Cinema/);
    await type('Amount', '99');

    await testRouter.back();
    await answerDialog('Keep editing');

    expectNoDialog();
    expect(screen).toHavePathname('/expense');
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('99');
  });

  it('Leaving after a field was changed back to its original value does not ask', async () => {
    await startApp({ today: TODAY, expenses: [salary, cinema] });
    await press(/Cinema/);
    await type('Amount', '99');
    await type('Amount', '12,50');
    await type('Note (optional)', 'Cinemas');
    await type('Note (optional)', 'Cinema');

    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/');
  });

  it('Leaving with changes: tapping outside the question does not discard them', async () => {
    await startApp({ today: TODAY, expenses: [salary, cinema] });
    await press(/Cinema/);
    await type('Amount', '99');
    await testRouter.back();
    expectDialog(DISCARD_DIALOG);

    await fireEvent.press(screen.getByTestId('confirm-dialog-backdrop', { includeHiddenElements: true }));

    expect(screen).toHavePathname('/expense');
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('99');
  });

  it('Leaving a new entry that has been typed into asks, and one left empty does not', async () => {
    await startApp({ today: TODAY, expenses: [salary] });
    await press('Add expense');
    await testRouter.back();
    expectNoDialog();
    expect(screen).toHavePathname('/');

    await press('Add expense');
    await type('Amount', '3');
    await testRouter.back();
    expectDialog(DISCARD_DIALOG);
    await answerDialog('Discard');
    expect(screen).toHavePathname('/');
    expect(tile('Spent').getByText(exactText('0 €'))).toBeOnTheScreen();
  });

  it('An entry can change kind when edited', async () => {
    await startApp({ today: TODAY, expenses: [salary, cinema] });
    await press(/Cinema/);
    await choose('Savings');
    await press('Save changes');

    expect(tile('Spent').getByText(exactText('0 €'))).toBeOnTheScreen();
    expect(tile('Savings').getByText(exactText('12,50 €'))).toBeOnTheScreen();
  });
});

describe('Past months can be corrected', () => {
  it('Forgotten expense: on 3 December with nothing recorded, an expense added to November counts towards November', async () => {
    await startApp({ today: [2026, 11, 3] });
    await press(/^Month:/);
    await press('Nov');
    await press('Add expense');
    expect(screen.getByText(/Mon 30 Nov/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled();
    await type('Amount', '20');
    await press('Add expense');

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('20,00 €'))).toBeOnTheScreen();

    await press('Back to current month');
    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.queryByText(exactText('20,00 €'))).not.toBeOnTheScreen();
  });

  it('Any past month: on 6 December the expenses of November can be added, edited or deleted', async () => {
    await startApp({
      today: [2026, 11, 6],
      expenses: [
        { date: '2026-11-05', bucket: 'expense', amountCents: 1250, note: 'Cinema' },
        { date: '2026-11-06', bucket: 'expense', amountCents: 900, note: 'Lunch' },
      ],
    });
    await press(/^Month:/);
    await press('Nov');

    await press(/Cinema/);
    await type('Amount', '15,00');
    await press('Save changes');
    expect(screen.getByText(exactText('15,00 €'))).toBeOnTheScreen();

    await press(/Lunch/);
    await press('Delete');
    await answerDialog('Delete');
    expect(screen.queryByText('Lunch')).not.toBeOnTheScreen();

    await press('Add expense');
    await type('Amount', '7');
    await type('Note (optional)', 'Bakery');
    await press('Previous day');
    await press('Add expense');
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Bakery')).toBeOnTheScreen();
    expect(screen.getByText(exactText('7,00 €'))).toBeOnTheScreen();
  });

  it('Entries cannot be dated after today', async () => {
    await startApp({ today: TODAY, expenses: [salary] });
    await press('Add expense');

    expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled();
  });
});

describe('Month figures', () => {
  it('Spent: expenses of 900,00 € show 900 € spent; savings and income are not spending', async () => {
    await startApp({
      today: TODAY,
      expenses: [
        salary,
        { date: '2026-11-02', bucket: 'savings', amountCents: 30000, note: 'Piggy bank' },
        { date: '2026-11-03', bucket: 'expense', amountCents: 40000, note: 'Rent' },
        { date: '2026-11-04', bucket: 'expense', amountCents: 50000, note: 'Shopping' },
      ],
    });

    expect(tile('Spent').getByText(exactText('900 €'))).toBeOnTheScreen();
  });
});

describe('Month expense list', () => {
  it('Lists the entries newest date first', async () => {
    await startApp({
      today: TODAY,
      expenses: [
        { date: '2026-11-02', bucket: 'expense', amountCents: 1000, note: 'Middle' },
        { date: '2026-11-05', bucket: 'expense', amountCents: 2000, note: 'Newest' },
        { date: '2026-11-01', bucket: 'savings', amountCents: 3000, note: 'Oldest' },
      ],
    });

    const notes = screen.getAllByText(/^(Newest|Middle|Oldest)$/).map((row) => row.props.children);
    expect(notes).toEqual(['Newest', 'Middle', 'Oldest']);
  });

  it('Same day: the entry recorded later comes first, and a later date comes before any of them', async () => {
    await startApp({
      today: TODAY,
      raw: [
        "INSERT INTO expense (date, bucket, amount_cents, note, created_at) VALUES ('2026-11-05', 'expense', 2000, 'Recorded morning', '2026-11-05 08:00:00')",
        "INSERT INTO expense (date, bucket, amount_cents, note, created_at) VALUES ('2026-11-05', 'expense', 3000, 'Recorded noon', '2026-11-05 12:00:00')",
        "INSERT INTO expense (date, bucket, amount_cents, note, created_at) VALUES ('2026-11-05', 'expense', 1000, 'Recorded afternoon', '2026-11-05 15:00:00')",
        "INSERT INTO expense (date, bucket, amount_cents, note, created_at) VALUES ('2026-11-06', 'expense', 4000, 'Dated later', '2026-11-06 09:00:00')",
      ],
    });

    const notes = screen.getAllByText(/^Recorded |^Dated/).map((row) => row.props.children);
    expect(notes).toEqual(['Dated later', 'Recorded afternoon', 'Recorded noon', 'Recorded morning']);
  });

  it('Without a note a row shows the name of its kind, with the date and amount', async () => {
    await startApp({
      today: TODAY,
      expenses: [
        { date: '2026-11-01', bucket: 'income', amountCents: 200000, note: '' },
        { date: '2026-11-02', bucket: 'savings', amountCents: 15000, note: '' },
        { date: '2026-11-03', bucket: 'expense', amountCents: 500, note: '' },
      ],
    });

    expect(screen.getByText(exactText('5,00 €')).parent).toHaveTextContent(/Expense.*Tue 3 Nov.*5,00.€$/);
    expect(screen.getByText(exactText('150,00 €')).parent).toHaveTextContent(/Savings.*Mon 2 Nov.*150,00.€$/);
    expect(screen.getByText(partialText('2 000,00 €')).parent).toHaveTextContent(/Income.*Sun 1 Nov.*2.000,00.€$/);
  });

  it('Viewing a past month: it shows that month entries and its figures, not the current ones', async () => {
    await startApp({
      today: TODAY,
      expenses: [
        { date: '2026-09-01', bucket: 'income', amountCents: 100000, note: 'Sep pay' },
        { date: '2026-09-10', bucket: 'expense', amountCents: 8000, note: 'Concert' },
        { date: '2026-11-02', bucket: 'expense', amountCents: 1000, note: 'Coffee' },
      ],
    });
    await press(/^Month:/);
    await press('Sep');

    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Concert')).toBeOnTheScreen();
    expect(screen.getByText(exactText('80,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText('Coffee')).not.toBeOnTheScreen();
    expectLeftToSpend('720,00 €');
  });
});

describe('Look inside one kind', () => {
  const everyKind = [
    { date: '2026-11-01', bucket: 'income', amountCents: 200000, note: 'Pay' },
    { date: '2026-11-02', bucket: 'savings', amountCents: 70000, note: 'Piggy bank' },
    { date: '2026-11-03', bucket: 'expense', amountCents: 1500, note: 'Dinner' },
  ] as const;

  it.each([
    ['Spent', 'Dinner', ['Pay', 'Piggy bank']],
    ['Savings', 'Piggy bank', ['Pay', 'Dinner']],
    ['Income', 'Pay', ['Piggy bank', 'Dinner']],
  ])('Tapping %s lists only %s, and "Show all" brings back the full list', async (name, shown, hidden) => {
    await startApp({ today: TODAY, expenses: [...everyKind] });
    expect(screen.getByText('Pay')).toBeOnTheScreen();
    expect(screen.getByText('Piggy bank')).toBeOnTheScreen();
    expect(screen.getByText('Dinner')).toBeOnTheScreen();

    await press(name);
    expect(screen.getByText(shown)).toBeOnTheScreen();
    for (const other of hidden) expect(screen.queryByText(other)).not.toBeOnTheScreen();

    await press('Show all');
    for (const note of ['Pay', 'Piggy bank', 'Dinner']) expect(screen.getByText(note)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Show all' })).not.toBeOnTheScreen();
  });

  it.each([
    ['Income', 'Add income', 'Income'],
    ['Savings', 'Add to savings', 'Savings'],
    ['Spent', 'Add expense', 'Expense'],
  ])('With %s selected the list is titled %s and Add adds that kind', async (name, addLabel, kind) => {
    await startApp({ today: TODAY, expenses: [...everyKind] });
    expect(screen.getAllByText(name)).toHaveLength(1);

    await press(name);
    expect(screen.getAllByText(name)).toHaveLength(2);

    await press(addLabel);
    expect(screen.getByRole('radio', { name: kind })).toBeSelected();
    await type('Amount', '1');
    await type('Note (optional)', 'Added inside');
    await press(addLabel);

    expect(screen.getByText('Added inside')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Show all' })).toBeOnTheScreen();
  });

  it('With no tile selected Add adds an expense', async () => {
    await startApp({ today: TODAY, expenses: [...everyKind] });
    await press('Add expense');

    expect(screen.getByRole('radio', { name: 'Expense' })).toBeSelected();
  });

  it.each([
    ['Spent', 'No expenses this month.'],
    ['Savings', 'No savings this month.'],
  ])('An empty %s list says "%s"', async (name, message) => {
    await startApp({ today: TODAY, expenses: [salary] });
    await press(name);

    expect(screen.getByText(message)).toBeOnTheScreen();
  });

  it('The filter keeps the figures of the whole month', async () => {
    await startApp({ today: TODAY, expenses: [...everyKind] });
    await press('Spent');

    expectLeftToSpend('1 285,00 €');
  });
});
