import { router } from 'expo-router';
import { act, screen } from 'expo-router/testing-library';

import { answerDialog, choose, dumpDevice, expectDialog, expectNoDialog, exactText, partialText, press, reopenApp, startApp, type, type SeedEntry } from '../test-support/app';
import { seedDevice } from '../test-support/fake-sqlite';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => jest.useRealTimers());

const TODAY: [number, number, number] = [2026, 10, 24];
const salary: SeedEntry = { date: '2026-11-01', kind: 'income', amountCents: 300000, note: 'Salary', category: 'salary' };
const groceries: SeedEntry = { date: '2026-11-03', kind: 'expense', amountCents: 5000, note: 'Groceries', category: 'groceries' };
const cinema: SeedEntry = { date: '2026-11-04', kind: 'expense', amountCents: 1250, note: 'Cinema', category: 'leisure' };
const rent: SeedEntry = { date: '2026-11-05', kind: 'expense', amountCents: 4500000, note: 'Rent', category: 'housing' };
const PLAN: [number, string][] = [[0, '2026-01']];

const store = (value: string) => [`INSERT INTO setting (key, value) VALUES ('currency', '${value}')`];
const back = () =>
  act(async () => {
    router.back();
  });
type Name = 'Euro' | 'US dollar' | 'Colombian peso';
/** Opens Settings, selects a currency and confirms the dialog. */
const pick = async (name: Name) => {
  await press('Settings');
  await choose(name);
  await answerDialog('Change');
};
const currencyRows = async () => {
  let rows: unknown[] = [];
  await seedDevice(async (db) => {
    rows = await db.getAllAsync("SELECT value FROM setting WHERE key = 'currency'");
  });
  return rows;
};
const pickAndGoBack = async (name: Name) => {
  await pick(name);
  await back();
};
const shown = (text: string) => expect(screen.getAllByText(exactText(text)).length).toBeGreaterThan(0);
/** For screens left behind another one: Android hides them from the screen reader, but they are still rendered. */
const shownBehind = (text: string) =>
  expect(screen.getAllByText(exactText(text), { includeHiddenElements: true }).length).toBeGreaterThan(0);
const notShown = (text: string) => expect(screen.queryByText(exactText(text))).not.toBeOnTheScreen();
const amountField = () => screen.getByLabelText('Amount');
const storedAmounts = async () => {
  let rows: unknown[] = [];
  await seedDevice(async (db) => {
    rows = await db.getAllAsync('SELECT amount_cents FROM entry ORDER BY amount_cents');
  });
  return rows.map((r: any) => r.amount_cents);
};

/** Every visible text of the rendered tree, in reading order. */
function texts(): string[] {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (!node) return;
    if (typeof node === 'string') return void out.push(node);
    if (Array.isArray(node)) return node.forEach(walk);
    walk((node as { children?: unknown }).children);
  };
  walk(screen.toJSON());
  return out;
}

