import { screen, within } from 'expo-router/testing-library';

import { answerDialog, exactText, partialText, press, record, startApp, type } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => jest.useRealTimers());

const NOV_14: [number, number, number] = [2026, 10, 14];
const PLAN_20: [number, string][] = [[20, '2026-01']];

const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Pay' } as const;
const expense = (date: string, amountCents: number, note: string) => ({ date, kind: 'expense', amountCents, note }) as const;

/** Rent 900,00 € as a repeating item already recorded on the 1st (id 1). */
const rentRaw = (cents = 90000) => [
  `INSERT INTO recurring (id, kind, category, amount_cents, note, active, last_month) VALUES (1, 'expense', 'housing', ${cents}, 'Rent', 1, '2026-11');`,
  `INSERT INTO entry (date, kind, category, amount_cents, note, recurring_id) VALUES ('2026-11-01', 'expense', 'housing', ${cents}, 'Rent', 1);`,
];
const spent = [expense('2026-11-03', 10000, 'Books'), expense('2026-11-10', 24000, 'Shoes')];

const tile = (name: string) => within(screen.getByRole('button', { name }));
const chart = () => screen.getByLabelText(/^Spending pace:/);

describe('US1 See the month\'s spending pace', () => {
  it('Section: with income home shows "Spending pace" below the tiles and above Activity, with a chart and one sentence', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, ...spent], raw: rentRaw() });

    expect(screen.getByText('Spending pace')).toBeOnTheScreen();
    expect(chart()).toBeOnTheScreen();
    expect(screen.getAllByText(/ your pace$|^Right on your pace$/)).toHaveLength(1);

    const order = JSON.stringify(screen.toJSON());
    const at = (text: string) => order.indexOf(`"${text}"`);
    expect(at('Overview')).toBeGreaterThan(-1);
    expect(at('Spending pace')).toBeGreaterThan(at('Overview'));
    expect(at('Activity')).toBeGreaterThan(at('Spending pace'));
  });

  it('Spending curve: on 14 November the chart says 1 240,00 € spent so far (900 + 100 + 240) and the pace today is 1 226,66 €', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, ...spent], raw: rentRaw() });

    expect(chart().props.accessibilityLabel).toMatch(partialText('1 240,00 € spent so far'));
    expect(chart().props.accessibilityLabel).toMatch(partialText('1 226,66 €'));
  });

  it('Pace line: the chart says the pace goes from 900,00 € to 1 600,00 €, with only "1 Nov" and "30 Nov" under it', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, ...spent], raw: rentRaw() });

    expect(chart().props.accessibilityLabel).toMatch(partialText('The plan\'s pace goes from 900,00 € to 1 600,00 €.'));
    expect(within(chart()).getByText('1 Nov')).toBeOnTheScreen();
    expect(within(chart()).getByText('30 Nov')).toBeOnTheScreen();
    expect(within(chart()).queryByText(/€|^15$/)).not.toBeOnTheScreen();
  });

  it('Section: the sentence comes before the chart and the spent amount is not repeated in the section', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, ...spent], raw: rentRaw() });

    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('over your pace')).toBeGreaterThan(-1);
    expect(tree.indexOf('over your pace')).toBeLessThan(tree.indexOf('Spending pace: '));
    // The Spent tile shows the total; the section does not repeat it as text.
    expect(tile('Spent').getByText(exactText('1 240 €'))).toBeOnTheScreen();
    expect(screen.queryByText(exactText('1 240,00 €'))).not.toBeOnTheScreen();
    expect(screen.getAllByText(exactText('1 240 €'))).toHaveLength(1);
  });

  it('Sentence, under: with 1 240,00 € spent against a pace of 1 226,66 € it says "13,34 € over your pace"', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, ...spent], raw: rentRaw() });

    expect(screen.getByText(exactText('13,34 € over your pace'))).toBeOnTheScreen();
  });

  it('Sentence, under: with 1 200,00 € spent it says "26,66 € under your pace"', async () => {
    await startApp({
      today: NOV_14,
      plans: PLAN_20,
      entries: [salary, expense('2026-11-03', 10000, 'Books'), expense('2026-11-10', 20000, 'Shoes')],
      raw: rentRaw(),
    });

    expect(screen.getByText(exactText('26,66 € under your pace'))).toBeOnTheScreen();
  });

  it('Sentence, under: with the same amount as the pace it says "Right on your pace"', async () => {
    // 900,00 € of Rent + 326,66 € of other spending = 1 226,66 €.
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, expense('2026-11-05', 32666, 'Books')], raw: rentRaw() });

    expect(screen.getByText('Right on your pace')).toBeOnTheScreen();
  });

  it('Savings above the goal: saving 500,00 € with a 400,00 € goal moves the end of the line to 1 500,00 €', async () => {
    await startApp({
      today: NOV_14,
      plans: PLAN_20,
      entries: [salary, { date: '2026-11-02', kind: 'savings', amountCents: 50000, note: 'Fund' }, ...spent],
      raw: rentRaw(),
    });

    expect(chart().props.accessibilityLabel).toMatch(partialText('goes from 900,00 € to 1 500,00 €'));
    // 900,00 + 600,00 x 14 / 30 = 1 180,00 €; spent 1 240,00 €.
    expect(chart().props.accessibilityLabel).toMatch(partialText('1 180,00 €'));
    expect(screen.getByText(exactText('60,00 € over your pace'))).toBeOnTheScreen();
  });

  it('No fixed costs: nothing repeats, so the line starts at 0 € on the 1st', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, expense('2026-11-03', 10000, 'Books')] });

    expect(chart().props.accessibilityLabel).toMatch(partialText('goes from 0,00 € to 1 600,00 €'));
    // 1 600,00 x 14 / 30 = 746,66 €; spent 100,00 €.
    expect(screen.getByText(exactText('646,66 € under your pace'))).toBeOnTheScreen();
  });

  it('Fixed costs above the budget: the line is flat at the fixed costs', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary], raw: rentRaw(170000) });

    expect(chart().props.accessibilityLabel).toMatch(partialText('goes from 1 700,00 € to 1 700,00 €'));
    expect(screen.getByText('Right on your pace')).toBeOnTheScreen();
  });

  it('Past month: the chart shows the whole month with its total and the line\'s end, and nothing else', async () => {
    await startApp({
      today: [2026, 11, 4],
      plans: PLAN_20,
      entries: [salary, ...spent, { ...salary, date: '2026-12-01' }],
      raw: rentRaw(),
    });
    expect(screen.getByText(/ your pace$/)).toBeOnTheScreen();

    await press(/^Month:/);
    await press('Nov');

    expect(chart().props.accessibilityLabel).toMatch(partialText('1 240,00 €'));
    expect(chart().props.accessibilityLabel).toMatch(partialText('goes from 900,00 € to 1 600,00 €'));
    expect(screen.queryByText(/your pace$/)).not.toBeOnTheScreen();
    expect(within(chart()).getByText('30 Nov')).toBeOnTheScreen();
    expect(screen.queryByText(exactText('1 240,00 €'))).not.toBeOnTheScreen();
  });

  it('No income: the section is not shown', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [expense('2026-11-03', 10000, 'Books')] });

    expect(screen.queryByText('Spending pace')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Spending pace:/)).not.toBeOnTheScreen();
    expect(screen.queryByText(/your pace$/)).not.toBeOnTheScreen();
  });

  it('Follows changes: adding an expense updates the sentence when home shows again', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, ...spent], raw: rentRaw() });
    expect(screen.getByText(exactText('13,34 € over your pace'))).toBeOnTheScreen();

    await record('Expense', '60', 'Taxi');

    expect(screen.getByText(exactText('73,34 € over your pace'))).toBeOnTheScreen();
    expect(chart().props.accessibilityLabel).toMatch(partialText('1 300,00 € spent so far'));
  });

  it('Follows changes: editing an expense updates the sentence', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, ...spent], raw: rentRaw() });

    await press(/Shoes/);
    await type('Amount', '140');
    await press('Save changes');

    expect(screen.getByText(exactText('86,66 € under your pace'))).toBeOnTheScreen();
    expect(chart().props.accessibilityLabel).toMatch(partialText('1 140,00 € spent so far'));
  });

  it('Follows changes: deleting an expense updates the sentence', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary, ...spent], raw: rentRaw() });

    await press(/Shoes/);
    await press('Delete');
    await answerDialog('Delete');

    expect(screen.getByText(exactText('226,66 € under your pace'))).toBeOnTheScreen();
    expect(chart().props.accessibilityLabel).toMatch(partialText('1 000,00 € spent so far'));
  });
});

describe('US2 Titled sections on home', () => {
  it('Titles: with income the tiles are titled "Overview", the chart "Spending pace" and the list "Activity"', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20, entries: [salary] });

    expect(screen.getByText('Overview')).toBeOnTheScreen();
    expect(screen.getByText('Spending pace')).toBeOnTheScreen();
    expect(screen.getByText('Activity')).toBeOnTheScreen();
  });

  it('No income: neither "Overview" nor "Spending pace" is shown', async () => {
    await startApp({ today: NOV_14, plans: PLAN_20 });

    expect(screen.queryByText('Overview')).not.toBeOnTheScreen();
    expect(screen.queryByText('Spending pace')).not.toBeOnTheScreen();
  });
});
