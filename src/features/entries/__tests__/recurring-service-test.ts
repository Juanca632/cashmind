import { migrateDbIfNeeded } from '@/db/database';
import { addEntry, deleteEntry, editEntry, editRecurring, recordRecurringEntries, stopRecurring } from '@/features/entries/service';

import { createFakeDb } from '../../../test-support/fake-sqlite';

const NOV_15 = new Date(2026, 10, 15, 12);
const DEC_4 = new Date(2026, 11, 4, 12);
const DEC_20 = new Date(2026, 11, 20, 12);
const JAN_9 = new Date(2027, 0, 9, 12);
const FEB_10 = new Date(2027, 1, 10, 12);

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

const entries = (db: any) =>
  db.getAllAsync('SELECT date, kind, category, amount_cents, note, recurring_id FROM entry ORDER BY date, id');
const items = (db: any) => db.getAllAsync('SELECT * FROM recurring ORDER BY id');
const datesOf = async (db: any) => (await entries(db)).map((e: any) => e.date);

const rent = { date: '2026-11-15', kind: 'expense', amountCents: 90000, note: 'Rent', category: 'housing' } as const;
const salary = { date: '2026-11-03', kind: 'income', amountCents: 200000, note: 'Salary', category: 'salary' } as const;

describe('Mark an entry as monthly (US1)', () => {
  it('Mark on a new entry: the entry is saved as usual and an item is created from it', async () => {
    const db = await newDb();
    expect(await addEntry(db, rent, NOV_15, { repeat: true })).toEqual({ ok: true });

    expect(await entries(db)).toEqual([
      { date: '2026-11-15', kind: 'expense', category: 'housing', amount_cents: 90000, note: 'Rent', recurring_id: 1 },
    ]);
    expect(await items(db)).toEqual([
      { id: 1, kind: 'expense', category: 'housing', amount_cents: 90000, note: 'Rent', active: 1, last_month: '2026-11' },
    ]);
  });

  it('Without the switch nothing repeats', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15);
    await addEntry(db, rent, NOV_15, { repeat: false });
    expect(await items(db)).toEqual([]);
    expect((await entries(db)).map((e: any) => e.recurring_id)).toEqual([null, null]);
  });

  it('Mark an existing entry: it starts repeating from next month, not this one', async () => {
    const db = await newDb();
    await addEntry(db, salary, NOV_15);
    expect(await editEntry(db, 1, salary, NOV_15, { repeat: true })).toEqual({ ok: true });
    expect(await items(db)).toHaveLength(1);
    expect(await recordRecurringEntries(db, NOV_15)).toBe(0);
    expect(await entries(db)).toHaveLength(1);

    await recordRecurringEntries(db, DEC_4);
    expect(await datesOf(db)).toEqual(['2026-11-03', '2026-12-01']);
  });

  it('Marking an entry copies the values the user saved, not the old ones', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15);
    await editEntry(db, 1, { ...rent, amountCents: 95000, note: 'Rent plus' }, NOV_15, { repeat: true });
    expect(await items(db)).toEqual([expect.objectContaining({ amount_cents: 95000, note: 'Rent plus', category: 'housing' })]);
  });

  it('Past months: repeating an entry dated in a past month is refused and nothing is stored', async () => {
    const db = await newDb();
    const result = await addEntry(db, { ...rent, date: '2026-10-20' }, NOV_15, { repeat: true });
    expect(result.ok).toBe(false);
    expect(await entries(db)).toEqual([]);
    expect(await items(db)).toEqual([]);
  });

  it('Past months: marking an existing past entry is refused and the entry is not changed', async () => {
    const db = await newDb();
    await addEntry(db, { ...rent, date: '2026-10-20' }, NOV_15);
    const result = await editEntry(db, 1, { ...rent, date: '2026-10-20', amountCents: 5 }, NOV_15, { repeat: true });
    expect(result.ok).toBe(false);
    expect(await items(db)).toEqual([]);
    expect(await entries(db)).toEqual([expect.objectContaining({ amount_cents: 90000 })]);
  });

  it('An invalid entry with the switch on stores neither the entry nor the item', async () => {
    const db = await newDb();
    const result = await addEntry(db, { ...rent, amountCents: 0 }, NOV_15, { repeat: true });
    expect(result.ok).toBe(false);
    expect(await entries(db)).toEqual([]);
    expect(await items(db)).toEqual([]);
  });
});

