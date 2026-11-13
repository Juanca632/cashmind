import { migrateDbIfNeeded } from '@/db/database';
import { addEntry, deleteEntry, editEntry } from '@/features/entries/service';

import { RELAX_TABLES } from '../../../test-support/damaged-data';
import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_7 = new Date(2026, 10, 7, 12);
const DEC_6 = new Date(2026, 11, 6, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

const rows = (db: any) => db.getAllAsync('SELECT * FROM entry ORDER BY id');

const lunch = { date: '2026-11-05', kind: 'expense', amountCents: 900, note: 'Lunch', category: 'eating_out' } as const;

async function withFailingWrites(db: any) {
  const fail = async () => {
    throw new Error('disk failure');
  };
  return { ...db, runAsync: fail, execAsync: fail, withTransactionAsync: fail, withExclusiveTransactionAsync: fail };
}

describe('Invalid data is never saved (expenses)', () => {
  it('An amount above the limit is rejected and nothing is stored', async () => {
    const db = await newDb();
    const result = await addEntry(db, { ...lunch, amountCents: 1e22 }, NOV_7);

    expect(result).toEqual({ ok: false, kind: 'invalid', message: expect.stringMatching(/cannot be above/) });
    expect(await rows(db)).toEqual([]);
  });

  it('The largest allowed amount can be saved and read back', async () => {
    const db = await newDb();
    expect(await addEntry(db, { ...lunch, amountCents: 90_000_000 }, NOV_7)).toEqual({ ok: true });
    expect(await rows(db)).toEqual([expect.objectContaining({ amount_cents: 90_000_000 })]);
    expect(await deleteEntry(db, 1)).toEqual({ ok: true });
  });

  it.each([
    ['zero', 0],
    ['negative', -500],
  ])('Amount %s is rejected and nothing is stored', async (_label, amountCents) => {
    const db = await newDb();
    const result = await addEntry(db, { ...lunch, amountCents }, NOV_7);

    expect(result).toEqual({ ok: false, kind: 'invalid', message: expect.stringMatching(/greater than 0/) });
    expect(await rows(db)).toEqual([]);
  });

  it('A fractional amount is rejected and nothing is stored', async () => {
    const db = await newDb();
    const result = await addEntry(db, { ...lunch, amountCents: 12.5 }, NOV_7);

    expect(result.ok).toBe(false);
    expect(await rows(db)).toEqual([]);
  });

  it('An unknown category is rejected and nothing is stored', async () => {
    const db = await newDb();
    const result = await addEntry(db, { ...lunch, kind: 'gifts' as any, category: 'other' }, NOV_7);

    expect(result).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await rows(db)).toEqual([]);
  });

  it.each([['in the future', '2026-11-08']])('An expense dated %s is rejected and nothing is stored', async (_label, date) => {
    const db = await newDb();
    const result = await addEntry(db, { ...lunch, date }, NOV_7);

    expect(result).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await rows(db)).toEqual([]);
  });

  it('A past month: edit with a valid amount is stored', async () => {
    const db = await newDb();
    await db.runAsync(
      "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-30', 'expense', 900, 'Lunch')",
    );

    const result = await editEntry(db, 1, { ...lunch, date: '2026-11-30', amountCents: 1500 }, DEC_6);

    expect(result).toEqual({ ok: true });
    expect(await rows(db)).toEqual([expect.objectContaining({ id: 1, date: '2026-11-30', amount_cents: 1500 })]);
  });

  it('A past month: delete is stored', async () => {
    const db = await newDb();
    await db.runAsync(
      "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-30', 'expense', 900, 'Lunch')",
    );

    expect(await deleteEntry(db, 1)).toEqual({ ok: true });
    expect(await rows(db)).toEqual([]);
  });

  it('Validation uses the date at the moment of saving', async () => {
    const db = await newDb();
    const tomorrow = { ...lunch, date: '2026-11-08' };

    expect(await addEntry(db, tomorrow, NOV_7)).toMatchObject({ ok: false });
    expect(await addEntry(db, tomorrow, new Date(2026, 10, 8, 12))).toEqual({ ok: true });
  });

  it('Damaged data found while validating an edit or delete stores nothing and is reported as failed', async () => {
    const db = await newDb();
    for (const sql of RELAX_TABLES) await db.execAsync(sql);
    await db.runAsync(
      "INSERT INTO entry (date, kind, amount_cents, note) VALUES ('2026-11-05', 'expense', 12.5, 'Lunch')",
    );
    const before = await rows(db);

    const edited = await editEntry(db, 1, lunch, NOV_7);
    const deleted = await deleteEntry(db, 1);

    expect(edited).toMatchObject({ ok: false, kind: 'failed' });
    expect(deleted).toMatchObject({ ok: false, kind: 'failed' });
    expect(await rows(db)).toEqual(before);
  });
});

describe('A failed change is always explained (expense writes)', () => {
  it('Storage failure is reported, never thrown', async () => {
    const db = await newDb();
    await addEntry(db, lunch, NOV_7);
    const broken = await withFailingWrites(db);

    const added = await addEntry(broken, lunch, NOV_7);
    const edited = await editEntry(broken, 1, { ...lunch, amountCents: 1500 }, NOV_7);
    const deleted = await deleteEntry(broken, 1);

    const saveFailed = { ok: false, kind: 'failed', message: 'The entry could not be saved. Please try again.' };
    expect(added).toEqual(saveFailed);
    expect(edited).toEqual(saveFailed);
    expect(deleted).toEqual({ ok: false, kind: 'failed', message: 'The entry could not be deleted. Please try again.' });
    expect(await rows(db)).toEqual([expect.objectContaining({ amount_cents: 900 })]);
  });
});

