import { migrateDbIfNeeded } from '@/db/database';
import { addEntry, addMove, addPocket, deleteMove, deletePocket, editMove } from '@/features/entries/service';

import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_25 = new Date(2026, 10, 25, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

/** Pocket 1 "Emergency fund" holds 1 000,00 €; pocket 2 "Japan trip" holds 500,00 €. */
async function twoPockets() {
  const db = await newDb();
  await addPocket(db, { name: 'Emergency fund', startingCents: 100000, emoji: '', color: 'blue' });
  await addPocket(db, { name: 'Japan trip', startingCents: 50000, emoji: '', color: 'pink' });
  return db;
}

/** A move into Main stored by an earlier version: the app can no longer create one. */
const seedIntoMain = (db: any, over: { amount?: number; date?: string; from?: number; note?: string } = {}) =>
  db.runAsync(
    "INSERT INTO move (date, amount_cents, from_pocket_id, to_pocket_id, note, created_at) VALUES (?, ?, ?, NULL, ?, datetime('now'))",
    over.date ?? '2026-11-20',
    over.amount ?? 30000,
    over.from ?? 1,
    over.note ?? '',
  );
const ONLY_POCKETS = 'Money can only move to another pocket.';
const moves = (db: any) =>
  db.getAllAsync('SELECT id, date, amount_cents, from_pocket_id, to_pocket_id, note FROM move ORDER BY id');
const pockets = (db: any) => db.getAllAsync('SELECT id FROM pocket ORDER BY id');
const input = (over: Partial<{ date: string; amountCents: number; note: string; fromPocketId: number; toPocketId: number | null }> = {}) => ({
  date: '2026-11-20',
  amountCents: 30000,
  note: '',
  fromPocketId: 1,
  toPocketId: 2 as number | null,
  ...over,
});
const TOO_MUCH = 'There is not that much in this pocket.';

describe('Move only between pockets: addMove (031 Story 1, FR-003)', () => {
  it('Moved: a move into another pocket is stored with its date, amount, pockets and a trimmed note', async () => {
    const db = await twoPockets();
    expect(await addMove(db, input({ note: '  Flights  ' }), NOV_25)).toEqual({ ok: true });
    expect(await moves(db)).toEqual([
      { id: 1, date: '2026-11-20', amount_cents: 30000, from_pocket_id: 1, to_pocket_id: 2, note: 'Flights' },
    ]);
  });

  it('Refused writes: a new move with no To pocket is refused with "Money can only move to another pocket." and nothing is stored', async () => {
    const db = await twoPockets();
    expect(await addMove(db, input({ toPocketId: null }), NOV_25)).toEqual({ ok: false, kind: 'invalid', message: ONLY_POCKETS });
    expect(await moves(db)).toEqual([]);
  });

  it('Refused writes: a move into Main is refused even when the pocket holds the money', async () => {
    const db = await twoPockets();
    expect(await addMove(db, input({ toPocketId: null, amountCents: 1 }), NOV_25)).toMatchObject({ ok: false, message: ONLY_POCKETS });
    expect(await moves(db)).toEqual([]);
  });

  it('a move into another pocket stores both pockets', async () => {
    const db = await twoPockets();
    expect(await addMove(db, input({ toPocketId: 2 }), NOV_25)).toEqual({ ok: true });
    expect(await moves(db)).toEqual([expect.objectContaining({ from_pocket_id: 1, to_pocket_id: 2, note: '' })]);
  });

  it('a move changes no entry', async () => {
    const db = await twoPockets();
    await addMove(db, input(), NOV_25);
    expect(await moves(db)).toHaveLength(1);
    expect(await db.getAllAsync('SELECT * FROM entry')).toEqual([]);
  });

  it('Amount: 0, negative or above the app limit is refused and nothing is saved', async () => {
    const db = await twoPockets();
    for (const amountCents of [0, -100, 90_000_000_001]) {
      expect(await addMove(db, input({ amountCents }), NOV_25)).toMatchObject({ ok: false, kind: 'invalid' });
    }
    expect(await moves(db)).toEqual([]);
  });

  it('Date: a day after today is refused', async () => {
    const db = await twoPockets();
    expect(await addMove(db, input({ date: '2026-11-26' }), NOV_25)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await moves(db)).toEqual([]);
  });

  it('From and To being the same pocket is refused', async () => {
    const db = await twoPockets();
    expect(await addMove(db, input({ toPocketId: 1 }), NOV_25)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await moves(db)).toEqual([]);
  });

  it('Gone pockets: a From or To pocket that does not exist is refused', async () => {
    const db = await twoPockets();
    expect(await addMove(db, input({ fromPocketId: 9 }), NOV_25)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await addMove(db, input({ toPocketId: 9 }), NOV_25)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await moves(db)).toEqual([]);
  });
});

describe('Not enough in the pocket (FR-005)', () => {
  it('Edge case: 700,00 left after a move of 300,00; moving 700,01 is refused with "There is not that much in this pocket."', async () => {
    const db = await twoPockets();
    await addMove(db, input(), NOV_25);
    expect(await addMove(db, input({ amountCents: 70001 }), NOV_25)).toEqual({ ok: false, kind: 'invalid', message: TOO_MUCH });
    expect(await moves(db)).toHaveLength(1);
  });

  it('the whole balance can be moved: 700,00 is accepted and leaves the pocket at 0', async () => {
    const db = await twoPockets();
    await addMove(db, input(), NOV_25);
    expect(await addMove(db, input({ amountCents: 70000 }), NOV_25)).toEqual({ ok: true });
    expect(await addMove(db, input({ amountCents: 1 }), NOV_25)).toEqual({ ok: false, kind: 'invalid', message: TOO_MUCH });
  });

  it('savings into the pocket and money moved into it count; expenses paid from it do not', async () => {
    const db = await twoPockets();
    await addEntry(db, { date: '2026-11-02', kind: 'savings', amountCents: 5000, note: '', category: 'other', pocketId: 1 }, NOV_25);
    await addEntry(db, { date: '2026-11-03', kind: 'expense', amountCents: 2000, note: '', category: 'other', pocketId: 1 }, NOV_25);
    await addMove(db, input({ fromPocketId: 2, toPocketId: 1, amountCents: 50000 }), NOV_25);
    // 100 000 + 5 000 - 2 000 + 50 000 = 153 000
    expect(await addMove(db, input({ amountCents: 153001 }), NOV_25)).toMatchObject({ ok: false, message: TOO_MUCH });
    expect(await addMove(db, input({ amountCents: 153000 }), NOV_25)).toEqual({ ok: true });
  });

  it('a pocket at 0 or below cannot be moved from', async () => {
    const db = await newDb();
    await addPocket(db, { name: 'Car', startingCents: 0, emoji: '', color: 'blue' });
    await addPocket(db, { name: 'Boat', startingCents: 1000, emoji: '', color: 'blue' });
    expect(await addMove(db, input({ amountCents: 1 }), NOV_25)).toMatchObject({ ok: false, message: TOO_MUCH });
    await addEntry(db, { date: '2026-11-03', kind: 'expense', amountCents: 5000, note: '', category: 'other', pocketId: 2 }, NOV_25);
    expect(await addMove(db, input({ fromPocketId: 2, toPocketId: 1, amountCents: 1 }), NOV_25)).toMatchObject({ ok: false, message: TOO_MUCH });
    expect(await moves(db)).toEqual([]);
  });
});

describe('Fix or undo a move: editMove and deleteMove (Story 3)', () => {
  it('Edit: amount, pockets, date and note are updated', async () => {
    const db = await twoPockets();
    await addMove(db, input(), NOV_25);
    expect(await editMove(db, 1, input({ date: '2026-11-21', amountCents: 12000, fromPocketId: 2, toPocketId: 1, note: 'Back' }), NOV_25)).toEqual({ ok: true });
    expect(await moves(db)).toEqual([{ id: 1, date: '2026-11-21', amount_cents: 12000, from_pocket_id: 2, to_pocket_id: 1, note: 'Back' }]);
  });

  it('Not enough in the pocket: when editing, its own amount counts as still in the pocket', async () => {
    const db = await twoPockets();
    await addMove(db, input({ amountCents: 30000 }), NOV_25); // pocket holds 700,00 now
    expect(await editMove(db, 1, input({ amountCents: 100000 }), NOV_25)).toEqual({ ok: true });
    expect(await editMove(db, 1, input({ amountCents: 100001 }), NOV_25)).toEqual({ ok: false, kind: 'invalid', message: TOO_MUCH });
    expect((await moves(db))[0].amount_cents).toBe(100000);
  });

  it('other moves still count when editing one', async () => {
    const db = await twoPockets();
    await addMove(db, input({ amountCents: 40000 }), NOV_25);
    await addMove(db, input({ amountCents: 10000 }), NOV_25);
    expect(await editMove(db, 2, input({ amountCents: 60001 }), NOV_25)).toMatchObject({ ok: false, message: TOO_MUCH });
    expect(await editMove(db, 2, input({ amountCents: 60000 }), NOV_25)).toEqual({ ok: true });
  });

  it('editing so the move goes out of another pocket checks that pocket, without the move itself', async () => {
    const db = await twoPockets();
    await addMove(db, input({ amountCents: 30000 }), NOV_25);
    expect(await editMove(db, 1, input({ fromPocketId: 2, toPocketId: 1, amountCents: 50001 }), NOV_25)).toMatchObject({ ok: false, message: TOO_MUCH });
    expect(await editMove(db, 1, input({ fromPocketId: 2, toPocketId: 1, amountCents: 50000 }), NOV_25)).toEqual({ ok: true });
  });

  it('a move that does not exist cannot be edited or deleted', async () => {
    const db = await twoPockets();
    expect(await editMove(db, 7, input(), NOV_25)).toMatchObject({ ok: false });
    expect(await deleteMove(db, 7)).toMatchObject({ ok: false });
  });

  it('an invalid edit is refused and the move is unchanged', async () => {
    const db = await twoPockets();
    await addMove(db, input(), NOV_25);
    expect(await editMove(db, 1, input({ amountCents: 0 }), NOV_25)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await editMove(db, 1, input({ toPocketId: 9 }), NOV_25)).toMatchObject({ ok: false, kind: 'invalid' });
    expect(await moves(db)).toEqual([expect.objectContaining({ amount_cents: 30000, to_pocket_id: 2 })]);
  });

  it('Delete: the move is gone and the pocket holds its money again', async () => {
    const db = await twoPockets();
    await addMove(db, input({ amountCents: 100000 }), NOV_25);
    expect(await addMove(db, input({ amountCents: 1 }), NOV_25)).toMatchObject({ ok: false });
    expect(await deleteMove(db, 1)).toEqual({ ok: true });
    expect(await moves(db)).toEqual([]);
    expect(await addMove(db, input({ amountCents: 100000 }), NOV_25)).toEqual({ ok: true });
  });
});

describe('Earlier moves into Main stay (031 Story 2, FR-003, FR-004)', () => {
  it('Edit: amount, date and note of a stored move into Main can change while it stays in Main', async () => {
    const db = await twoPockets();
    await seedIntoMain(db);
    expect(await editMove(db, 1, input({ toPocketId: null, date: '2026-11-21', amountCents: 12000, note: 'Car' }), NOV_25)).toEqual({ ok: true });
    expect(await moves(db)).toEqual([{ id: 1, date: '2026-11-21', amount_cents: 12000, from_pocket_id: 1, to_pocket_id: null, note: 'Car' }]);
  });

  it('Edit: a stored move into Main can be moved to a pocket instead', async () => {
    const db = await twoPockets();
    await seedIntoMain(db);
    expect(await editMove(db, 1, input({ toPocketId: 2 }), NOV_25)).toEqual({ ok: true });
    expect(await moves(db)).toEqual([expect.objectContaining({ from_pocket_id: 1, to_pocket_id: 2 })]);
  });

  it('No way back: once saved into a pocket, it cannot be set back to Main', async () => {
    const db = await twoPockets();
    await seedIntoMain(db);
    await editMove(db, 1, input({ toPocketId: 2 }), NOV_25);
    expect(await editMove(db, 1, input({ toPocketId: null }), NOV_25)).toEqual({ ok: false, kind: 'invalid', message: ONLY_POCKETS });
    expect(await moves(db)).toEqual([expect.objectContaining({ to_pocket_id: 2 })]);
  });

  it('Refused writes: an edit that sets To to Main on a move that was not into Main is refused and nothing changes', async () => {
    const db = await twoPockets();
    await addMove(db, input({ amountCents: 30000 }), NOV_25);
    expect(await editMove(db, 1, input({ toPocketId: null, amountCents: 10000 }), NOV_25)).toEqual({ ok: false, kind: 'invalid', message: ONLY_POCKETS });
    expect(await moves(db)).toEqual([expect.objectContaining({ amount_cents: 30000, to_pocket_id: 2 })]);
  });

  it('keeping Main while editing still checks that the pocket holds the money, counting the move\'s own amount', async () => {
    const db = await twoPockets();
    await seedIntoMain(db, { amount: 30000 });
    expect(await editMove(db, 1, input({ toPocketId: null, amountCents: 100001 }), NOV_25)).toMatchObject({ ok: false, message: TOO_MUCH });
    expect(await editMove(db, 1, input({ toPocketId: null, amountCents: 100000 }), NOV_25)).toEqual({ ok: true });
  });

  it('a stored move into Main still counts against its pocket: 700,00 is left, so a new move of 700,01 is refused', async () => {
    const db = await twoPockets();
    await seedIntoMain(db);
    expect(await addMove(db, input({ amountCents: 70001 }), NOV_25)).toMatchObject({ ok: false, message: TOO_MUCH });
    expect(await addMove(db, input({ amountCents: 70000 }), NOV_25)).toEqual({ ok: true });
  });

  it('Delete: a stored move into Main can be deleted', async () => {
    const db = await twoPockets();
    await seedIntoMain(db);
    expect(await deleteMove(db, 1)).toEqual({ ok: true });
    expect(await moves(db)).toEqual([]);
  });

  it('a pocket a stored move into Main comes from cannot be deleted', async () => {
    const db = await twoPockets();
    await seedIntoMain(db);
    expect(await deletePocket(db, 1)).toMatchObject({ ok: false });
  });
});

describe('Deleting a pocket (FR-007)', () => {
  it('a pocket a move comes from cannot be deleted: "A pocket with savings, spending or moves can\'t be deleted."', async () => {
    const db = await twoPockets();
    await addMove(db, input(), NOV_25);
    expect(await deletePocket(db, 1)).toEqual({ ok: false, kind: 'invalid', message: "A pocket with savings, spending or moves can't be deleted." });
    expect(await pockets(db)).toHaveLength(2);
  });

  it('a pocket a move goes to cannot be deleted either', async () => {
    const db = await twoPockets();
    await addMove(db, input({ toPocketId: 2 }), NOV_25);
    expect(await deletePocket(db, 2)).toMatchObject({ ok: false, message: "A pocket with savings, spending or moves can't be deleted." });
    expect(await pockets(db)).toHaveLength(2);
  });

  it('once the move is deleted the pocket can be deleted', async () => {
    const db = await twoPockets();
    await addMove(db, input({ toPocketId: 2 }), NOV_25);
    await deleteMove(db, 1);
    expect(await deletePocket(db, 2)).toEqual({ ok: true });
  });
});