describe('Keep my budget in my own currency', () => {
  it('Default: Settings has a Currency section with Euro selected, between Security and About', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    await press('Settings');

    expect(screen.getByLabelText('Currency')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Euro' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'US dollar' })).not.toBeSelected();
    expect(screen.getByRole('radio', { name: 'Colombian peso' })).not.toBeSelected();
    const all = texts();
    expect(all.indexOf('Security')).toBeGreaterThan(-1);
    expect(all.indexOf('Currency')).toBeGreaterThan(all.indexOf('Security'));
    expect(all.indexOf('About')).toBeGreaterThan(all.indexOf('Currency'));
    shownBehind('3 000 €');
    shownBehind('50,00 €');
  });

  it('Default: a user who never opens Settings sees euros as before, and the form takes euros', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    expect(screen.getByLabelText(partialText('Left to spend: 2 950,00 €'))).toBeOnTheScreen();
    await press('Add expense');
    expect(screen.getByText('€')).toBeOnTheScreen();
    expect(amountField().props.placeholder).toBe('0,00');
    expect(amountField().props.keyboardType).toBe('decimal-pad');
  });

  it('Explained: Settings says amounts are not converted', async () => {
    await startApp({ today: TODAY });
    await press('Settings');
    expect(screen.getByText('Amounts are not converted when you change the currency.')).toBeOnTheScreen();
  });

  it('Pick dollars: every amount shows in the US format', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries, cinema] });
    await pick('US dollar');

    expect(screen.getByRole('radio', { name: 'US dollar' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Euro' })).not.toBeSelected();
    await back();
    shown('$3,000');
    shown('$50.00');
    shown('$12.50');
    expect(screen.getByLabelText(partialText('Left to spend: $2,937.50'))).toBeOnTheScreen();
    expect(screen.queryByText(partialText('€'))).not.toBeOnTheScreen();
  });

  it('Pick dollars: the entry form shows "$" before the amount with "0.00" as placeholder', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary] });
    await pickAndGoBack('US dollar');
    await press('Add expense');

    expect(screen.getByText('$')).toBeOnTheScreen();
    expect(screen.queryByText('€')).not.toBeOnTheScreen();
    expect(amountField().props.placeholder).toBe('0.00');
    expect(amountField().props.keyboardType).toBe('decimal-pad');
  });

  it('Pick pesos: every amount shows in the Colombian format with no decimals', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    await pickAndGoBack('Colombian peso');

    shown('$ 3.000');
    shown('$ 50');
    expect(screen.getByLabelText(partialText('Left to spend: $ 2.950'))).toBeOnTheScreen();
    expect(screen.queryByText(partialText('€'))).not.toBeOnTheScreen();
  });

  it('Pick pesos: the form shows "$" before the amount, "0" as placeholder and a digits-only keyboard', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary] });
    await pickAndGoBack('Colombian peso');
    await press('Add expense');

    expect(screen.getByText('$')).toBeOnTheScreen();
    expect(amountField().props.placeholder).toBe('0');
    expect(amountField().props.keyboardType).toBe('number-pad');
  });

  it('Pick pesos: an amount with cents shows without them, cut towards zero, and is stored unchanged (032)', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, cinema] });
    await pickAndGoBack('Colombian peso');
    shown('$ 12');
    notShown('$ 12,50');
    expect(await storedAmounts()).toEqual([1250, 300000]);
  });

  it('No conversion: 50,00 € shows "$ 50" in pesos and 50,00 € again after switching back; nothing stored changes', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    const before = await dumpDevice();
    shown('50,00 €');

    await pickAndGoBack('Colombian peso');
    shown('$ 50');
    notShown('50,00 €');
    await pickAndGoBack('US dollar');
    shown('$50.00');
    await pickAndGoBack('Euro');
    shown('50,00 €');
    notShown('$ 50');

    expect(await dumpDevice()).toEqual(before);
  });

  it('Remembered: after reopening the app the pesos are still selected and used everywhere', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    await pickAndGoBack('Colombian peso');
    await reopenApp();

    expect((await screen.findAllByText(exactText('$ 3.000'))).length).toBeGreaterThan(0);
    shown('$ 50');
    await press('Settings');
    expect(screen.getByRole('radio', { name: 'Colombian peso' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Euro' })).not.toBeSelected();
  });

  it('Remembered: euro picked again after dollars is remembered too', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    await pickAndGoBack('US dollar');
    await pickAndGoBack('Euro');
    await reopenApp();
    expect((await screen.findAllByText(exactText('3 000 €'))).length).toBeGreaterThan(0);
  });

  it('Stored: the choice is kept in the settings table under "currency"', async () => {
    await startApp({ today: TODAY });
    await pickAndGoBack('US dollar');
    let rows: unknown[] = [];
    await seedDevice(async (db) => {
      rows = await db.getAllAsync("SELECT value FROM setting WHERE key = 'currency'");
    });
    expect(rows).toEqual([{ value: 'USD' }]);
  });

  it('Right away: the screens behind Settings already use the currency, and so do My plan, Activity and Trends', async () => {
    await startApp({ today: TODAY, plans: [[20, '2026-01']], entries: [salary, groceries] });
    await pick('US dollar');
    // Still on Settings: the home screen behind it has already changed.
    expect(screen).toHavePathname('/settings');
    shownBehind('$3,000');
    shownBehind('$50.00');
    await back();
    expect(screen).toHavePathname('/');
    shown('$50.00');

    await press('My plan');
    expect(screen.getByText(partialText('$600'))).toBeOnTheScreen();
    expect(screen.queryByText(partialText('€'))).not.toBeOnTheScreen();
    await back();

    await press(/^See trends/);
    expect(screen).toHavePathname('/trends');
    expect(screen.getAllByText(partialText('$')).length).toBeGreaterThan(0);
    expect(screen.queryByText(partialText('€'))).not.toBeOnTheScreen();
  });

  it('Right away: My plan shows the goal in pesos', async () => {
    await startApp({ today: TODAY, plans: [[20, '2026-01']], entries: [salary] });
    await pickAndGoBack('Colombian peso');
    await press('My plan');
    expect(screen.getByText(partialText('$ 600'))).toBeOnTheScreen();
    expect(screen.queryByText(partialText('€'))).not.toBeOnTheScreen();
  });

  it('Messages: My plan with no income asks for it without naming a currency', async () => {
    await startApp({ today: TODAY });
    await press('My plan');
    expect(screen.getByText("Add this month's income to see the amount.")).toBeOnTheScreen();
  });

  it('Unreadable setting: the app uses Euro and leaves the stored value as it was', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries], raw: store('dinar') });
    shown('3 000 €');
    await press('Settings');
    expect(screen.getByRole('radio', { name: 'Euro' })).toBeSelected();
    let rows: unknown[] = [];
    await seedDevice(async (db) => {
      rows = await db.getAllAsync("SELECT value FROM setting WHERE key = 'currency'");
    });
    expect(rows).toEqual([{ value: 'dinar' }]);
  });
});

