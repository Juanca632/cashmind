import { screen, within } from 'expo-router/testing-library';

import {
  exactText,
  expectBalance,
  partialText,
  press,
  showPocket,
  startApp,
  type,
} from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => jest.useRealTimers());

const TODAY: [number, number, number] = [2026, 10, 25];
const salary = { date: '2026-11-01', kind: 'income', amountCents: 200000, note: 'Pay' } as const;
/** Japan trip is pocket 1 (500,00 € to start), Car pocket 2 (100,00 €). */
const japan = { name: 'Japan trip', startingCents: 50000 };
const car = { name: 'Car', startingCents: 10000 };
const saving = (date: string, amountCents: number, pocketId = 1) => ({ date, kind: 'savings', amountCents, note: 'Put aside', pocketId }) as const;
const expense = (date: string, amountCents: number, pocketId = 1) =>
  ({ date, kind: 'expense', amountCents, note: 'Ticket', category: 'transport', pocketId }) as const;

const chart = () => screen.getByLabelText(/^Balance this month:/);
const label = () => chart().props.accessibilityLabel as string;

describe('See how a pocket moved this month', () => {
  it('Section: "Japan trip" shows "This month" after the round actions, with no Overview, with a sentence and a chart with "1 Nov" and "30 Nov" under it', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary, saving('2026-11-03', 25000)] });
    await showPocket('Japan trip');

    expect(screen.getByText('This month')).toBeOnTheScreen();
    expect(chart()).toBeOnTheScreen();
    expect(screen.getAllByText(/^(Up .* this month|Down .* this month|No change this month)$/)).toHaveLength(1);
    expect(within(chart()).getByText('1 Nov')).toBeOnTheScreen();
    expect(within(chart()).getByText('30 Nov')).toBeOnTheScreen();
    expect(within(chart()).queryByText(/€/)).not.toBeOnTheScreen();

    const tree = JSON.stringify(screen.toJSON());
    expect(screen.queryByText('Overview')).not.toBeOnTheScreen();
    expect(tree.indexOf('"Move"')).toBeGreaterThan(-1);
    expect(tree.indexOf('"This month"')).toBeGreaterThan(tree.indexOf('"Move"'));
    expect(tree.indexOf('"Activity"')).toBeGreaterThan(tree.indexOf('"This month"'));
  });

  it('Section: Main\'s space has no "This month" card', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary] });

    expect(screen.queryByText('This month')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Balance this month:/)).not.toBeOnTheScreen();
  });

  it('Line and sentence: 500,00 € to start, +250,00 € saved, -50,00 € spent, -100,00 € moved to Main, +30,00 € moved in goes from 500,00 € to 630,00 € and says "Up 130,00 € this month"', async () => {
    await startApp({
      today: TODAY,
      pockets: [japan, car],
      entries: [salary, saving('2026-11-03', 25000), expense('2026-11-05', 5000)],
      moves: [
        { date: '2026-11-10', amountCents: 10000, from: 1, to: null },
        { date: '2026-11-12', amountCents: 3000, from: 2, to: 1 },
      ],
    });
    await showPocket('Japan trip');

    expect(screen.getByText(exactText('Up 130,00 € this month'))).toBeOnTheScreen();
    expect(label()).toMatch(partialText('from 500,00 € on the 1st to 630,00 € today'));
  });

  it('Accessibility: the chart reads "Balance this month: from <start> on the 1st to <today\'s balance> today. <sentence>"', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary, saving('2026-11-03', 25000)] });
    await showPocket('Japan trip');

    expect(label()).toMatch(new RegExp(`^${partialText('Balance this month: from 500,00 € on the 1st to 750,00 € today. Up 250,00 € this month').source}`));
  });

  it('Sentence, down: with 50,00 € spent from it the card says "Down 50,00 € this month"', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary, expense('2026-11-05', 5000)] });
    await showPocket('Japan trip');

    expect(screen.getByText(exactText('Down 50,00 € this month'))).toBeOnTheScreen();
    expect(label()).toMatch(partialText('from 500,00 € on the 1st to 450,00 € today. Down 50,00 € this month'));
  });

  it('Sentence, up and down cancel out: +50,00 € saved and -50,00 € spent say "No change this month"', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary, saving('2026-11-03', 5000), expense('2026-11-05', 5000)] });
    await showPocket('Japan trip');

    expect(screen.getByText('No change this month')).toBeOnTheScreen();
  });

  it('Nothing this month: with nothing recorded this month the sentence says "No change this month" and the chart goes from 500,00 € to 500,00 €', async () => {
    await startApp({
      today: TODAY,
      pockets: [japan],
      entries: [salary, saving('2026-10-03', 10000, 1)],
      moves: [{ date: '2026-10-10', amountCents: 2000, from: 1, to: null }],
    });
    await showPocket('Japan trip');

    expect(screen.getByText('No change this month')).toBeOnTheScreen();
    expect(label()).toMatch(partialText('from 580,00 € on the 1st to 580,00 € today'));
  });

  it('Starting amount: counts in what the pocket held before this month, so a pocket with 500,00 € and nothing else starts at 500,00 €', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary] });
    await showPocket('Japan trip');

    expect(label()).toMatch(partialText('from 500,00 € on the 1st to 500,00 € today'));
  });

  it('Line: last month\'s savings and expenses are in the start, not in this month\'s change', async () => {
    await startApp({
      today: TODAY,
      pockets: [japan],
      entries: [salary, saving('2026-10-15', 20000), expense('2026-10-20', 7000), saving('2026-11-02', 1000)],
    });
    await showPocket('Japan trip');

    expect(label()).toMatch(partialText('from 630,00 € on the 1st to 640,00 € today. Up 10,00 € this month'));
  });

  it('New pocket this month: with no starting amount it starts at 0,00 €', async () => {
    await startApp({ today: TODAY, pockets: [{ name: 'Gifts' }], entries: [salary, saving('2026-11-04', 8000)] });
    await showPocket('Gifts');

    expect(label()).toMatch(partialText('from 0,00 € on the 1st to 80,00 € today. Up 80,00 € this month'));
  });

  it('Below zero: 700,00 € spent from 500,00 € says "Down 700,00 € this month" and today at -200,00 €', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary, expense('2026-11-04', 70000)] });
    await showPocket('Japan trip');

    expect(screen.getByText(exactText('Down 700,00 € this month'))).toBeOnTheScreen();
    expect(label()).toMatch(partialText('from 500,00 € on the 1st to -200,00 € today'));
  });

  it('Today only: things dated after today do not count in the chart', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary, saving('2026-11-28', 90000)] });
    await showPocket('Japan trip');

    expect(screen.getByText('No change this month')).toBeOnTheScreen();
  });

  it('Last point: today\'s value in the chart equals the balance on the pocket\'s card, to the cent', async () => {
    await startApp({
      today: TODAY,
      pockets: [japan, car],
      entries: [salary, saving('2026-10-02', 1234), saving('2026-11-03', 25001), expense('2026-11-05', 4999)],
      moves: [
        { date: '2026-11-10', amountCents: 10001, from: 1, to: null },
        { date: '2026-11-25', amountCents: 333, from: 2, to: 1 },
      ],
    });
    await showPocket('Japan trip');

    // 500,00 + 12,34 + 250,01 - 49,99 - 100,01 + 3,33 = 615,68
    await expectBalance('615,68 €');
    expect(label()).toMatch(partialText('to 615,68 € today'));
  });
});

describe('Journey: the chart follows what the user records', () => {
  it('Saving into the pocket from home raises today\'s value and the sentence', async () => {
    await startApp({ today: TODAY, pockets: [japan], entries: [salary] });
    await showPocket('Japan trip');
    expect(screen.getByText('No change this month')).toBeOnTheScreen();

    await press('Save into');
    await type('Amount', '40');
    await press('Add to savings');

    expect(screen.getByText(exactText('Up 40,00 € this month'))).toBeOnTheScreen();
    expect(label()).toMatch(partialText('to 540,00 € today'));
    await expectBalance('540,00 €');
  });

  it('Moving money out of the pocket to another pocket lowers today\'s value and the sentence says "Down 300,00 € this month"', async () => {
    await startApp({ today: TODAY, pockets: [{ name: 'Emergency fund', startingCents: 100000 }, { name: 'Car' }], entries: [salary] });
    await showPocket('Emergency fund');
    await press('Move');
    await type('Amount', '300');
    await press('Move');

    expect(screen.getByText(exactText('Down 300,00 € this month'))).toBeOnTheScreen();
    expect(label()).toMatch(partialText('from 1 000,00 € on the 1st to 700,00 € today'));
    await expectBalance('700,00 €');
  });
});
