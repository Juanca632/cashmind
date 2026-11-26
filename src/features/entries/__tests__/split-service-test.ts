import { migrateDbIfNeeded } from '@/db/database';
import { addPocket, addSavings } from '@/features/entries/service';

import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_15 = new Date(2026, 10, 15, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  for (const name of ['Emergency', 'Travel', 'Investing']) await addPocket(db as any, { name, startingCents: 0, emoji: '', color: 'blue' });
  return db as any;
}

const entries = (db: any) => db.getAllAsync('SELECT date, kind, amount_cents, note, pocket_id FROM entry ORDER BY id');
const items = (db: any) => db.getAllAsync('SELECT * FROM recurring');

describe('Split it across pockets - saving (service)', () => {
  it('Save: one saving per pocket with an amount above 0, dated today, without a note', async () => {
    const db = await newDb();
    const result = await addSavings(db, [{ pocketId: 1, amountCents: 30000 }, { pocketId: 2, amountCents: 0 }, { pocketId: 3, amountCents: 20000 }], NOV_15);

    expect(result).toEqual({ ok: true });
    expect(await entries(db)).toEqual([
      { date: '2026-11-15', kind: 'savings', amount_cents: 30000, note: '', pocket_id: 1 },
      { date: '2026-11-15', kind: 'savings', amount_cents: 20000, note: '', pocket_id: 3 },
    ]);
  });

  it('Save: does not repeat the savings', async () => {
    const db = await newDb();
    await addSavings(db, [{ pocketId: 1, amountCents: 100 }], NOV_15);
    expect(await items(db)).toEqual([]);
  });

  it('Save: never changes or deletes an existing entry', async () => {
    const db = await newDb();
    await addSavings(db, [{ pocketId: 1, amountCents: 100 }], NOV_15);
    await addSavings(db, [{ pocketId: 1, amountCents: 250 }, { pocketId: 2, amountCents: 300 }], NOV_15);

    expect((await entries(db)).map((e: any) => [e.pocket_id, e.amount_cents])).toEqual([[1, 100], [1, 250], [2, 300]]);
  });

  it('Nothing typed: with no amount above 0 it is refused and nothing is recorded', async () => {
    const db = await newDb();
    expect((await addSavings(db, [], NOV_15)).ok).toBe(false);
    expect((await addSavings(db, [{ pocketId: 1, amountCents: 0 }, { pocketId: 2, amountCents: 0 }], NOV_15)).ok).toBe(false);
    expect(await entries(db)).toEqual([]);
  });

  it('All or nothing: a pocket that no longer exists refuses the whole split', async () => {
    const db = await newDb();
    const result = await addSavings(db, [{ pocketId: 1, amountCents: 100 }, { pocketId: 77, amountCents: 100 }], NOV_15);
    expect(result.ok).toBe(false);
    expect(await entries(db)).toEqual([]);
  });

  it('All or nothing: an invalid amount refuses the whole split', async () => {
    const db = await newDb();
    expect((await addSavings(db, [{ pocketId: 1, amountCents: 100 }, { pocketId: 2, amountCents: -5 }], NOV_15)).ok).toBe(false);
    expect((await addSavings(db, [{ pocketId: 1, amountCents: 100 }, { pocketId: 2, amountCents: 1.5 }], NOV_15)).ok).toBe(false);
    expect(await entries(db)).toEqual([]);
  });

  it('Amounts: an amount over the app\'s limit is refused', async () => {
    const db = await newDb();
    expect((await addSavings(db, [{ pocketId: 1, amountCents: Number.MAX_SAFE_INTEGER }], NOV_15)).ok).toBe(false);
    expect(await entries(db)).toEqual([]);
  });
});
