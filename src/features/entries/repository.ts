import type { SQLiteDatabase } from 'expo-sqlite';

import { ALL_CATEGORIES, isCategoryOf } from '@/features/entries/categories';
import type { Entry, EntryInput, Pocket, PocketInput, RecurringInput, RecurringItem } from '@/features/entries/rules';
import { ENTRY_KINDS } from '@/shared/kinds';
import { POCKET_COLOR_NAMES } from '@/shared/theme/theme';
import {
  DataFormatError,
  readDay,
  readInteger,
  readMonth,
  readOneOf,
  readPositiveInteger,
  readText,
} from '@/shared/read-checks';

type EntryRow = Record<
  'id' | 'date' | 'kind' | 'amount_cents' | 'note' | 'category' | 'recurring_id' | 'pocket_id' | 'pocket_name' | 'pocket_emoji',
  unknown
>;

/** Every entry query reads its pocket's name too, so titles need no other lookup. */
const COLUMNS =
  'entry.id, entry.date, entry.kind, entry.amount_cents, entry.note, entry.category, entry.recurring_id, entry.pocket_id, pocket.name AS pocket_name, pocket.emoji AS pocket_emoji';
const FROM_ENTRY = 'entry LEFT JOIN pocket ON pocket.id = entry.pocket_id';

/** A saving has a pocket, an expense may be paid from one, and income never has one. */
function readPocket(kind: string, row: { pocket_id: unknown; pocket_name: unknown; pocket_emoji: unknown }, table: string) {
  const optional = kind === 'expense' && row.pocket_id === null;
  if (kind === 'income' || optional) {
    if (row.pocket_id !== null) throw new DataFormatError(`${table}.pocket_id`);
    return { pocketId: null, pocketName: null, pocketEmoji: null };
  }
  return {
    pocketId: readInteger(row.pocket_id, `${table}.pocket_id`),
    pocketName: readText(row.pocket_name, 'pocket.name'),
    pocketEmoji: readText(row.pocket_emoji, 'pocket.emoji'),
  };
}

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
    ...readPocket(kind, row, 'entry'),
  };
}

/** Entries of a month ('YYYY-MM'), newest first. */
export async function getEntriesOfMonth(db: SQLiteDatabase, month: string): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT ${COLUMNS} FROM ${FROM_ENTRY} WHERE substr(entry.date, 1, 7) = ? ORDER BY entry.date DESC, entry.id DESC`,
    month,
  );
  return rows.map(toEntry);
}

/** Entries from the start of `fromMonth` to the end of `toMonth` ('YYYY-MM'), oldest first. */
export async function getEntriesBetween(db: SQLiteDatabase, fromMonth: string, toMonth: string): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT ${COLUMNS} FROM ${FROM_ENTRY} WHERE substr(entry.date, 1, 7) BETWEEN ? AND ? ORDER BY entry.date, entry.id`,
    fromMonth,
    toMonth,
  );
  return rows.map(toEntry);
}

