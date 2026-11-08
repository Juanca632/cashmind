/** The only way to change expenses. Every write is validated here before it reaches the database. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { deleteExpense as removeRow, getExpense, insertExpense, updateExpense } from '@/features/expenses/repository';
import {
  EXPENSE_MISSING,
  MONTH_LOCKED,
  expenseErrorMessage,
  isExpenseMonthEditable,
  validateExpense,
  type ExpenseInput,
} from '@/features/expenses/rules';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const WRITE_FAILED = 'The expense could not be saved. Please try again.';

function rejectIfInvalid(input: ExpenseInput, today: Date): WriteResult | null {
  const [error] = validateExpense(input, today);
  return error ? rejected(expenseErrorMessage(error, today)) : null;
}

/** Null when the stored expense can still be changed today. */
async function rejectIfLocked(db: SQLiteDatabase, id: number, today: Date): Promise<WriteResult | null> {
  const current = await getExpense(db, id);
  if (!current) return rejected(EXPENSE_MISSING);
  return isExpenseMonthEditable(current.date.slice(0, 7), today) ? null : rejected(MONTH_LOCKED);
}

export function addExpense(db: SQLiteDatabase, input: ExpenseInput, today: Date): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = rejectIfInvalid(input, today);
    if (refusal) return refusal;
    await insertExpense(db, input);
    return WRITE_OK;
  });
}

export function editExpense(db: SQLiteDatabase, id: number, input: ExpenseInput, today: Date): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = rejectIfInvalid(input, today) ?? (await rejectIfLocked(db, id, today));
    if (refusal) return refusal;
    await updateExpense(db, id, input);
    return WRITE_OK;
  });
}

export function deleteExpense(db: SQLiteDatabase, id: number, today: Date): Promise<WriteResult> {
  return attemptWrite(WRITE_FAILED, async () => {
    const refusal = await rejectIfLocked(db, id, today);
    if (refusal) return refusal;
    await removeRow(db, id);
    return WRITE_OK;
  });
}
