import type { SQLiteDatabase } from 'expo-sqlite';

import { ALL_CATEGORIES, isCategoryOf } from '@/features/entries/categories';
import type { Entry, EntryInput } from '@/features/entries/rules';
import { ENTRY_KINDS } from '@/shared/kinds';
import { DataFormatError, readDay, readInteger, readOneOf, readPositiveInteger, readText } from '@/shared/read-checks';

type EntryRow = Record<'id' | 'date' | 'kind' | 'amount_cents' | 'note' | 'category', unknown>;

const COLUMNS = 'id, date, kind, amount_cents, note, category';

function toEntry(row: EntryRow): Entry {
  const kind = readOneOf(row.kind, ENTRY_KINDS, 'entry.kind');
  const category = readOneOf(row.category, ALL_CATEGORIES, 'entry.category');
  // A category from another kind's list is as unreadable as an unknown one.
  if (!isCategoryOf(kind, category)) throw new DataFormatError('entry.category');
  return {
    id: readInteger(row.id, 'entry.id'),
    date: readDay(row.date, 'entry.date'),
    kind,
    amountCents: readPositiveInteger(row.amount_cents, 'entry.amount_cents'),
    note: readText(row.note, 'entry.note'),
    category,
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

export async function insertEntry(db: SQLiteDatabase, input: EntryInput): Promise<void> {
  await db.runAsync(
    'INSERT INTO entry (date, kind, amount_cents, note, category) VALUES (?, ?, ?, ?, ?)',
    input.date,
    input.kind,
    input.amountCents,
    input.note,
    input.category,
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