/** Every entry of every month that has a pocket, newest first: savings and expenses paid from one. */
export async function getPocketEntries(db: SQLiteDatabase): Promise<Entry[]> {
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT ${COLUMNS} FROM ${FROM_ENTRY} WHERE entry.pocket_id IS NOT NULL ORDER BY entry.date DESC, entry.id DESC`,
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
  const row = await db.getFirstAsync<EntryRow>(`SELECT ${COLUMNS} FROM ${FROM_ENTRY} WHERE entry.id = ?`, id);
  return row ? toEntry(row) : null;
}

export async function insertEntry(db: SQLiteDatabase, input: EntryInput, recurringId: number | null = null): Promise<void> {
  await db.runAsync(
    'INSERT INTO entry (date, kind, amount_cents, note, category, recurring_id, pocket_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    input.date,
    input.kind,
    input.amountCents,
    input.note,
    input.category,
    recurringId,
    input.pocketId,
  );
}

export async function updateEntry(db: SQLiteDatabase, id: number, input: EntryInput): Promise<void> {
  await db.runAsync(
    'UPDATE entry SET date = ?, kind = ?, amount_cents = ?, note = ?, category = ?, pocket_id = ? WHERE id = ?',
    input.date,
    input.kind,
    input.amountCents,
    input.note,
    input.category,
    input.pocketId,
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

type RecurringRow = Record<
  'id' | 'kind' | 'category' | 'amount_cents' | 'note' | 'active' | 'last_month' | 'pocket_id' | 'pocket_name' | 'pocket_emoji',
  unknown
>;

const RECURRING_COLUMNS =
  'recurring.id, recurring.kind, recurring.category, recurring.amount_cents, recurring.note, recurring.active, recurring.last_month, recurring.pocket_id, pocket.name AS pocket_name, pocket.emoji AS pocket_emoji';
const FROM_RECURRING = 'recurring LEFT JOIN pocket ON pocket.id = recurring.pocket_id';

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
    ...readPocket(kind, row, 'recurring'),
  };
}

/** The monthly items that still repeat, income first, then savings, then expenses, oldest first. */
export async function getActiveRecurringItems(db: SQLiteDatabase): Promise<RecurringItem[]> {
  const rows = await db.getAllAsync<RecurringRow>(
    `SELECT ${RECURRING_COLUMNS} FROM ${FROM_RECURRING} WHERE recurring.active = 1
     ORDER BY CASE recurring.kind WHEN 'income' THEN 0 WHEN 'savings' THEN 1 ELSE 2 END, recurring.id`,
  );
  return rows.map(toRecurring);
}

export async function getRecurringItem(db: SQLiteDatabase, id: number): Promise<RecurringItem | null> {
  const row = await db.getFirstAsync<RecurringRow>(`SELECT ${RECURRING_COLUMNS} FROM ${FROM_RECURRING} WHERE recurring.id = ?`, id);
  return row ? toRecurring(row) : null;
}

/** Active items that have no entry yet in `month`. */
export async function getRecurringItemsToRecord(db: SQLiteDatabase, month: string): Promise<RecurringItem[]> {
  const rows = await db.getAllAsync<RecurringRow>(
    `SELECT ${RECURRING_COLUMNS} FROM ${FROM_RECURRING} WHERE recurring.active = 1 AND recurring.last_month < ? ORDER BY recurring.id`,
    month,
  );
  return rows.map(toRecurring);
}

/** A new active item whose entry for `lastMonth` already exists; returns its id. */
export async function insertRecurring(
  db: SQLiteDatabase,
  item: Pick<RecurringItem, 'kind' | 'category' | 'amountCents' | 'note' | 'lastMonth' | 'pocketId'>,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO recurring (kind, category, amount_cents, note, last_month, pocket_id) VALUES (?, ?, ?, ?, ?, ?)',
    item.kind,
    item.category,
    item.amountCents,
    item.note,
    item.lastMonth,
    item.pocketId,
  );
  return result.lastInsertRowId;
}

export async function updateRecurring(db: SQLiteDatabase, id: number, input: RecurringInput): Promise<void> {
  await db.runAsync(
    'UPDATE recurring SET category = ?, amount_cents = ?, note = ?, pocket_id = ? WHERE id = ?',
    input.category,
    input.amountCents,
    input.note,
    input.pocketId,
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

type PocketRow = Record<'id' | 'name' | 'starting_cents' | 'emoji' | 'color', unknown>;

const POCKET_COLUMNS = 'id, name, starting_cents, emoji, color';

function toPocket(row: PocketRow): Pocket {
  const startingCents = readInteger(row.starting_cents, 'pocket.starting_cents');
  if (startingCents < 0) throw new DataFormatError('pocket.starting_cents');
  return {
    id: readInteger(row.id, 'pocket.id'),
    name: readText(row.name, 'pocket.name'),
    startingCents,
    emoji: readText(row.emoji, 'pocket.emoji'),
    color: readOneOf(row.color, POCKET_COLOR_NAMES, 'pocket.color'),
  };
}

/** Every pocket, in the order they were made. */
export async function getPockets(db: SQLiteDatabase): Promise<Pocket[]> {
  const rows = await db.getAllAsync<PocketRow>(`SELECT ${POCKET_COLUMNS} FROM pocket ORDER BY id`);
  return rows.map(toPocket);
}

export async function getPocket(db: SQLiteDatabase, id: number): Promise<Pocket | null> {
  const row = await db.getFirstAsync<PocketRow>(`SELECT ${POCKET_COLUMNS} FROM pocket WHERE id = ?`, id);
  return row ? toPocket(row) : null;
}

/** True when a saving or a monthly saving (even a stopped one) points to the pocket. */
export async function pocketInUse(db: SQLiteDatabase, id: number): Promise<boolean> {
  const row = await db.getFirstAsync(
    'SELECT 1 FROM entry WHERE pocket_id = ? UNION ALL SELECT 1 FROM recurring WHERE pocket_id = ? LIMIT 1',
    id,
    id,
  );
  return row !== null;
}

/** Returns the new pocket's id. */
export async function insertPocket(db: SQLiteDatabase, input: PocketInput): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO pocket (name, starting_cents, emoji, color) VALUES (?, ?, ?, ?)',
    input.name,
    input.startingCents,
    input.emoji,
    input.color,
  );
  return result.lastInsertRowId;
}

export async function updatePocket(db: SQLiteDatabase, id: number, input: PocketInput): Promise<void> {
  await db.runAsync(
    'UPDATE pocket SET name = ?, starting_cents = ?, emoji = ?, color = ? WHERE id = ?',
    input.name,
    input.startingCents,
    input.emoji,
    input.color,
    id,
  );
}

export async function deletePocket(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM pocket WHERE id = ?', id);
}
