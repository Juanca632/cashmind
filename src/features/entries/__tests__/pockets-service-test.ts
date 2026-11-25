import { migrateDbIfNeeded } from '@/db/database';
import {
  addEntry,
  addPocket,
  deletePocket,
  editEntry,
  editPocket,
  editRecurring,
  recordRecurringEntries,
} from '@/features/entries/service';

import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_15 = new Date(2026, 10, 15, 12);
const DEC_4 = new Date(2026, 11, 4, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

const pockets = (db: any) => db.getAllAsync('SELECT id, name, starting_cents FROM pocket ORDER BY id');
const entries = (db: any) => db.getAllAsync('SELECT date, kind, category, amount_cents, pocket_id FROM entry ORDER BY date, id');
const items = (db: any) => db.getAllAsync('SELECT * FROM recurring ORDER BY id');

const saving = (pocketId: number | null) =>
  ({ date: '2026-11-15', kind: 'savings', amountCents: 20000, note: '', category: 'other', pocketId }) as const;
const lunch = { date: '2026-11-15', kind: 'expense', amountCents: 900, note: '', category: 'eating_out', pocketId: null } as const;

describe('Create my pockets (Story 1)', () => {
  it('Create: a pocket is stored with its name and starting amount, and the result carries its id', async () => {
    const db = await newDb();
    expect(await addPocket(db, { name: 'Japan trip', startingCents: 150000, emoji: '', color: 'blue' })).toEqual({ ok: true, id: 1 });
    expect(await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' })).toEqual({ ok: true, id: 2 });
    expect(await pockets(db)).toEqual([
      { id: 1, name: 'Japan trip', starting_cents: 150000 },
      { id: 2, name: 'Car', starting_cents: 0 },
    ]);
  });

  it('the name is stored trimmed', async () => {
    const db = await newDb();
    await addPocket(db, { name: '  Car  ', startingCents: 0, emoji: '', color: 'blue' });
    expect((await pockets(db))[0].name).toBe('Car');
  });

  it('Name required: an empty name is refused with "Give the pocket a name." and nothing is saved', async () => {
    const db = await newDb();
    expect(await addPocket(db, { name: '   ', startingCents: 0, emoji: '', color: 'blue' })).toEqual({ ok: false, kind: 'invalid', message: 'Give the pocket a name.' });
    expect(await pockets(db)).toEqual([]);
  });

  it('a name over 40 characters is refused', async () => {
    const db = await newDb();
    expect((await addPocket(db, { name: 'a'.repeat(41), startingCents: 0, emoji: '', color: 'blue' })).ok).toBe(false);
    expect(await pockets(db)).toEqual([]);
  });

  it('a starting amount above the limit is refused and nothing is saved', async () => {
    const db = await newDb();
    expect((await addPocket(db, { name: 'Car', startingCents: 90_000_000_001, emoji: '', color: 'blue' })).ok).toBe(false);
    expect(await pockets(db)).toEqual([]);
  });

  it('Two pockets with the same name are allowed, each its own pocket', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Trip', startingCents: 0, emoji: '', color: 'blue' });
    await addPocket(db, { name: 'Trip', startingCents: 0, emoji: '', color: 'blue' });
    expect(await pockets(db)).toHaveLength(2);
  });

  it('The starting amount does not create any entry (FR-003)', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 150000, emoji: '', color: 'blue' });
    expect(await entries(db)).toEqual([]);
  });
});

describe('Save into a pocket (Story 2)', () => {
  it('Saved: a saving is stored with its pocket and category "other"', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 150000, emoji: '', color: 'blue' });
    expect(await addEntry(db, saving(1), NOV_15)).toEqual({ ok: true });
    expect(await entries(db)).toEqual([{ date: '2026-11-15', kind: 'savings', category: 'other', amount_cents: 20000, pocket_id: 1 }]);
  });

  it('Pocket required: a saving with no pocket is refused with "Pick a pocket." and nothing is saved', async () => {
    const db = await newDb();
    expect(await addEntry(db, saving(null), NOV_15)).toEqual({ ok: false, kind: 'invalid', message: 'Pick a pocket.' });
    expect(await entries(db)).toEqual([]);
  });

  it('a saving into a pocket that does not exist is refused and nothing is saved', async () => {
    const db = await newDb();
    expect((await addEntry(db, saving(42), NOV_15)).ok).toBe(false);
    expect(await entries(db)).toEqual([]);
  });

  it('Income never has a pocket', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    const income = { kind: 'income', category: 'salary', amountCents: 100000, note: '', date: '2026-11-15', pocketId: 1 } as const;
    expect((await addEntry(db, income, NOV_15)).ok).toBe(false);
    expect(await entries(db)).toEqual([]);
  });

  it('An expense may be paid from an existing pocket, and not from one that does not exist', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    expect((await addEntry(db, { ...lunch, pocketId: 1 }, NOV_15)).ok).toBe(true);
    expect((await addEntry(db, { ...lunch, pocketId: 42 }, NOV_15)).ok).toBe(false);
    expect(await entries(db)).toHaveLength(1);
  });

  it('A pocket with only an expense paid from it cannot be deleted', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, { ...lunch, pocketId: 1 }, NOV_15);
    expect(await deletePocket(db, 1)).toMatchObject({ ok: false, message: "A pocket with savings or spending can't be deleted." });
    expect(await pockets(db)).toHaveLength(1);
  });

  it('Moving a saving: editing it into another pocket moves it, and nothing else changes', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 0, emoji: '', color: 'blue' });
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15);
    expect(await editEntry(db, 1, saving(2), NOV_15)).toEqual({ ok: true });
    expect(await entries(db)).toEqual([{ date: '2026-11-15', kind: 'savings', category: 'other', amount_cents: 20000, pocket_id: 2 }]);
  });

  it('editing a saving to a missing pocket or none is refused and it stays where it was', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15);
    expect((await editEntry(db, 1, saving(null), NOV_15)).ok).toBe(false);
    expect((await editEntry(db, 1, saving(9), NOV_15)).ok).toBe(false);
    expect((await entries(db))[0].pocket_id).toBe(1);
  });

  it('Monthly savings: a saving marked to repeat records into the same pocket each month', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15, { repeat: true });
    expect(await items(db)).toEqual([expect.objectContaining({ kind: 'savings', pocket_id: 1 })]);

    await recordRecurringEntries(db, DEC_4);
    expect(await entries(db)).toEqual([
      expect.objectContaining({ date: '2026-11-15', pocket_id: 1 }),
      expect.objectContaining({ date: '2026-12-01', kind: 'savings', amount_cents: 20000, pocket_id: 1 }),
    ]);
  });

  it('Monthly savings: the monthly entry can change its pocket, from next month', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 0, emoji: '', color: 'blue' });
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15, { repeat: true });

    expect(await editRecurring(db, 1, { category: 'other', amountCents: 20000, note: '', pocketId: 2 })).toEqual({ ok: true });
    await recordRecurringEntries(db, DEC_4);
    expect((await entries(db)).map((e: any) => e.pocket_id)).toEqual([1, 2]);
  });

  it('Monthly savings: a monthly saving without a pocket, or in a missing one, is refused and unchanged', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15, { repeat: true });
    expect(await editRecurring(db, 1, { category: 'other', amountCents: 20000, note: '', pocketId: null })).toMatchObject({ ok: false, message: 'Pick a pocket.' });
    expect((await editRecurring(db, 1, { category: 'other', amountCents: 20000, note: '', pocketId: 77 })).ok).toBe(false);
    expect(await items(db)).toEqual([expect.objectContaining({ pocket_id: 1 })]);
  });
});

