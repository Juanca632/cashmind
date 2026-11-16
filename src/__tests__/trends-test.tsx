import { router } from 'expo-router';
import { act, fireEvent, screen } from 'expo-router/testing-library';

import { exactText, partialText, choose, press, startApp, headerTitles, type SeedEntry } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => jest.useRealTimers());

const NOV_16: [number, number, number] = [2026, 10, 16];
const exp = (date: string, amountCents: number, category: SeedEntry['category'] = 'other'): SeedEntry => ({
  date,
  kind: 'expense',
  amountCents,
  category,
  note: 'x',
});
const inc = (date: string, amountCents: number): SeedEntry => ({ date, kind: 'income', amountCents, category: 'salary', note: 'Pay' });
const sav = (date: string, amountCents: number): SeedEntry => ({ date, kind: 'savings', amountCents, category: 'goal', note: 'Save' });

const SIX: SeedEntry[] = [
  inc('2026-11-01', 300000),
  exp('2026-06-05', 100000),
  exp('2026-07-05', 120000),
  exp('2026-08-05', 140000),
  exp('2026-09-05', 130000),
  exp('2026-10-05', 110000),
  exp('2026-11-05', 50000),
];

async function openTrends() {
  await press(/^See trends/);
}
const bar = (name: RegExp) => screen.getByRole('button', { name });

describe('US1 See the last 6 months of one kind', () => {
  it('Entry point: home shows "See trends ›" in Spending pace and tapping it opens Trends', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    expect(screen.getByText('Spending pace')).toBeOnTheScreen();
    await openTrends();
    expect(screen).toHavePathname('/trends');
  });

  it('Entry point: without income there is no Spending pace section and no link', async () => {
    await startApp({ today: NOV_16, entries: [exp('2026-11-03', 1000)] });
    expect(screen.queryByText('See trends ›')).not.toBeOnTheScreen();
  });

  it('Opening state: Spent is selected, six bars June to November, November selected', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    expect(screen.getByRole('radio', { name: 'Spent' })).toBeSelected();
    for (const m of ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']) expect(screen.getByText(m)).toBeOnTheScreen();
    const bars = ['June', 'July', 'August', 'September', 'October', 'November'].map((m) => bar(new RegExp(`^${m}`)));
    expect(bars[5]).toBeSelected();
    expect(bars[0]).not.toBeSelected();
    expect(screen.getAllByText(/^November/).length).toBeGreaterThan(0);
  });

  it('Big number: November expenses of 1 240,50 € show "November" and "1 240,50 €"', async () => {
    await startApp({ today: NOV_16, entries: [inc('2026-11-01', 300000), exp('2026-11-05', 100000), exp('2026-11-09', 24050)] });
    await openTrends();
    expect(screen.getByText('November 2026')).toBeOnTheScreen();
    expect(screen.getAllByText(exactText('1 240,50 €')).length).toBeGreaterThan(0);
  });

  it('Average: November says "So far, 700,00 € less than your average"', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    expect(screen.getByText(exactText('So far, 700,00 € less than your average'))).toBeOnTheScreen();
  });

  it('Average: a key under the chart says "Avg 1 200,00 €"', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    expect(screen.getByText(exactText('Avg 1 200,00 €'))).toBeOnTheScreen();
  });

  it('Average: with no month in use before the current one there is no key and no sentence', async () => {
    await startApp({ today: NOV_16, entries: [inc('2026-11-01', 300000), exp('2026-11-05', 50000)] });
    await openTrends();
    expect(screen.queryByText(/^Avg /)).not.toBeOnTheScreen();
    expect(screen.queryByText(/than your average|About your average/)).not.toBeOnTheScreen();
  });

  it('Unfinished month: "so far" shows under the current month only, selected or not', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    expect(screen.getAllByText('so far')).toHaveLength(1);
    expect(bar(/^November/).props.accessibilityLabel).toMatch(/so far/);
    await fireEvent.press(bar(/^August/));
    expect(bar(/^August/)).toBeSelected();
    expect(screen.getAllByText('so far')).toHaveLength(1);
    expect(bar(/^August/).props.accessibilityLabel).not.toMatch(/so far/);
  });

  it('Past month sentence: tapping August selects it without navigating', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    await fireEvent.press(bar(/^August/));
    expect(bar(/^August/)).toBeSelected();
    expect(screen).toHavePathname('/trends');
    expect(screen.getAllByText(exactText('1 400,00 €')).length).toBeGreaterThan(0);
    expect(screen.getByText(exactText('200,00 € more than your average'))).toBeOnTheScreen();
  });

  it('About the average: a month within 5 % says "About your average"', async () => {
    await startApp({
      today: NOV_16,
      entries: [inc('2026-11-01', 300000), exp('2026-09-05', 100000), exp('2026-10-05', 100000), exp('2026-11-05', 104000)],
    });
    await openTrends();
    expect(screen.getByText(exactText('So far, about your average'))).toBeOnTheScreen();
  });

  it('Other pills: Saved and Income show their own totals and keep the selected month', async () => {
    await startApp({
      today: NOV_16,
      plans: [[20, '2026-01']],
      entries: [...SIX, sav('2026-08-10', 30000), sav('2026-10-10', 10000), inc('2026-08-01', 250000)],
    });
    await openTrends();
    await fireEvent.press(bar(/^August/));
    await choose('Saved');
    expect(screen.getByRole('radio', { name: 'Saved' })).toBeSelected();
    expect(bar(/^August/)).toBeSelected();
    expect(screen.getAllByText(exactText('300,00 €')).length).toBeGreaterThan(0);
    await choose('Income');
    expect(bar(/^August/)).toBeSelected();
    expect(screen.getAllByText(exactText('2 500,00 €')).length).toBeGreaterThan(0);
  });

  it('Neutral: no judging words are on the screen', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    expect(screen.queryByText(/good|bad|over budget/i)).not.toBeOnTheScreen();
  });

  it('Open the month: "Open August ›" opens home on August 2026', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    await fireEvent.press(bar(/^August/));
    expect(screen.getByText(exactText('Open August ›'))).toBeOnTheScreen();
    await press(/^Open August/);
    expect(screen).toHavePathname('/');
    expect(screen.getByText(/August 2026/)).toBeOnTheScreen();
  });

  it('Readable: every bar has an accessible label with its month and amount', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    expect(bar(/^August/).props.accessibilityLabel).toMatch(partialText('1 400,00 €'));
    expect(bar(/^November/).props.accessibilityLabel).toMatch(partialText('500,00 €'));
  });

  it('Readable: every bar label includes the average', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    for (const m of ['June', 'August', 'November']) {
      expect(bar(new RegExp(`^${m}`)).props.accessibilityLabel).toMatch(partialText('average 1 200,00 €'));
    }
  });

  it('Readable: the pills form a radio group and each pill is a radio', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: SIX });
    await openTrends();
    expect(screen.getByLabelText('Kind').props.accessibilityRole).toBe('radiogroup');
    expect(screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel ?? '')).toEqual(expect.arrayContaining(['Spent', 'Saved', 'Income']));
  });
});

