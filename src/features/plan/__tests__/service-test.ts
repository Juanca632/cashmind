import { migrateDbIfNeeded } from '@/db/database';
import { savePlan } from '@/features/plan/service';

import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_7 = new Date(2026, 10, 7, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

const plans = (db: any) => db.getAllAsync('SELECT * FROM plan_version ORDER BY effective_month');

describe('Invalid data is never saved (plan)', () => {
  it.each([
    ['above 100', 101],
    ['negative', -5],
    ['fractional', 12.5],
    ['not a number', Number.NaN],
  ])('A percentage %s is rejected and nothing is stored', async (_label, percent) => {
    const db = await newDb();

    expect(await savePlan(db, percent, NOV_7)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await plans(db)).toEqual([]);
  });
});

describe('Saving the plan', () => {
  it('Stores the percentage from the current month and records no entry', async () => {
    const db = await newDb();

    expect(await savePlan(db, 30, NOV_7)).toEqual({ ok: true });
    expect(await plans(db)).toEqual([{ effective_month: '2026-11', savings_pct: 30 }]);
    expect(await db.getAllAsync('SELECT * FROM expense')).toEqual([]);
  });

  it('Saving twice in the same month replaces that month only', async () => {
    const db = await newDb();
    await db.runAsync("INSERT INTO plan_version VALUES ('2026-07', 25)");
    await savePlan(db, 30, NOV_7);
    await savePlan(db, 40, NOV_7);

    expect(await plans(db)).toEqual([
      { effective_month: '2026-07', savings_pct: 25 },
      { effective_month: '2026-11', savings_pct: 40 },
    ]);
  });

  it('A failure keeps the plan as it was', async () => {
    const db = await newDb();
    await savePlan(db, 30, NOV_7);
    const original = db.runAsync;
    db.runAsync = async () => {
      throw new Error('disk failure');
    };

    const result = await savePlan(db, 10, NOV_7);

    expect(result).toMatchObject({ ok: false });
    db.runAsync = original;
    expect(await plans(db)).toEqual([{ effective_month: '2026-11', savings_pct: 30 }]);
  });
});