describe('Keep my budget in my own currency: asked first', () => {
  it.each([
    ['US dollar'],
    ['Colombian peso'],
  ] as const)('Asked first: selecting %s opens "Change to %s?" with the explanation', async (name) => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    await press('Settings');
    await choose(name);

    expectDialog(`Change to ${name}?`);
    expect(
      screen.getByText(`Your amounts keep their numbers and will show in ${name}. Nothing is converted.`),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Change' })).toBeOnTheScreen();
    // Nothing applies before the answer.
    expect(screen.getByRole('radio', { name: 'Euro' })).toBeSelected();
    expect(await currencyRows()).toEqual([]);
  });

  it('Asked first: Cancel keeps Euro selected, nothing is stored and amounts do not change', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    await press('Settings');
    await choose('US dollar');
    await answerDialog('Cancel');

    expectNoDialog();
    expect(screen.getByRole('radio', { name: 'Euro' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'US dollar' })).not.toBeSelected();
    shownBehind('3 000 €');
    expect(await currencyRows()).toEqual([]);
    await reopenApp();
    expect((await screen.findAllByText(exactText('3 000 €'))).length).toBeGreaterThan(0);
  });

  it('Asked first: Cancel after a previous change keeps the chosen currency, not Euro', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary], raw: store('COP') });
    await press('Settings');
    await choose('US dollar');
    await answerDialog('Cancel');
    expect(screen.getByRole('radio', { name: 'Colombian peso' })).toBeSelected();
    expect(await currencyRows()).toEqual([{ value: 'COP' }]);
  });

  it('Asked first: Change closes the dialog, selects the currency and applies it at once', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, groceries] });
    await press('Settings');
    await choose('Colombian peso');
    await answerDialog('Change');

    expectNoDialog();
    expect(screen.getByRole('radio', { name: 'Colombian peso' })).toBeSelected();
    shownBehind('$ 3.000');
    expect(await currencyRows()).toEqual([{ value: 'COP' }]);
  });

  it('Asked first: it asks every time, also when going back to Euro', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary], raw: store('USD') });
    await press('Settings');
    await choose('Euro');
    expectDialog('Change to Euro?');
    await answerDialog('Change');
    expect(screen.getByRole('radio', { name: 'Euro' })).toBeSelected();
  });

  it('Asked first: it asks even when there is no data yet', async () => {
    await startApp({ today: TODAY });
    await press('Settings');
    await choose('US dollar');
    expectDialog('Change to US dollar?');
  });
});