describe('New month starts filled in (US2)', () => {
  async function withRentAndSalary() {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    await addEntry(db, salary, NOV_15, { repeat: true });
    return db;
  }

  it('Recorded on the 1st: every active item with its kind, category, amount and note', async () => {
    const db = await withRentAndSalary();
    await recordRecurringEntries(db, DEC_4);

    const december = (await entries(db)).filter((e: any) => e.date.startsWith('2026-12'));
    expect(december).toEqual([
      { date: '2026-12-01', kind: 'expense', category: 'housing', amount_cents: 90000, note: 'Rent', recurring_id: 1 },
      { date: '2026-12-01', kind: 'income', category: 'salary', amount_cents: 200000, note: 'Salary', recurring_id: 2 },
    ]);
  });

  it('Always dated the 1st even when the month is opened on the 20th', async () => {
    const db = await withRentAndSalary();
    await recordRecurringEntries(db, DEC_20);
    expect(await datesOf(db)).toEqual(['2026-11-03', '2026-11-15', '2026-12-01', '2026-12-01']);
  });

  it('Once per month: opening again records nothing a second time', async () => {
    const db = await withRentAndSalary();
    await recordRecurringEntries(db, DEC_4);
    expect(await recordRecurringEntries(db, DEC_4)).toBe(0);
    expect(await recordRecurringEntries(db, DEC_20)).toBe(0);
    expect(await entries(db)).toHaveLength(4);
  });

  it('The month the item was marked in is not recorded again', async () => {
    const db = await withRentAndSalary();
    expect(await recordRecurringEntries(db, NOV_15)).toBe(0);
    expect(await entries(db)).toHaveLength(2);
  });

  it('Deleted stays deleted: no return in December, recorded again in January', async () => {
    const db = await withRentAndSalary();
    await recordRecurringEntries(db, DEC_4);
    const decemberRent = (await db.getAllAsync("SELECT id FROM entry WHERE date = '2026-12-01' AND note = 'Rent'"))[0].id;
    expect(await deleteEntry(db, decemberRent)).toEqual({ ok: true });

    await recordRecurringEntries(db, DEC_20);
    expect((await entries(db)).filter((e: any) => e.date === '2026-12-01').map((e: any) => e.note)).toEqual(['Salary']);

    await recordRecurringEntries(db, JAN_9);
    expect((await entries(db)).filter((e: any) => e.date === '2027-01-01').map((e: any) => e.note)).toEqual(['Rent', 'Salary']);
  });

  it('Edited stays edited: only that month changes; January still records 900,00', async () => {
    const db = await withRentAndSalary();
    await recordRecurringEntries(db, DEC_4);
    const id = (await db.getAllAsync("SELECT id FROM entry WHERE date = '2026-12-01' AND note = 'Rent'"))[0].id;
    expect(await editEntry(db, id, { ...rent, date: '2026-12-01', amountCents: 95000 }, DEC_4)).toEqual({ ok: true });

    await recordRecurringEntries(db, JAN_9);
    const rents = (await entries(db)).filter((e: any) => e.note === 'Rent').map((e: any) => [e.date, e.amount_cents]);
    expect(rents).toEqual([
      ['2026-11-15', 90000],
      ['2026-12-01', 95000],
      ['2027-01-01', 90000],
    ]);
    expect(await items(db)).toEqual([expect.objectContaining({ amount_cents: 90000 }), expect.anything()]);
  });

  it('Skipped months: opened in February after November, only February is filled', async () => {
    const db = await withRentAndSalary();
    await recordRecurringEntries(db, FEB_10);
    expect(await datesOf(db)).toEqual(['2026-11-03', '2026-11-15', '2027-02-01', '2027-02-01']);
  });

  it('Stopped items are not recorded', async () => {
    const db = await withRentAndSalary();
    await stopRecurring(db, 1);
    await recordRecurringEntries(db, DEC_4);
    expect((await entries(db)).filter((e: any) => e.date === '2026-12-01').map((e: any) => e.note)).toEqual(['Salary']);
  });

  it('With nothing repeating, nothing is recorded', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15);
    expect(await recordRecurringEntries(db, DEC_4)).toBe(0);
    expect(await entries(db)).toHaveLength(1);
  });

  it('Recorded entries are normal: editable and deletable, changing only that month', async () => {
    const db = await withRentAndSalary();
    await recordRecurringEntries(db, DEC_4);
    const id = (await db.getAllAsync("SELECT id FROM entry WHERE date = '2026-12-01' AND note = 'Salary'"))[0].id;
    expect(await editEntry(db, id, { ...salary, date: '2026-12-01', note: 'Pay', amountCents: 210000 }, DEC_4)).toEqual({ ok: true });
    expect((await entries(db)).filter((e: any) => e.date === '2026-11-03')).toEqual([expect.objectContaining({ amount_cents: 200000, note: 'Salary' })]);
    expect(await deleteEntry(db, id)).toEqual({ ok: true });
  });
});