describe('Manage a pocket (Story 3)', () => {
  it('Edit: rename and change the starting amount; the savings stay in it', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 150000, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15);

    expect(await editPocket(db, 1, { name: ' Tokyo ', startingCents: 100000, emoji: '', color: 'blue' })).toEqual({ ok: true });
    expect(await pockets(db)).toEqual([{ id: 1, name: 'Tokyo', starting_cents: 100000 }]);
    expect((await entries(db))[0].pocket_id).toBe(1);
  });

  it('Edit: an empty name is refused and the pocket is unchanged', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 150000, emoji: '', color: 'blue' });
    expect(await editPocket(db, 1, { name: '', startingCents: 5, emoji: '', color: 'blue' })).toMatchObject({ ok: false, message: 'Give the pocket a name.' });
    expect(await pockets(db)).toEqual([{ id: 1, name: 'Japan trip', starting_cents: 150000 }]);
  });

  it('Edit: a pocket that does not exist is refused', async () => {
    const db = await newDb();
    expect((await editPocket(db, 5, { name: 'X', startingCents: 0, emoji: '', color: 'blue' })).ok).toBe(false);
  });

  it('Delete an empty pocket: it is gone', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    expect(await deletePocket(db, 1)).toEqual({ ok: true });
    expect(await pockets(db)).toEqual([]);
  });

  it('Cannot delete with savings: refused with "A pocket with savings can\'t be deleted." and kept', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15);
    expect(await deletePocket(db, 1)).toEqual({ ok: false, kind: 'invalid', message: "A pocket with savings or spending can't be deleted." });
    expect(await pockets(db)).toHaveLength(1);
  });

  it('Cannot delete with a monthly saving even if no saving remains', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15, { repeat: true });
    await db.runAsync('DELETE FROM entry');
    expect(await deletePocket(db, 1)).toMatchObject({ ok: false, message: "A pocket with savings or spending can't be deleted." });
    expect(await pockets(db)).toHaveLength(1);
  });

  it('a pocket becomes deletable once its saving moves elsewhere', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Japan trip', startingCents: 0, emoji: '', color: 'blue' });
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    await addEntry(db, saving(1), NOV_15);
    await editEntry(db, 1, saving(2), NOV_15);
    expect(await deletePocket(db, 1)).toEqual({ ok: true });
    expect((await pockets(db)).map((p: any) => p.name)).toEqual(['Car']);
  });
});

describe('Recognise each pocket (027 Story 3)', () => {
  it('a pocket is stored with its emoji and colour, and editing changes them', async () => {
    const db = await newDb();
    expect(await addPocket(db, { name: 'Japan trip', startingCents: 0, emoji: '✈️', color: 'pink' })).toEqual({ ok: true, id: 1 });
    expect(await db.getAllAsync('SELECT emoji, color FROM pocket')).toEqual([{ emoji: '✈️', color: 'pink' }]);

    expect(await editPocket(db, 1, { name: 'Japan trip', startingCents: 0, emoji: '', color: 'slate' })).toEqual({ ok: true });
    expect(await db.getAllAsync('SELECT emoji, color FROM pocket')).toEqual([{ emoji: '', color: 'slate' }]);
  });

  it('an emoji of more than 8 characters or an unknown colour is refused and nothing is saved', async () => {
    const db = await newDb();
    expect(await addPocket(db, { name: 'Car', startingCents: 0, emoji: '123456789', color: 'blue' })).toEqual({ ok: false, kind: 'invalid', message: 'Use one emoji.' });
    expect(await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'red' as never })).toEqual({ ok: false, kind: 'invalid', message: 'Pick a colour.' });
    expect(await pockets(db)).toEqual([]);
  });
});
