import { fireEvent, screen, testRouter } from 'expo-router/testing-library';

import {
  DELETE_DIALOG,
  DISCARD_DIALOG,
  answerDialog,
  choose,
  expectDialog,
  expectNoDialog,
  headerTitles,
  press,
  startApp,
  type,
  typeNote,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const NOV_25: [number, number, number] = [2026, 10, 25];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Salary' } as const;
const cinema = { date: '2026-11-05', kind: 'expense', amountCents: 1250, note: 'Cinema', category: 'leisure' } as const;
const cafe = (date: string) => ({ date, kind: 'expense', amountCents: 250, note: 'Café', category: 'eating_out' }) as const;

const title = (name: string) => expect(headerTitles()).toContain(name);

describe('US1 The form opens with the keyboard closed', () => {
  it('Page: adding shows its own title in the header with no Close button; the kind sets the title', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    expect(screen).toHavePathname('/entry');
    title('Add expense');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeOnTheScreen();
    await choose('Income');
    title('Add income');
    await choose('Savings');
    title('Add to savings');
  });

  it('Page: editing shows "Edit entry" and Delete, and no Close button', async () => {
    await startApp({ today: NOV_25, entries: [salary, cinema] });
    await press(/Cinema/);

    title('Edit entry');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeOnTheScreen();
  });

  it('Keyboard closed: the amount shows 0,00 € and does not grab focus when the page opens', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    const amount = screen.getByLabelText('Amount');
    expect(amount.props.autoFocus).toBeFalsy();
    expect(amount.props.placeholder).toMatch(/^0[,.]00/);
  });

  it('Keyboard closed: editing shows the entry amount and no focus either', async () => {
    await startApp({ today: NOV_25, entries: [salary, cinema] });
    await press(/Cinema/);

    const amount = screen.getByLabelText('Amount');
    expect(amount.props.autoFocus).toBeFalsy();
    expect(amount).toHaveDisplayValue(/^12[,.]50$/);
  });

  it('Typing the amount: tapping the amount focuses it', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    await fireEvent(screen.getByLabelText('Amount'), 'focus');
    await type('Amount', '7');

    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('7');
  });

  it('Leaving: with nothing changed going back closes at once', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    await testRouter.back();

    expectNoDialog();
    expect(screen).toHavePathname('/');
  });

  it('Leaving: with a change going back asks; Keep editing stays and Discard closes without saving', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');
    await type('Amount', '5');

    await testRouter.back();

    expectDialog(DISCARD_DIALOG);
    expect(screen).toHavePathname('/entry');
    await answerDialog('Keep editing');
    expectNoDialog();
    expect(screen).toHavePathname('/entry');
    expect(screen.getByLabelText('Amount')).toHaveDisplayValue('5');

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen).toHavePathname('/');
    expect(screen.queryByText(/5,00/)).not.toBeOnTheScreen();
  });

  it('Saving: the add button records the entry and the form closes', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');
    await type('Amount', '12,50');

    await press('Add expense');

    expect(screen).toHavePathname('/');
    expect(headerTitles()).not.toContain('Add expense');
  });

  it('Saving: "Save changes" saves an edit and the form closes', async () => {
    await startApp({ today: NOV_25, entries: [salary, cinema] });
    await press(/Cinema/);
    await type('Amount', '20');

    await press('Save changes');

    expect(screen).toHavePathname('/');
    expect(screen.getByText(/20,00/)).toBeOnTheScreen();
  });
});

