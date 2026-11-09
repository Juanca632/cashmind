/** The only way to change expenses. Every write is validated here before it reaches the database. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { deleteExpense as removeRow, getExpense, insertExpense, updateExpense } from '@/features/expenses/repository';
import {
  EXPENSE_MISSING,
  canUseBucket,
  expenseErrorMessage,
  validateExpense,
  type ExpenseInput,
} from '@/features/expenses/rules';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const WRITE_FAILED = 'The expense could not be saved. Please try again.';

function rejectIfInvalid(input: ExpenseInput, today: Date): WriteResult | null {
  const [error] = validateExpense(input, today);
  return error ? rejected(expenseErrorMessage(error)) : null;
}

export function addExpense(db: SQLiteDatabase, input: ExpenseInput, today: Date): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = rejectIfInvalid(input, today);
    if (refusal) return refusal;
    if (!canUseBucket(input.bucket)) return rejected(expenseErrorMessage('bucket-invalid'));
    await insertExpense(db, input);
    return WRITE_OK;
  });
}

export function editExpense(db: SQLiteDatabase, id: number, input: ExpenseInput, today: Date): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = rejectIfInvalid(input, today);
    if (refusal) return refusal;
    const current = await getExpense(db, id);
    if (!current) return rejected(EXPENSE_MISSING);
    if (!canUseBucket(input.bucket, current.bucket)) return rejected(expenseErrorMessage('bucket-invalid'));
    await updateExpense(db, id, input);
    return WRITE_OK;
  });
}

export function deleteExpense(db: SQLiteDatabase, id: number): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    if (!(await getExpense(db, id))) return rejected(EXPENSE_MISSING);
    await removeRow(db, id);
    return WRITE_OK;
  });
}