describe('US2 The selected month by category', () => {
  const CATS: SeedEntry[] = [
    inc('2026-11-01', 300000),
    exp('2026-11-02', 65000, 'housing'),
    exp('2026-11-03', 31000, 'groceries'),
    exp('2026-11-04', 18000, 'eating_out'),
    exp('2026-11-05', 10000, 'transport'),
    exp('2026-10-05', 5000, 'leisure'),
  ];

  it('List: "By category" shows the four categories largest first with their amounts', async () => {
    await startApp({ today: NOV_16, entries: CATS });
    await openTrends();
    expect(screen.getByText('By category')).toBeOnTheScreen();
    const order = JSON.stringify(screen.toJSON());
    const at = (t: string) => order.indexOf(`"${t}"`);
    expect(at('Housing')).toBeGreaterThan(-1);
    expect(at('Housing')).toBeLessThan(at('Groceries'));
    expect(at('Groceries')).toBeLessThan(at('Eating out'));
    expect(at('Eating out')).toBeLessThan(at('Transport'));
    for (const a of ['650,00 €', '310,00 €', '180,00 €', '100,00 €']) {
      expect(screen.getAllByText(exactText(a)).length).toBeGreaterThan(0);
    }
  });

  it('Hidden empty: categories without an amount that month are not listed', async () => {
    await startApp({ today: NOV_16, entries: CATS });
    await openTrends();
    expect(screen.queryByText('Leisure')).not.toBeOnTheScreen();
    expect(screen.queryByText('Health')).not.toBeOnTheScreen();
  });

  it('Follows selection: selecting October shows its categories; selecting Income shows income categories', async () => {
    await startApp({ today: NOV_16, entries: CATS });
    await openTrends();
    await fireEvent.press(bar(/^October/));
    expect(screen.getByText('Leisure')).toBeOnTheScreen();
    expect(screen.queryByText('Housing')).not.toBeOnTheScreen();
    await fireEvent.press(bar(/^November/));
    await choose('Income');
    expect(screen.getByText('Salary')).toBeOnTheScreen();
    expect(screen.queryByText('Housing')).not.toBeOnTheScreen();
  });

  it('Empty month: shows 0,00 € and "Nothing recorded this month" instead of the list', async () => {
    await startApp({ today: NOV_16, entries: CATS });
    await openTrends();
    await fireEvent.press(bar(/^June/));
    expect(screen.getAllByText(exactText('0,00 €')).length).toBeGreaterThan(0);
    expect(screen.getByText('Nothing recorded this month')).toBeOnTheScreen();
    expect(screen.getByText('By category')).toBeOnTheScreen();
  });
});

