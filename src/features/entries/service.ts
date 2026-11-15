/** The only way to change entries and monthly items. Every write is validated here before it reaches the database. */
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  deleteEntry as removeRow,
  getEntry,
  getRecurringItem,
  getRecurringItemsToRecord,
  insertEntry,
  insertRecurring,
  linkEntryToRecurring,
  markRecurringRecorded,
  stopRecurring as stopRow,
  updateEntry,
  updateRecurring,
} from '@/features/entries/repository';
import {
  ENTRY_MISSING,
  RECURRING_MISSING,
  entryErrorMessage,
  validateEntry,
  validateRecurring,
  type EntryInput,
  type RecurringInput,
} from '@/features/entries/rules';
import { monthKey } from '@/shared/months';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const WRITE_FAILED = 'The entry could not be saved. Please try again.';
const DELETE_FAILED = 'The entry could not be deleted. Please try again.';
const RECURRING_FAILED = 'The monthly entry could not be saved. Please try again.';
const STOP_FAILED = 'The monthly entry could not be stopped. Please try again.';
const REPEAT_CURRENT_MONTH_ONLY = 'Only entries of this month can repeat every month.';

/** Whether the entry should repeat every month after saving. Leaving it out keeps things as they are. */
export type RepeatChoice = { repeat?: boolean };

function rejectIfInvalid(input: EntryInput, today: Date): WriteResult | null {
  const [error] = validateEntry(input, today);
  return error ? rejected(entryErrorMessage(error)) : null;
}

function rejectRepeatOutsideThisMonth(input: EntryInput, today: Date, choice: RepeatChoice): WriteResult | null {
  return choice.repeat && input.date.slice(0, 7) !== monthKey(today) ? rejected(REPEAT_CURRENT_MONTH_ONLY) : null;
}

/** A new item from the entry; this month already has its entry, so it is recorded from next month. */
function insertRecurringFrom(db: SQLiteDatabase, input: EntryInput): Promise<number> {
  const { kind, category, amountCents, note } = input;
  return insertRecurring(db, { kind, category, amountCents, note, lastMonth: input.date.slice(0, 7) });
}

export function addEntry(db: SQLiteDatabase, input: EntryInput, today: Date, choice: RepeatChoice = {}): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = rejectIfInvalid(input, today) ?? rejectRepeatOutsideThisMonth(input, today, choice);
    if (refusal) return refusal;
    if (!choice.repeat) {
      await insertEntry(db, input);
      return WRITE_OK;
    }
    await db.withTransactionAsync(async () => {
      await insertEntry(db, input, await insertRecurringFrom(db, input));
    });
    return WRITE_OK;
  });
}

/**
 * Saves the entry's fields, which change only this entry. Turning repeat on starts a new item from
 * the entry; turning it off stops the active item the entry belongs to.
 */
export function editEntry(
  db: SQLiteDatabase,
  id: number,
  input: EntryInput,
  today: Date,
  choice: RepeatChoice = {},
): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = rejectIfInvalid(input, today) ?? rejectRepeatOutsideThisMonth(input, today, choice);
    if (refusal) return refusal;
    const current = await getEntry(db, id);
    if (!current) return rejected(ENTRY_MISSING);
    const item = current.recurringId === null ? null : await getRecurringItem(db, current.recurringId);
    const repeats = item?.active === true;
    await db.withTransactionAsync(async () => {
      await updateEntry(db, id, input);
      if (choice.repeat === true && !repeats) await linkEntryToRecurring(db, id, await insertRecurringFrom(db, input));
      if (choice.repeat === false && repeats) await stopRow(db, item.id);
    });
    return WRITE_OK;
  });
}

export function deleteEntry(db: SQLiteDatabase, id: number): Promise<WriteResult> {
  return attemptWrite(DELETE_FAILED, async () => {
    if (!(await getEntry(db, id))) return rejected(ENTRY_MISSING);
    await removeRow(db, id);
    return WRITE_OK;
  });
}

/**
 * Records every active item once in today's month, dated the 1st. Months the app was not opened in
 * stay as they were. Safe to call any number of times: an item already recorded this month, even
 * if its entry was deleted since, is skipped. Returns how many entries were recorded.
 */
export async function recordRecurringEntries(db: SQLiteDatabase, today: Date): Promise<number> {
  const month = monthKey(today);
  const items = await getRecurringItemsToRecord(db, month);
  if (items.length === 0) return 0;
  let recorded = 0;
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      if (!(await markRecurringRecorded(db, item.id, month))) continue;
      const { kind, category, amountCents, note } = item;
      await insertEntry(db, { date: `${month}-01`, kind, category, amountCents, note }, item.id);
      recorded += 1;
    }
  });
  return recorded;
}

/** Changes an active item from next month on; entries already recorded keep their values. */
export function editRecurring(db: SQLiteDatabase, id: number, input: RecurringInput): Promise<WriteResult> {
  return attemptWrite(RECURRING_FAILED, async () => {
    const item = await getRecurringItem(db, id);
    if (!item?.active) return rejected(RECURRING_MISSING);
    const [error] = validateRecurring(item.kind, input);
    if (error) return rejected(entryErrorMessage(error));
    await updateRecurring(db, id, input);
    return WRITE_OK;
  });
}

/** Stops an item; every entry it recorded stays. */
export function stopRecurring(db: SQLiteDatabase, id: number): Promise<WriteResult> {
  return attemptWrite(STOP_FAILED, async () => {
    const item = await getRecurringItem(db, id);
    if (!item?.active) return rejected(RECURRING_MISSING);
    await stopRow(db, id);
    return WRITE_OK;
  });
}