describe('Type amounts in that currency', () => {
  it.each([
    ['EUR', '12,50'],
    ['EUR', '12.50'],
    ['USD', '12,50'],
    ['USD', '12.50'],
  ])('Euro and dollar decimals: %s with "%s" saves 12.50', async (code, typed) => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary], raw: store(code) });
    await press('Add expense');
    await type('Amount', typed);
    await press('Add expense');

    expect(screen).toHavePathname('/');
    expect(await storedAmounts()).toEqual([1250, 300000]);
    shown(code === 'EUR' ? '12,50 €' : '$12.50');
  });

  it('Pesos: typing "45000" saves $ 45.000', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary], raw: store('COP') });
    await press('Add expense');
    await type('Amount', '45000');
    await press('Add expense');

    expect(await storedAmounts()).toEqual([300000, 4500000]);
    shown('$ 45.000');
  });

  it('Pesos: "45.000" with a thousands dot is also read as 45 000', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary], raw: store('COP') });
    await press('Add expense');
    await type('Amount', '45.000');
    await press('Add expense');

    expect(await storedAmounts()).toEqual([300000, 4500000]);
    shown('$ 45.000');
  });

  it('Pesos: income is recorded in pesos too', async () => {
    await startApp({ today: TODAY, raw: store('COP') });
    await press('Add expense');
    await choose('Income');
    await type('Amount', '2500000');
    await press('Add income');
    expect(await storedAmounts()).toEqual([250000000]);
    expect(screen.getAllByText(partialText('$ 2.500.000')).length).toBeGreaterThan(0);
  });

  it.each([
    ['EUR', '12,50', '45000,00'],
    ['USD', '12.50', '45000.00'],
    ['COP', '12,50', '45000'],
  ])('Editing: in %s an existing entry opens as "%s" and 45 000 as "%s"', async (code, small, big) => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, cinema, rent], raw: store(code) });
    await press(/Cinema/);
    expect(amountField().props.value).toBe(small);
    await back();
    await press(/Rent/);
    expect(amountField().props.value).toBe(big);
  });

  it('Editing: saving an entry without touching the amount does not change it, in pesos', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary, rent], raw: store('COP') });
    await press(/Rent/);
    await type('Amount', '46000');
    await press('Save changes');
    expect(await storedAmounts()).toEqual([300000, 4600000]);
    shown('$ 46.000');
  });

  it.each([
    ['EUR', '900000000,01', '€'],
    ['USD', '900000000.01', '$'],
    ['COP', '900000001', '$'],
  ])('Too large: in %s, %s is refused with "This amount is too large." and nothing is saved', async (code, typed) => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary], raw: store(code) });
    await press('Add expense');
    await type('Amount', typed);
    await press('Add expense');

    expect(screen.getByText('This amount is too large.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/entry');
    expect(await storedAmounts()).toEqual([300000]);
  });

  it.each([
    ['EUR', '900000000'],
    ['USD', '900000000'],
    ['COP', '900000000'],
  ])('Too large: in %s, exactly %s is the largest amount and saves', async (code, typed) => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary], raw: store(code) });
    await press('Add expense');
    await type('Amount', typed);
    await press('Add expense');

    expect(screen.queryByText('This amount is too large.')).not.toBeOnTheScreen();
    expect(await storedAmounts()).toEqual([300000, 90_000_000_000]);
  });

  it('Messages: a zero amount says "The amount must be greater than 0." without a currency', async () => {
    await startApp({ today: TODAY, plans: PLAN, entries: [salary], raw: store('USD') });
    await press('Add expense');
    await type('Amount', '0');
    await press('Add expense');
    expect(screen.getByText('The amount must be greater than 0.')).toBeOnTheScreen();
    expect(await storedAmounts()).toEqual([300000]);
  });
});
