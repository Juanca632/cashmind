/** The only way to change entries. Every write is validated here before it reaches the database. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { deleteEntry as removeRow, getEntry, insertEntry, updateEntry } from '@/features/entries/repository';
import {
  ENTRY_MISSING,
  entryErrorMessage,
  validateEntry,
  type EntryInput,
} from '@/features/entries/rules';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const WRITE_FAILED = 'The entry could not be saved. Please try again.';
const DELETE_FAILED = 'The entry could not be deleted. Please try again.';

function rejectIfInvalid(input: EntryInput, today: Date): WriteResult | null {
  const [error] = validateEntry(input, today);
  return error ? rejected(entryErrorMessage(error)) : null;
}

export function addEntry(db: SQLiteDatabase, input: EntryInput, today: Date): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = rejectIfInvalid(input, today);
    if (refusal) return refusal;
    await insertEntry(db, input);
    return WRITE_OK;
  });
}

export function editEntry(db: SQLiteDatabase, id: number, input: EntryInput, today: Date): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = rejectIfInvalid(input, today);
    if (refusal) return refusal;
    const current = await getEntry(db, id);
    if (!current) return rejected(ENTRY_MISSING);
    await updateEntry(db, id, input);
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