describe('US2 Less on the form at once', () => {
  it('Order: titles and controls show top to bottom: kind, amount, Category, Often recorded, Date, Repeat, Note, add button', async () => {
    await startApp({ today: NOV_25, entries: [salary, cafe('2026-11-03'), cafe('2026-11-10')] });
    await press('Add expense');

    // Position of each piece in the rendered tree, which is top to bottom on the page.
    const tree = JSON.stringify(screen.toJSON());
    const at = (needle: string) => {
      // lastIndexOf: home stays in the tree under the form and also has an "Add expense" button.
      const index = tree.lastIndexOf(needle);
      expect(index).toBeGreaterThanOrEqual(0);
      return index;
    };
    const positions = [
      at('"accessibilityLabel":"Kind"'),
      at('"accessibilityLabel":"Amount"'),
      at('"accessibilityLabel":"Category"'),
      at('Often recorded'),
      at('"accessibilityLabel":"Date: '),
      at('"accessibilityLabel":"Repeat every month"'),
      at('"accessibilityLabel":"Note (optional)"'),
      at('"accessibilityLabel":"Add expense"'),
    ];
    expect([...positions].sort((x, y) => x - y)).toEqual(positions);
  });

  it('Order: kind is one radio group Expense, Income, Savings; categories are another group', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    expect(screen.getByLabelText('Kind').props.accessibilityRole).toBe('radiogroup');
    expect(screen.getByLabelText('Category').props.accessibilityRole).toBe('radiogroup');
    const names = screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel);
    expect(names.slice(0, 3)).toEqual(['Expense', 'Income', 'Savings']);
    expect(screen.getByRole('radio', { name: 'Expense' })).toBeSelected();
  });

  it('Kind: picking another kind shows its categories with Other selected and the add button follows', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');
    await choose('Leisure');

    await choose('Income');

    expect(screen.getByRole('radio', { name: 'Income' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Salary' })).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Leisure' })).not.toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Other' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Add income' })).toBeOnTheScreen();
  });

  it('Categories: all the expense categories show at once and selecting one marks only it', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    const names = ['Housing', 'Groceries', 'Transport', 'Eating out', 'Leisure', 'Health', 'Subscriptions', 'Other'];
    for (const name of names) expect(screen.getByRole('radio', { name })).toBeOnTheScreen();
    await choose('Health');
    expect(screen.getByRole('radio', { name: 'Health' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Other' })).not.toBeSelected();
  });

  it('Suggestions: under "Often recorded" they read "Café · 2,50 €"; title and row are hidden when there are none', async () => {
    await startApp({ today: NOV_25, entries: [salary, cafe('2026-11-03'), cafe('2026-11-10')] });
    await press('Add expense');

    expect(screen.getByText('Often recorded')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Fill with Café, Eating out, 2,50/ })).toBeOnTheScreen();
    expect(screen.getByText(/^Café · 2,50/)).toBeOnTheScreen();
  });

  it('Suggestions: with none, neither the title nor a row shows', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    expect(screen.queryByText('Often recorded')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Fill with/ })).not.toBeOnTheScreen();
  });

  it('Date row: reads "Today" and its name tells the day and that it picks one', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    expect(screen.getByText('Date')).toBeOnTheScreen();
    expect(screen.getByText('Today')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Date: Wed 25 Nov. Pick a day' })).toBeOnTheScreen();
  });

  it('Date row: an entry of another day reads that day', async () => {
    await startApp({ today: NOV_25, entries: [salary, cinema] });
    await press(/Cinema/);

    expect(screen.getByText('Thu 5 Nov')).toBeOnTheScreen();
    expect(screen.queryByText('Today')).not.toBeOnTheScreen();
  });

  it('Repeat row: in the current month it is a switch that turns repeating on and off', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');
    const row = () => screen.getByRole('switch', { name: 'Repeat every month' });
    expect(row()).not.toBeChecked();

    await fireEvent(row(), 'valueChange', true);
    expect(row()).toBeChecked();

    await fireEvent(row(), 'valueChange', false);
    expect(row()).not.toBeChecked();
  });

  it('Repeat row: in a past month it is not shown', async () => {
    await startApp({ today: NOV_25, entries: [salary, { ...salary, date: '2026-10-01' }] });
    await press(/^Month:/);
    await press('Oct');
    await press('Add expense');

    expect(screen.queryByRole('switch', { name: 'Repeat every month' })).not.toBeOnTheScreen();
  });

  it('Note row: the field is always visible, empty, with the kind example as placeholder and no "Add a note" chip', async () => {
    await startApp({ today: NOV_25, entries: [salary] });
    await press('Add expense');

    const note = screen.getByLabelText('Note (optional)');
    expect(note).toHaveDisplayValue('');
    expect(note.props.placeholder).toBe('Note, e.g. Cinema');
    expect(note.props.autoFocus).toBeFalsy();
    expect(screen.queryByRole('button', { name: 'Add a note' })).not.toBeOnTheScreen();
    await typeNote('Bus');
    expect(screen.getByLabelText('Note (optional)')).toHaveDisplayValue('Bus');
  });

  it('Note row: an entry with a note shows the field with it', async () => {
    await startApp({ today: NOV_25, entries: [salary, cinema] });
    await press(/Cinema/);

    expect(screen.getByLabelText('Note (optional)')).toHaveDisplayValue('Cinema');
  });

  it('Note row: filling from a suggestion puts the suggestion note in the field', async () => {
    await startApp({ today: NOV_25, entries: [salary, cafe('2026-11-03'), cafe('2026-11-10'), cafe('2026-11-18')] });
    await press('Add expense');

    await press(/^Fill with Café/);

    expect(screen.getByLabelText('Note (optional)')).toHaveDisplayValue('Café');
  });

  it('Delete: a full button under the save button asks first; Cancel keeps the entry and Delete removes it', async () => {
    await startApp({ today: NOV_25, entries: [salary, cinema] });
    await press(/Cinema/);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeOnTheScreen();

    await press('Delete');

    expectDialog(DELETE_DIALOG);
    expect(screen).toHavePathname('/entry');
    await answerDialog('Cancel');
    expectNoDialog();
    expect(screen).toHavePathname('/entry');

    await press('Delete');
    await answerDialog('Delete');
    expect(screen).toHavePathname('/');
    expect(screen.queryByText('Cinema')).not.toBeOnTheScreen();
  });
});
