import { screen } from 'expo-router/testing-library';

import { choose, exactText, partialText, press, savingsBlock, startApp, type } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => jest.useRealTimers());

const NOV_26: [number, number, number] = [2026, 10, 26];
const PLAN_20: [number, string][] = [[20, '2026-01']];
const COP = ["INSERT INTO setting (key, value) VALUES ('currency', 'COP')"];
const EUR = ["INSERT INTO setting (key, value) VALUES ('currency', 'EUR')"];
const income = { date: '2026-11-26', kind: 'income', amountCents: 123456700, note: 'Pay' } as const;
const spent = { date: '2026-11-26', kind: 'expense', amountCents: 10000000, note: 'Rent' } as const;

describe('Pesos never show cents', () => {
  it('Goal, Left to spend and Daily budget: 20 % of $ 1.234.567 is $ 246.913, left is $ 887.654 and the day is "≈ $ 177.530 / day · 5 days left"', async () => {
    await startApp({ today: NOV_26, plans: PLAN_20, entries: [income, spent], pockets: [{ name: 'Emergency' }], raw: COP });

    expect(screen.getByLabelText(partialText('Left to spend: $ 887.654'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('≈ $ 177.530 / day · 5 days left'))).toBeOnTheScreen();
    expect(savingsBlock().getByText(exactText('$ 246.913 to split'))).toBeOnTheScreen();
    expect(screen.queryByText(/,\d/)).not.toBeOnTheScreen();
  });

  it('Goal on My plan: typing 20 shows $ 246.913 for this month\'s income', async () => {
    await startApp({ today: NOV_26, plans: PLAN_20, entries: [income, spent], raw: COP });
    await press('My plan');
    await type('Savings percentage', '20');

    expect(screen.getByText(partialText("$ 246.913 of this month's $ 1.234.567"))).toBeOnTheScreen();
  });

  it('Goal on Trends: the bar of this month says goal $ 246.913', async () => {
    await startApp({ today: NOV_26, plans: PLAN_20, entries: [income, spent], raw: COP });
    await press(/^See trends/);
    await choose('Saved');

    expect(screen.getByRole('button', { name: /^November 2026: .*goal \$\s246\.913, not reached$/ })).toBeOnTheScreen();
  });

  it('Pace: the spending pace sentence shows whole pesos', async () => {
    await startApp({ today: NOV_26, plans: PLAN_20, entries: [income, spent], raw: COP });

    expect(screen.getAllByText(/ your pace$|^Right on your pace$/)).toHaveLength(1);
    expect(screen.queryByText(/\$[\s ]\d[\d.]*,\d/)).not.toBeOnTheScreen();
  });

  it('Split: the pre-filled shares are whole pesos and add up to what is to split', async () => {
    const lastMonth = [
      { date: '2026-10-05', kind: 'savings', amountCents: 10000, note: '', pocketId: 1 },
      { date: '2026-10-05', kind: 'savings', amountCents: 10000, note: '', pocketId: 2 },
      { date: '2026-10-05', kind: 'savings', amountCents: 10000, note: '', pocketId: 3 },
    ] as const;
    await startApp({
      today: NOV_26,
      plans: PLAN_20,
      entries: [income, ...lastMonth],
      pockets: [{ name: 'Emergency' }, { name: 'Travel' }, { name: 'Investing' }],
      raw: COP,
    });
    await press('Split savings');

    const values = ['Emergency', 'Travel', 'Investing'].map((p) => String(screen.getByLabelText(`${p} amount`).props.value ?? ''));
    values.forEach((v) => expect(v).not.toMatch(/[,.]\d{1,2}$/));
    const total = values.reduce((sum, v) => sum + Number(v.replace(/\D/g, '')), 0);
    expect(total).toBe(246913);
  });

  it('Other currencies: Euro still shows cents (goal 20 % of 1 234 567,00 € is 246 913,40 €)', async () => {
    await startApp({ today: NOV_26, plans: PLAN_20, entries: [income, spent], raw: EUR });

    expect(screen.getByLabelText(partialText('Left to spend: 887 653,60'))).toBeOnTheScreen();
  });
});

describe('Edge cases', () => {
  it('Amounts with cents: an expense of 12,50 shows as $ 12 in pesos and its form still shows the cents', async () => {
    const cinema = { date: '2026-11-04', kind: 'expense', amountCents: 1250, note: 'Cinema' } as const;
    await startApp({ today: NOV_26, plans: PLAN_20, entries: [income, cinema], raw: COP });

    expect(screen.getAllByText(exactText('$ 12')).length).toBeGreaterThan(0);
    await press(/Cinema/);
    expect(screen.getByLabelText('Amount').props.value).toMatch(/12[,.]50/);
  });
});
