import type { SQLiteDatabase } from 'expo-sqlite';

import { ALL_CATEGORIES, isCategoryOf } from '@/features/entries/categories';
import type { Entry, EntryInput, RecurringInput, RecurringItem } from '@/features/entries/rules';
import { ENTRY_KINDS } from '@/shared/kinds';
import {
  DataFormatError,
  readDay,
  readInteger,
  readMonth,
  readOneOf,
  readPositiveInteger,
  readText,
} from '@/shared/read-checks';

type EntryRow = Record<'id' | 'date' | 'kind' | 'amount_cents' | 'note' | 'category' | 'recurring_id', unknown>;

const COLUMNS = 'id, date, kind, amount_cents, note, category, recurring_id';

/** A kind and a category of that kind's list; a category from another kind's list is as unreadable as an unknown one. */
function readKindAndCategory(row: { kind: unknown; category: unknown }, table: string) {
  const kind = readOneOf(row.kind, ENTRY_KINDS, `${table}.kind`);
  const category = readOneOf(row.category, ALL_CATEGORIES, `${table}.category`);
  if (!isCategoryOf(kind, category)) throw new DataFormatError(`${table}.category`);
  return { kind, category };
}

function toEntry(row: EntryRow): Entry {
  const { kind, category } = readKindAndCategory(row, 'entry');
  return {
    id: readInteger(row.id, 'entry.id'),
    date: readDay(row.date, 'entry.date'),
    kind,
    amountCents: readPositiveInteger(row.amount_cents, 'entry.amount_cents'),
    note: readText(row.note, 'entry.note'),
    category,
    recurringId: row.recurring_id === null ? null : readInteger(row.recurring_id, 'entry.recurring_id'),
  };
}