describe('US2 The selected month by category (against usual)', () => {
  // Groceries: Aug 200,00 / Sep 300,00 / Oct 265,00 => usual 255,00; Housing only in November
  const U: SeedEntry[] = [
    inc('2026-11-01', 300000),
    exp('2026-08-05', 20000, 'groceries'),
    exp('2026-09-05', 30000, 'groceries'),
    exp('2026-10-05', 26500, 'groceries'),
    exp('2026-11-05', 31000, 'groceries'),
    exp('2026-11-06', 10000, 'housing'),
  ];
  const row = (name: RegExp) => screen.getByRole('button', { name });

  it('Against usual: a category above its usual says "X more than usual"', async () => {
    await startApp({ today: NOV_16, entries: U });
    await openTrends();
    await fireEvent.press(bar(/^September/));
    expect(screen.getByText(exactText('45,00 € more than usual'))).toBeOnTheScreen();
  });

  it('Against usual: a category below its usual says "X less than usual"', async () => {
    await startApp({ today: NOV_16, entries: U });
    await openTrends();
    await fireEvent.press(bar(/^August/));
    expect(screen.getByText(exactText('55,00 € less than usual'))).toBeOnTheScreen();
  });

  it('Against usual: within 5 % says "About usual"', async () => {
    await startApp({ today: NOV_16, entries: U });
    await openTrends();
    await fireEvent.press(bar(/^October/));
    expect(screen.getByText(exactText('About usual'))).toBeOnTheScreen();
  });

  it('Against usual: in the current month the line starts with "So far, "', async () => {
    await startApp({ today: NOV_16, entries: U });
    await openTrends();
    expect(screen.getByText(exactText('So far, 55,00 € more than usual'))).toBeOnTheScreen();
  });

  it('Against usual: a category with no average shows no such line', async () => {
    await startApp({ today: NOV_16, entries: U });
    await openTrends();
    expect(row(/^Housing/).props.accessibilityLabel).not.toMatch(/usual/);
    expect(screen.getAllByText(/usual/)).toHaveLength(1);
  });

  it('Readable: a category row label has its name, amount and the usual sentence', async () => {
    await startApp({ today: NOV_16, entries: U });
    await openTrends();
    const label = row(/^Groceries/).props.accessibilityLabel as string;
    expect(label).toMatch(partialText('Groceries'));
    expect(label).toMatch(partialText('310,00 €'));
    expect(label).toMatch(partialText('So far, 55,00 € more than usual'));
    expect(row(/^Housing/).props.accessibilityLabel).toMatch(partialText('100,00 €'));
  });
});