describe('Entries that do not exist or edits that are invalid', () => {
  it('Editing an id that does not exist says the entry no longer exists and stores nothing', async () => {
    const db = await newDb();
    await addEntry(db, lunch, NOV_7);
    const before = await rows(db);

    const result = await editEntry(db, 999, { ...lunch, amountCents: 1500 }, NOV_7);

    expect(result).toMatchObject({ ok: false, message: 'This entry no longer exists.' });
    expect(await rows(db)).toEqual(before);
  });

  it('Deleting an id that does not exist says the entry no longer exists and deletes nothing', async () => {
    const db = await newDb();
    await addEntry(db, lunch, NOV_7);
    const before = await rows(db);

    const result = await deleteEntry(db, 999);

    expect(result).toMatchObject({ ok: false, message: 'This entry no longer exists.' });
    expect(await rows(db)).toEqual(before);
  });

  it.each([
    ['a zero amount', { amountCents: 0 }, /greater than 0/],
    ['an unknown kind', { kind: 'gifts' as never, category: 'other' as const }, undefined],
    ['a date after today', { date: '2026-11-08' }, undefined],
  ])('Editing with %s is rejected and the stored entry stays as it was', async (_label, change, message) => {
    const db = await newDb();
    await addEntry(db, lunch, NOV_7);
    const before = await rows(db);

    const result = await editEntry(db, 1, { ...lunch, ...change }, NOV_7);

    expect(result).toMatchObject({ ok: false, kind: 'invalid' });
    if (message) expect(result).toMatchObject({ message: expect.stringMatching(message) });
    expect(await rows(db)).toEqual(before);
  });
});

describe('Every kind can be recorded', () => {
  it.each(['income', 'savings', 'expense'] as const)('A new %s is stored', async (kind) => {
    const db = await newDb();

    expect(await addEntry(db, { ...lunch, kind, category: 'other' }, NOV_7)).toEqual({ ok: true });
    expect((await rows(db))[0].kind).toBe(kind);
  });

  it('An old kind is refused and nothing is stored', async () => {
    const db = await newDb();

    expect(await addEntry(db, { ...lunch, kind: 'fixed' as never, category: 'other' }, NOV_7)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await rows(db)).toEqual([]);
  });
});

describe('Choose a category when recording (validation)', () => {
  it.each([
    ['income', 'salary'],
    ['income', 'freelance'],
    ['savings', 'goal'],
    ['savings', 'emergency_fund'],
    ['expense', 'groceries'],
    ['expense', 'other'],
  ] as const)('A %s in %s is stored with that category', async (kind, category) => {
    const db = await newDb();

    expect(await addEntry(db, { ...lunch, kind, category }, NOV_7)).toEqual({ ok: true });
    expect(await rows(db)).toEqual([expect.objectContaining({ kind, category })]);
  });

  it.each([
    ['a category of another kind', 'expense', 'salary'],
    ['an income category on savings', 'savings', 'freelance'],
    ['an expense category on income', 'income', 'groceries'],
    ['an unknown category', 'expense', 'pets'],
    ['an empty category', 'expense', ''],
    ['a label instead of a key', 'expense', 'Groceries'],
  ])('Adding with %s is refused with a message and stores nothing', async (_label, kind, category) => {
    const db = await newDb();
    const result = await addEntry(db, { ...lunch, kind: kind as any, category: category as any }, NOV_7);

    expect(result).toEqual({ ok: false, kind: 'invalid', message: 'Pick a category for this kind.' });
    expect(await rows(db)).toEqual([]);
  });

  it('Editing to a category of another kind is refused and the stored entry stays as it was', async () => {
    const db = await newDb();
    await addEntry(db, lunch, NOV_7);
    const before = await rows(db);

    const result = await editEntry(db, 1, { ...lunch, category: 'salary' }, NOV_7);

    expect(result).toEqual({ ok: false, kind: 'invalid', message: 'Pick a category for this kind.' });
    expect(await rows(db)).toEqual(before);
  });

  it('Editing only the category keeps the amount, date and note', async () => {
    const db = await newDb();
    await addEntry(db, { ...lunch, category: 'other' }, NOV_7);

    expect(await editEntry(db, 1, { ...lunch, category: 'transport' }, NOV_7)).toEqual({ ok: true });
    expect(await rows(db)).toEqual([
      expect.objectContaining({ date: '2026-11-05', amount_cents: 900, note: 'Lunch', category: 'transport' }),
    ]);
  });

  it('Changing the kind with a category of the new kind is stored', async () => {
    const db = await newDb();
    await addEntry(db, lunch, NOV_7);

    expect(await editEntry(db, 1, { ...lunch, kind: 'income', category: 'other' }, NOV_7)).toEqual({ ok: true });
    expect(await rows(db)).toEqual([expect.objectContaining({ kind: 'income', category: 'other' })]);
  });
});