/** Entries of a month ('YYYY-MM'), newest first. */
export async function getEntriesOfMonth(db: SQLiteDatabase, month: string): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT ${COLUMNS} FROM entry WHERE substr(date, 1, 7) = ? ORDER BY date DESC, id DESC`,
    month,
  );
  return rows.map(toEntry);
}

/**
 * Total income of the most recent month before `month`, or null when there is none. Every earlier
 * income is format-checked, like any other read.
 */
export async function getLatestIncomeBefore(db: SQLiteDatabase, month: string): Promise<number | null> {
  const rows = await db.getAllAsync<Record<'date' | 'amount_cents' | 'category', unknown>>(
    `SELECT date, amount_cents, category FROM entry
     WHERE kind = 'income' AND substr(date, 1, 7) < ?
     ORDER BY date DESC, id DESC`,
    month,
  );
  const incomes = rows.map((row) => {
    if (!isCategoryOf('income', row.category)) throw new DataFormatError('entry.category');
    return {
      month: readDay(row.date, 'entry.date').slice(0, 7),
      cents: readPositiveInteger(row.amount_cents, 'entry.amount_cents'),
    };
  });
  if (incomes.length === 0) return null;
  const latest = incomes[0].month;
  return incomes.filter((income) => income.month === latest).reduce((sum, income) => sum + income.cents, 0);
}

/** Month ('YYYY-MM') of the oldest recorded entry, or null when nothing was recorded. */
export async function getFirstEntryMonth(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ first: unknown }>('SELECT min(date) AS first FROM entry');
  return row?.first == null ? null : readDay(row.first, 'entry.date').slice(0, 7);
}

export async function getEntry(db: SQLiteDatabase, id: number): Promise<Entry | null> {
  const row = await db.getFirstAsync<EntryRow>(`SELECT ${COLUMNS} FROM entry WHERE id = ?`, id);
  return row ? toEntry(row) : null;
}

export async function insertEntry(db: SQLiteDatabase, input: EntryInput, recurringId: number | null = null): Promise<void> {
  await db.runAsync(
    'INSERT INTO entry (date, kind, amount_cents, note, category, recurring_id) VALUES (?, ?, ?, ?, ?, ?)',
    input.date,
    input.kind,
    input.amountCents,
    input.note,
    input.category,
    recurringId,
  );
}

export async function updateEntry(db: SQLiteDatabase, id: number, input: EntryInput): Promise<void> {
  await db.runAsync(
    'UPDATE entry SET date = ?, kind = ?, amount_cents = ?, note = ?, category = ? WHERE id = ?',
    input.date,
    input.kind,
    input.amountCents,
    input.note,
    input.category,
    id,
  );
}

export async function deleteEntry(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM entry WHERE id = ?', id);
}

/** Links an entry to the monthly item marked from it. */
export async function linkEntryToRecurring(db: SQLiteDatabase, id: number, recurringId: number): Promise<void> {
  await db.runAsync('UPDATE entry SET recurring_id = ? WHERE id = ?', recurringId, id);
}

type RecurringRow = Record<'id' | 'kind' | 'category' | 'amount_cents' | 'note' | 'active' | 'last_month', unknown>;

const RECURRING_COLUMNS = 'id, kind, category, amount_cents, note, active, last_month';

function toRecurring(row: RecurringRow): RecurringItem {
  const { kind, category } = readKindAndCategory(row, 'recurring');
  if (row.active !== 0 && row.active !== 1) throw new DataFormatError('recurring.active');
  return {
    id: readInteger(row.id, 'recurring.id'),
    kind,
    category,
    amountCents: readPositiveInteger(row.amount_cents, 'recurring.amount_cents'),
    note: readText(row.note, 'recurring.note'),
    active: row.active === 1,
    lastMonth: readMonth(row.last_month, 'recurring.last_month'),
  };
}

/** The monthly items that still repeat, income first, then savings, then expenses, oldest first. */
export async function getActiveRecurringItems(db: SQLiteDatabase): Promise<RecurringItem[]> {
  const rows = await db.getAllAsync<RecurringRow>(
    `SELECT ${RECURRING_COLUMNS} FROM recurring WHERE active = 1
     ORDER BY CASE kind WHEN 'income' THEN 0 WHEN 'savings' THEN 1 ELSE 2 END, id`,
  );
  return rows.map(toRecurring);
}

export async function getRecurringItem(db: SQLiteDatabase, id: number): Promise<RecurringItem | null> {
  const row = await db.getFirstAsync<RecurringRow>(`SELECT ${RECURRING_COLUMNS} FROM recurring WHERE id = ?`, id);
  return row ? toRecurring(row) : null;
}

/** Active items that have no entry yet in `month`. */
export async function getRecurringItemsToRecord(db: SQLiteDatabase, month: string): Promise<RecurringItem[]> {
  const rows = await db.getAllAsync<RecurringRow>(
    `SELECT ${RECURRING_COLUMNS} FROM recurring WHERE active = 1 AND last_month < ? ORDER BY id`,
    month,
  );
  return rows.map(toRecurring);
}

/** A new active item whose entry for `lastMonth` already exists; returns its id. */
export async function insertRecurring(
  db: SQLiteDatabase,
  item: Pick<RecurringItem, 'kind' | 'category' | 'amountCents' | 'note' | 'lastMonth'>,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO recurring (kind, category, amount_cents, note, last_month) VALUES (?, ?, ?, ?, ?)',
    item.kind,
    item.category,
    item.amountCents,
    item.note,
    item.lastMonth,
  );
  return result.lastInsertRowId;
}

export async function updateRecurring(db: SQLiteDatabase, id: number, input: RecurringInput): Promise<void> {
  await db.runAsync(
    'UPDATE recurring SET category = ?, amount_cents = ?, note = ? WHERE id = ?',
    input.category,
    input.amountCents,
    input.note,
    id,
  );
}

export async function stopRecurring(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE recurring SET active = 0 WHERE id = ?', id);
}

/**
 * Records that `month` has the item's entry. True only for the call that moved it forward, so a
 * second run for the same month never records the entry twice.
 */
export async function markRecurringRecorded(db: SQLiteDatabase, id: number, month: string): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE recurring SET last_month = ? WHERE id = ? AND active = 1 AND last_month < ?',
    month,
    id,
    month,
  );
  return result.changes === 1;
}