describe('US3 One category\'s history', () => {
  const G: SeedEntry[] = [
    inc('2026-11-01', 300000),
    exp('2026-11-03', 31000, 'groceries'),
    exp('2026-10-03', 29000, 'groceries'),
    exp('2026-09-03', 27000, 'groceries'),
  ];

  async function openGroceries() {
    await startApp({ today: NOV_16, entries: G });
    await openTrends();
    await press(/Groceries/);
  }

  it('Open: a screen titled "Groceries" shows six bars, November highlighted, and "Usually 280,00 € / month"', async () => {
    await openGroceries();
    expect(screen).toHavePathname('/trend-category');
    expect(headerTitles()).toContain('Groceries');
    for (const m of ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']) expect(screen.getByText(m)).toBeOnTheScreen();
    expect(bar(/^November/)).toBeSelected();
    expect(screen.getByText(partialText('Usually 280,00 € / month'))).toBeOnTheScreen();
  });

  it('Sentence: November 310,00 € against 280,00 € says "So far, 30,00 € more than usual"', async () => {
    await openGroceries();
    expect(screen.getByText(exactText('So far, 30,00 € more than usual'))).toBeOnTheScreen();
  });

  it('Back: Trends shows the same pill and selected month as before', async () => {
    await startApp({ today: NOV_16, entries: [...G, exp('2026-10-04', 1000, 'groceries'), sav('2026-10-05', 5000)] });
    await openTrends();
    await fireEvent.press(bar(/^October/));
    await choose('Saved');
    await choose('Spent');
    await press(/Groceries/);
    await act(async () => router.back());
    expect(screen).toHavePathname('/trends');
    expect(screen.getByRole('radio', { name: 'Spent' })).toBeSelected();
    expect(bar(/^October/)).toBeSelected();
  });
});

describe('US4 Savings goals across months', () => {
  const ENTRIES: SeedEntry[] = [
    ...['06', '07', '08', '09', '10', '11'].map((m) => inc(`2026-${m}-01`, 100000)),
    sav('2026-06-10', 20000),
    sav('2026-08-10', 30000),
    sav('2026-10-10', 20000),
    sav('2026-09-10', 100),
  ];

  it('Count: reached in June, August and October, November not yet, says "Goal reached in 3 of the last 6 months"', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: ENTRIES });
    await openTrends();
    await choose('Saved');
    expect(screen.getByText('Goal reached in 3 of the last 6 months')).toBeOnTheScreen();
  });

  it('Goal marks: the key says "Goal" on Saved only', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: ENTRIES });
    await openTrends();
    expect(screen.queryByText('Goal')).not.toBeOnTheScreen();
    await choose('Saved');
    expect(screen.getByText('Goal')).toBeOnTheScreen();
    await choose('Income');
    expect(screen.queryByText('Goal')).not.toBeOnTheScreen();
  });

  it('Goal marks: bar labels say the goal and "reached" or "not reached"; no goal, no mention', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: ENTRIES });
    await openTrends();
    await choose('Saved');
    expect(bar(/^June/).props.accessibilityLabel).toMatch(/goal 200,00[\s\u00a0\u202f]€, reached/);
    expect(bar(/^September/).props.accessibilityLabel).toMatch(/goal 200,00[\s\u00a0\u202f]€, not reached/);
    expect(bar(/^November/).props.accessibilityLabel).toMatch(/not reached/);
    await choose('Spent');
    expect(bar(/^June/).props.accessibilityLabel).not.toMatch(/goal|reached/);
  });

  it('Goal marks: a month with no income has no goal in its label', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: [inc('2026-11-01', 100000), inc('2026-08-01', 100000), sav('2026-08-10', 20000), sav('2026-09-10', 5000)] });
    await openTrends();
    await choose('Saved');
    expect(bar(/^August/).props.accessibilityLabel).toMatch(/goal 200,00[\s\u00a0\u202f]€, reached/);
    expect(bar(/^September/).props.accessibilityLabel).not.toMatch(/goal|reached/);
  });

  it('Only on Saved: the count line is not shown on Spent or Income', async () => {
    await startApp({ today: NOV_16, plans: [[20, '2026-01']], entries: ENTRIES });
    await openTrends();
    expect(screen.queryByText(/Goal reached in/)).not.toBeOnTheScreen();
    await choose('Saved');
    await choose('Income');
    expect(screen.queryByText(/Goal reached in/)).not.toBeOnTheScreen();
  });

  it('No goals: with a 0 % plan the count line is not shown', async () => {
    await startApp({ today: NOV_16, plans: [[0, '2026-01']], entries: ENTRIES });
    await openTrends();
    await choose('Saved');
    expect(screen.queryByText(/Goal reached in/)).not.toBeOnTheScreen();
  });
});

describe('Journey: home to Trends to category and back', () => {
  it('Trends, a category, back, then Open month goes to home on that month', async () => {
    await startApp({
      today: NOV_16,
      entries: [inc('2026-11-01', 300000), exp('2026-10-03', 29000, 'groceries'), exp('2026-11-03', 31000, 'groceries'), exp('2026-09-03', 1000, 'housing')],
    });
    await openTrends();
    await fireEvent.press(bar(/^October/));
    await press(/Groceries/);
    expect(screen).toHavePathname('/trend-category');
    await act(async () => router.back());
    expect(screen).toHavePathname('/trends');
    expect(bar(/^October/)).toBeSelected();
    await press(/^Open October/);
    expect(screen).toHavePathname('/');
    expect(screen.getByText(/October 2026/)).toBeOnTheScreen();
  });
});
