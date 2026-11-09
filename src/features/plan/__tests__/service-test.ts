import { migrateDbIfNeeded } from '@/db/database';
import type { IncomePlan } from '@/features/plan/rules';
import { savePlan } from '@/features/plan/service';

import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_7 = new Date(2026, 10, 7, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

const plans = (db: any) => db.getAllAsync('SELECT * FROM plan_version ORDER BY effective_month');
const items = (db: any) => db.getAllAsync('SELECT name, amount_cents FROM fixed_item ORDER BY id');

const fits: IncomePlan = {
  fixedItems: [{ name: 'House', amountCents: 100000 }],
  kept: 'savings',
  keptAmount: { unit: 'pct', pct: 30 },
};

describe('Invalid data is never saved (plan)', () => {
  it.each([
    ['fixed amount above the limit', { ...fits, fixedItems: [{ name: 'House', amountCents: 1e22 }] }],
    ['negative fixed amount', { ...fits, fixedItems: [{ name: 'House', amountCents: -100 }] }],
    ['fractional fixed amount', { ...fits, fixedItems: [{ name: 'House', amountCents: 10.5 }] }],
    ['fractional percentage', { ...fits, keptAmount: { unit: 'pct', pct: 12.5 } }],
  ] as [string, IncomePlan][])('Invalid plan (%s) is rejected and nothing is stored', async (_label, plan) => {
    const db = await newDb();

    expect(await savePlan(db, plan, NOV_7)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await plans(db)).toEqual([]);
  });
});

describe('Saving the plan', () => {
  it('Needs no income and records none', async () => {
    const db = await newDb();

    expect(await savePlan(db, fits, NOV_7)).toEqual({ ok: true });
    expect(await plans(db)).toEqual([{ effective_month: '2026-11', kept_bucket: 'savings', kept_unit: 'pct', kept_value: 30 }]);
    expect(await db.getAllAsync('SELECT * FROM expense')).toEqual([]);
  });

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

  it('Saving twice in the same month replaces the plan and its list', async () => {
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

    const result = await savePlan(db, { ...fits, keptAmount: { unit: 'pct', pct: 10 } }, NOV_7);

    expect(result.ok).toBe(false);
    db.runAsync = original;
    expect(await items(db)).toEqual([{ name: 'House', amount_cents: 100000 }]);
    expect((await plans(db))[0].kept_value).toBe(30);
  });
});
