/** The only way to change entries and monthly items. Every write is validated here before it reaches the database. */
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  deleteEntry as removeRow,
  deletePocket as removePocket,
  getEntry,
  getPocket,
  getRecurringItem,
  getRecurringItemsToRecord,
  insertEntry,
  insertPocket,
  insertRecurring,
  linkEntryToRecurring,
  markRecurringRecorded,
  pocketInUse,
  stopRecurring as stopRow,
  updateEntry,
  updatePocket,
  updateRecurring,
} from '@/features/entries/repository';
import {
  ENTRY_MISSING,
  POCKET_MISSING,
  RECURRING_MISSING,
  entryErrorMessage,
  pocketErrorMessage,
  validateEntry,
  validatePocket,
  validateRecurring,
  type EntryInput,
  type PocketInput,
  type RecurringInput,
} from '@/features/entries/rules';
import { monthKey } from '@/shared/months';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const WRITE_FAILED = 'The entry could not be saved. Please try again.';
const DELETE_FAILED = 'The entry could not be deleted. Please try again.';
const RECURRING_FAILED = 'The monthly entry could not be saved. Please try again.';
const STOP_FAILED = 'The monthly entry could not be stopped. Please try again.';
const REPEAT_CURRENT_MONTH_ONLY = 'Only entries of this month can repeat every month.';
const POCKET_FAILED = 'The pocket could not be saved. Please try again.';
const POCKET_DELETE_FAILED = 'The pocket could not be deleted. Please try again.';
const POCKET_GONE = 'This pocket no longer exists.';
const POCKET_IN_USE = "A pocket with savings can't be deleted.";

/** A saving's pocket must still exist; a pocket deleted meanwhile is as good as none. */
async function rejectIfPocketGone(db: SQLiteDatabase, pocketId: number | null): Promise<WriteResult | null> {
  if (pocketId === null) return null;
  return (await getPocket(db, pocketId)) ? null : rejected(POCKET_MISSING);
}

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
  const { kind, category, amountCents, note, pocketId } = input;
  return insertRecurring(db, { kind, category, amountCents, note, pocketId, lastMonth: input.date.slice(0, 7) });
}

export function addEntry(db: SQLiteDatabase, input: EntryInput, today: Date, choice: RepeatChoice = {}): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal =
      rejectIfInvalid(input, today) ??
      rejectRepeatOutsideThisMonth(input, today, choice) ??
      (await rejectIfPocketGone(db, input.pocketId));
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
    const refusal =
      rejectIfInvalid(input, today) ??
      rejectRepeatOutsideThisMonth(input, today, choice) ??
      (await rejectIfPocketGone(db, input.pocketId));
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
      const { kind, category, amountCents, note, pocketId } = item;
      await insertEntry(db, { date: `${month}-01`, kind, category, amountCents, note, pocketId }, item.id);
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
    const gone = await rejectIfPocketGone(db, input.pocketId);
    if (gone) return gone;
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

/** A new pocket. On success the result carries its id, so a form can pick it at once. */
export async function addPocket(db: SQLiteDatabase, input: PocketInput): Promise<WriteResult & { id?: number }> {
  let id: number | undefined;
  const result = await attemptWrite(POCKET_FAILED, async () => {
    const [error] = validatePocket(input);
    if (error) return rejected(pocketErrorMessage(error));
    id = await insertPocket(db, { name: input.name.trim(), startingCents: input.startingCents });
    return WRITE_OK;
  });
  return result.ok ? { ...result, id } : result;
}

/** Renames a pocket or changes its starting amount; its savings stay as they are. */
export function editPocket(db: SQLiteDatabase, id: number, input: PocketInput): Promise<WriteResult> {
  return attemptWrite(POCKET_FAILED, async () => {
    const [error] = validatePocket(input);
    if (error) return rejected(pocketErrorMessage(error));
    if (!(await getPocket(db, id))) return rejected(POCKET_GONE);
    await updatePocket(db, id, { name: input.name.trim(), startingCents: input.startingCents });
    return WRITE_OK;
  });
}

/** Deletes a pocket that holds no saving and no monthly saving; one in use is never deleted. */
export function deletePocket(db: SQLiteDatabase, id: number): Promise<WriteResult> {
  return attemptWrite(POCKET_DELETE_FAILED, async () => {
    if (!(await getPocket(db, id))) return rejected(POCKET_GONE);
    if (await pocketInUse(db, id)) return rejected(POCKET_IN_USE);
    await removePocket(db, id);
    return WRITE_OK;
  });
}
