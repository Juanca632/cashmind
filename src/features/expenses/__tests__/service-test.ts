import { migrateDbIfNeeded } from '@/db/database';
import { addExpense, deleteExpense, editExpense } from '@/features/expenses/service';

import { RELAX_TABLES } from '../../../test-support/damaged-data';
import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_7 = new Date(2026, 10, 7, 12);
const DEC_6 = new Date(2026, 11, 6, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

const rows = (db: any) => db.getAllAsync('SELECT * FROM expense ORDER BY id');

const lunch = { date: '2026-11-05', bucket: 'leisure', amountCents: 900, note: 'Lunch' } as const;

async function withFailingWrites(db: any) {
  const fail = async () => {
    throw new Error('disk failure');
  };
  return { ...db, runAsync: fail, execAsync: fail, withTransactionAsync: fail, withExclusiveTransactionAsync: fail };
}

describe('Invalid data is never saved (expenses)', () => {
  it('An amount above the limit is rejected and nothing is stored', async () => {
    const db = await newDb();
    const result = await addExpense(db, { ...lunch, amountCents: 1e22 }, NOV_7);

    expect(result).toEqual({ ok: false, kind: 'invalid', message: expect.stringMatching(/cannot be above/) });
    expect(await rows(db)).toEqual([]);
  });

  it('The largest allowed amount can be saved and read back', async () => {
    const db = await newDb();
    expect(await addExpense(db, { ...lunch, amountCents: 90_000_000 }, NOV_7)).toEqual({ ok: true });
    expect(await rows(db)).toEqual([expect.objectContaining({ amount_cents: 90_000_000 })]);
    expect(await deleteExpense(db, 1)).toEqual({ ok: true });
  });

  it.each([
    ['zero', 0],
    ['negative', -500],
  ])('Amount %s is rejected and nothing is stored', async (_label, amountCents) => {
    const db = await newDb();
    const result = await addExpense(db, { ...lunch, amountCents }, NOV_7);

    expect(result).toEqual({ ok: false, kind: 'invalid', message: expect.stringMatching(/greater than 0/) });
    expect(await rows(db)).toEqual([]);
  });

  it('A fractional amount is rejected and nothing is stored', async () => {
    const db = await newDb();
    const result = await addExpense(db, { ...lunch, amountCents: 12.5 }, NOV_7);

    expect(result.ok).toBe(false);
    expect(await rows(db)).toEqual([]);
  });

  it('An unknown category is rejected and nothing is stored', async () => {
    const db = await newDb();
    const result = await addExpense(db, { ...lunch, bucket: 'gifts' as any }, NOV_7);

    expect(result).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await rows(db)).toEqual([]);
  });

  it.each([['in the future', '2026-11-08']])('An expense dated %s is rejected and nothing is stored', async (_label, date) => {
    const db = await newDb();
    const result = await addExpense(db, { ...lunch, date }, NOV_7);

    expect(result).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await rows(db)).toEqual([]);
  });

  it('A past month: edit with a valid amount is stored', async () => {
    const db = await newDb();
    await db.runAsync(
      "INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-30', 'leisure', 900, 'Lunch')",
    );

    const result = await editExpense(db, 1, { ...lunch, date: '2026-11-30', amountCents: 1500 }, DEC_6);

    expect(result).toEqual({ ok: true });
    expect(await rows(db)).toEqual([expect.objectContaining({ id: 1, date: '2026-11-30', amount_cents: 1500 })]);
  });

  it('A past month: delete is stored', async () => {
    const db = await newDb();
    await db.runAsync(
      "INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-30', 'leisure', 900, 'Lunch')",
    );

    expect(await deleteExpense(db, 1)).toEqual({ ok: true });
    expect(await rows(db)).toEqual([]);
  });

  it('Validation uses the date at the moment of saving', async () => {
    const db = await newDb();
    const tomorrow = { ...lunch, date: '2026-11-08' };

    expect(await addExpense(db, tomorrow, NOV_7)).toMatchObject({ ok: false });
    expect(await addExpense(db, tomorrow, new Date(2026, 10, 8, 12))).toEqual({ ok: true });
  });

  it('Damaged data found while validating an edit or delete stores nothing and is reported as failed', async () => {
    const db = await newDb();
    for (const sql of RELAX_TABLES) await db.execAsync(sql);
    await db.runAsync(
      "INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-05', 'leisure', 12.5, 'Lunch')",
    );
    const before = await rows(db);

    const edited = await editExpense(db, 1, lunch, NOV_7);
    const deleted = await deleteExpense(db, 1);

    expect(edited).toMatchObject({ ok: false, kind: 'failed' });
    expect(deleted).toMatchObject({ ok: false, kind: 'failed' });
    expect(await rows(db)).toEqual(before);
  });
});

describe('A failed change is always explained (expense writes)', () => {
  it('Storage failure is reported, never thrown', async () => {
    const db = await newDb();
    await addExpense(db, lunch, NOV_7);
    const broken = await withFailingWrites(db);

    const added = await addExpense(broken, lunch, NOV_7);
    const edited = await editExpense(broken, 1, { ...lunch, amountCents: 1500 }, NOV_7);
    const deleted = await deleteExpense(broken, 1);

    for (const result of [added, edited, deleted]) {
      expect(result).toEqual({ ok: false, kind: 'failed', message: expect.stringMatching(/could not be saved/i) });
    }
    expect(await rows(db)).toEqual([expect.objectContaining({ amount_cents: 900 })]);
  });
});

describe('Fixed expenses count by themselves', () => {
  it('A new expense cannot be fixed and nothing is stored', async () => {
    const db = await newDb();

    expect(await addExpense(db, { ...lunch, bucket: 'fixed' }, NOV_7)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await rows(db)).toEqual([]);
  });

  it('An expense cannot be moved into fixed', async () => {
    const db = await newDb();
    await addExpense(db, lunch, NOV_7);
    const [{ id }] = await rows(db);

    expect(await editExpense(db, id, { ...lunch, bucket: 'fixed' }, NOV_7)).toMatchObject({ ok: false, kind: 'invalid' });
    expect((await rows(db))[0].bucket).toBe('leisure');
  });

  it('An expense already recorded as fixed can stay fixed', async () => {
    const db = await newDb();
    await db.execAsync("INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-05', 'fixed', 90000, 'Rent')");
    const [{ id }] = await rows(db);

    expect(await editExpense(db, id, { date: '2026-11-05', bucket: 'fixed', amountCents: 95000, note: 'Rent' }, NOV_7)).toMatchObject({ ok: true });
    expect((await rows(db))[0].amount_cents).toBe(95000);
  });
});