describe('Review what repeats (US3)', () => {
  it('Change: the item changes from next month; this month keeps its amount', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    expect(await editRecurring(db, 1, { category: 'housing', amountCents: 95000, note: 'Rent' })).toEqual({ ok: true });

    expect(await entries(db)).toEqual([expect.objectContaining({ date: '2026-11-15', amount_cents: 90000 })]);
    await recordRecurringEntries(db, DEC_4);
    expect(await entries(db)).toEqual([
      expect.objectContaining({ date: '2026-11-15', amount_cents: 90000 }),
      expect.objectContaining({ date: '2026-12-01', amount_cents: 95000 }),
    ]);
  });

  it('Change: category and note apply from next month, the kind stays', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    await editRecurring(db, 1, { category: 'subscriptions', amountCents: 1299, note: 'Netflix' });
    await recordRecurringEntries(db, DEC_4);
    expect((await entries(db))[1]).toEqual({
      date: '2026-12-01', kind: 'expense', category: 'subscriptions', amount_cents: 1299, note: 'Netflix', recurring_id: 1,
    });
  });

  it('Change: an invalid amount or a category of another kind is refused and the item is unchanged', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    expect((await editRecurring(db, 1, { category: 'housing', amountCents: 0, note: 'Rent' })).ok).toBe(false);
    expect((await editRecurring(db, 1, { category: 'salary', amountCents: 100, note: 'Rent' })).ok).toBe(false);
    expect(await items(db)).toEqual([expect.objectContaining({ amount_cents: 90000, category: 'housing' })]);
  });

  it('Change: an item that does not exist is refused', async () => {
    const db = await newDb();
    expect((await editRecurring(db, 99, { category: 'housing', amountCents: 100, note: '' })).ok).toBe(false);
  });

  it('Stop: the item is not recorded in later months and entries already recorded stay', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    await recordRecurringEntries(db, DEC_4);
    expect(await stopRecurring(db, 1)).toEqual({ ok: true });

    await recordRecurringEntries(db, JAN_9);
    expect(await datesOf(db)).toEqual(['2026-11-15', '2026-12-01']);
    expect(await items(db)).toEqual([expect.objectContaining({ active: 0 })]);
  });

  it('Stop from the entry: switching off on an entry of the item stops it', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    expect(await editEntry(db, 1, rent, NOV_15, { repeat: false })).toEqual({ ok: true });
    expect(await items(db)).toEqual([expect.objectContaining({ active: 0 })]);
    await recordRecurringEntries(db, DEC_4);
    expect(await entries(db)).toHaveLength(1);
  });

  it('Stop from a recorded entry: switching off on December\'s entry stops January', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    await recordRecurringEntries(db, DEC_4);
    await editEntry(db, 2, { ...rent, date: '2026-12-01' }, DEC_4, { repeat: false });
    await recordRecurringEntries(db, JAN_9);
    expect(await datesOf(db)).toEqual(['2026-11-15', '2026-12-01']);
  });

  it('Changing an entry of a repeating item only changes that entry', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    await editEntry(db, 1, { ...rent, amountCents: 1000 }, NOV_15);
    expect(await items(db)).toEqual([expect.objectContaining({ amount_cents: 90000, active: 1 })]);
    expect((await entries(db))[0].recurring_id).toBe(1);
  });

  it('Two items with the same note are separate items', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    await addEntry(db, rent, NOV_15, { repeat: true });
    expect(await items(db)).toHaveLength(2);
    await recordRecurringEntries(db, DEC_4);
    expect((await entries(db)).filter((e: any) => e.date === '2026-12-01')).toHaveLength(2);
  });

  it('A stopped item can be repeated again by marking an entry (a new item)', async () => {
    const db = await newDb();
    await addEntry(db, rent, NOV_15, { repeat: true });
    await stopRecurring(db, 1);
    await addEntry(db, rent, NOV_15, { repeat: true });
    expect(await items(db)).toEqual([expect.objectContaining({ id: 1, active: 0 }), expect.objectContaining({ id: 2, active: 1 })]);
  });
});
