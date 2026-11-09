import { migrateDbIfNeeded } from '@/db/database';
import { removeMonthIncome, savePlan, setMonthIncome } from '@/features/plan/service';
import type { IncomePlan } from '@/features/plan/rules';

import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_7 = new Date(2026, 10, 7, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

const plans = (db: any) => db.getAllAsync('SELECT * FROM plan_version ORDER BY effective_month');
const overrides = (db: any) => db.getAllAsync('SELECT * FROM month_income_override ORDER BY month');

const fits: IncomePlan = {
  incomeCents: 200000,
  fixedItems: [{ name: 'House', amountCents: 100000 }],
  kept: 'savings',
  keptAmount: { unit: 'pct', pct: 30 },
};

describe('Invalid data is never saved (plan)', () => {
  it('A plan income above the limit is rejected and nothing is stored', async () => {
    const db = await newDb();
    const result = await savePlan(db, { ...fits, incomeCents: 1e22 }, NOV_7);

    expect(result).toEqual({ ok: false, kind: 'invalid', message: expect.stringMatching(/cannot be above/) });
    expect(await plans(db)).toEqual([]);
  });

  it('A fixed amount above the limit is rejected and nothing is stored', async () => {
    const db = await newDb();
    const huge = [{ name: 'House', amountCents: 1e22 }];
    expect((await savePlan(db, { ...fits, fixedItems: huge }, NOV_7)).ok).toBe(false);
    expect(await plans(db)).toEqual([]);
  });

  it('A month income above the limit is rejected and nothing is stored', async () => {
    const db = await newDb();
    const result = await setMonthIncome(db, 90_000_001, NOV_7);

    expect(result).toEqual({ ok: false, kind: 'invalid', message: expect.stringMatching(/cannot be above/) });
    expect(await overrides(db)).toEqual([]);
  });

  it('A plan that exceeds the income is rejected with the excess and nothing is stored', async () => {
    const db = await newDb();
    const tooMuch: IncomePlan = { ...fits, keptAmount: { unit: 'pct', pct: 60 } };

    const result = await savePlan(db, tooMuch, NOV_7);

    expect(result).toMatchObject({ ok: false, kind: 'invalid' });
    // 1000,00 fixed + 60 % of 2000,00 = 2200,00, which is 200,00 over.
    expect((result as { message: string }).message).toMatch(/200,00[\s  ]€/);
    expect(await plans(db)).toEqual([]);
  });

  it('A rejected plan leaves an existing plan unchanged', async () => {
    const db = await newDb();
    await savePlan(db, fits, NOV_7);
    const before = await plans(db);

    const result = await savePlan(db, { ...fits, keptAmount: { unit: 'pct', pct: 60 } }, NOV_7);

    expect(result.ok).toBe(false);
    expect(await plans(db)).toEqual(before);
  });

  it.each([
    ['zero income', { ...fits, incomeCents: 0 }],
    ['negative fixed amount', { ...fits, fixedItems: [{ name: 'House', amountCents: -100 }] }],
    ['fractional fixed amount', { ...fits, fixedItems: [{ name: 'House', amountCents: 10.5 }] }],
    ['fractional percentage', { ...fits, keptAmount: { unit: 'pct', pct: 12.5 } }],
  ] as [string, IncomePlan][])('Invalid plan (%s) is rejected and nothing is stored', async (_label, plan) => {
    const db = await newDb();

    expect(await savePlan(db, plan, NOV_7)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await plans(db)).toEqual([]);
  });

  it.each([['zero', 0], ['negative', -100], ['fractional', 1000.5]])(
    'A %s month income is rejected and nothing is stored',
    async (_label, cents) => {
      const db = await newDb();
      const result = await setMonthIncome(db, cents, NOV_7);

      expect(result).toMatchObject({ ok: false, kind: 'invalid' });
      if (cents === 0) expect((result as { message: string }).message).toMatch(/greater than 0/);
      expect(await overrides(db)).toEqual([]);
    },
  );

  it('Valid input is stored for the month of today and reported as successful', async () => {
    const db = await newDb();

    expect(await savePlan(db, fits, NOV_7)).toEqual({ ok: true });
    expect(await plans(db)).toEqual([expect.objectContaining({ effective_month: '2026-11', income_cents: 200000 })]);

    expect(await setMonthIncome(db, 250000, NOV_7)).toEqual({ ok: true });
    expect(await overrides(db)).toEqual([{ month: '2026-11', income_cents: 250000 }]);

    expect(await removeMonthIncome(db, NOV_7)).toEqual({ ok: true });
    expect(await overrides(db)).toEqual([]);
  });

  it('Month income acts only on the month of today, not on other months', async () => {
    const db = await newDb();
    await db.runAsync("INSERT INTO month_income_override (month, income_cents) VALUES ('2026-10', 111100)");

    await setMonthIncome(db, 250000, NOV_7);
    await removeMonthIncome(db, new Date(2026, 11, 2, 12));

    expect(await overrides(db)).toEqual([
      { month: '2026-10', income_cents: 111100 },
      { month: '2026-11', income_cents: 250000 },
    ]);
  });
});

describe('A failed change is always explained (plan writes)', () => {
  it('Storage failure is reported, never thrown', async () => {
    const db = await newDb();
    const fail = async () => {
      throw new Error('disk failure');
    };
    const broken = { ...db, runAsync: fail, execAsync: fail, withTransactionAsync: fail, withExclusiveTransactionAsync: fail };

    const results = [
      await savePlan(broken, fits, NOV_7),
      await setMonthIncome(broken, 250000, NOV_7),
      await removeMonthIncome(broken, NOV_7),
    ];

    for (const result of results) {
      expect(result).toEqual({ ok: false, kind: 'failed', message: expect.stringMatching(/could not be saved/i) });
    }
    expect(await plans(db)).toEqual([]);
    expect(await overrides(db)).toEqual([]);
  });
});

describe('Saving the list of fixed expenses', () => {
  const items = (db: any) => db.getAllAsync('SELECT name, amount_cents FROM fixed_item ORDER BY id');

  it('Stores the items in order, trimming their names', async () => {
    const db = await newDb();
    const list = [
      { name: ' House ', amountCents: 70000 },
      { name: 'Transport', amountCents: 6000 },
    ];
    await savePlan(db, { ...fits, fixedItems: list }, NOV_7);

    expect(await items(db)).toEqual([
      { name: 'House', amount_cents: 70000 },
      { name: 'Transport', amount_cents: 6000 },
    ]);
  });

  it('Saving twice in the same month replaces the list', async () => {
    const db = await newDb();
    await savePlan(db, fits, NOV_7);
    await savePlan(db, { ...fits, fixedItems: [{ name: 'Rent', amountCents: 50000 }] }, NOV_7);

    expect(await items(db)).toEqual([{ name: 'Rent', amount_cents: 50000 }]);
    expect(await plans(db)).toHaveLength(1);
  });

  it('A failure keeps the plan and its list as they were', async () => {
    const db = await newDb();
    await savePlan(db, fits, NOV_7);
    const original = db.runAsync;
    db.runAsync = async (sql: string, ...params: unknown[]) => {
      if (sql.startsWith('INSERT INTO fixed_item')) throw new Error('disk failure');
      return original(sql, ...params);
    };

    const result = await savePlan(db, { ...fits, incomeCents: 300000 }, NOV_7);

    expect(result.ok).toBe(false);
    db.runAsync = original;
    expect(await items(db)).toEqual([{ name: 'House', amount_cents: 100000 }]);
    expect((await plans(db))[0].income_cents).toBe(200000);
  });
});
