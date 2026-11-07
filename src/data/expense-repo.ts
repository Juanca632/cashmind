import type { SQLiteDatabase } from 'expo-sqlite';

import type { Expense, ExpenseInput } from '@/domain/expenses';
import type { Bucket } from '@/domain/income-plan';

type ExpenseRow = {
  id: number;
  date: string;
  bucket: Bucket;
  amount_cents: number;
  note: string;
};

const COLUMNS = 'id, date, bucket, amount_cents, note';

function toExpense(row: ExpenseRow): Expense {
  return { id: row.id, date: row.date, bucket: row.bucket, amountCents: row.amount_cents, note: row.note };
}

/** Expenses of a month ('YYYY-MM'), newest first. */
export async function getExpensesOfMonth(db: SQLiteDatabase, month: string): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT ${COLUMNS} FROM expense WHERE substr(date, 1, 7) = ? ORDER BY date DESC, id DESC`,
    month,
  );
  return rows.map(toExpense);
}

export async function getExpense(db: SQLiteDatabase, id: number): Promise<Expense | null> {
  const row = await db.getFirstAsync<ExpenseRow>(`SELECT ${COLUMNS} FROM expense WHERE id = ?`, id);
  return row ? toExpense(row) : null;
}

export async function insertExpense(db: SQLiteDatabase, input: ExpenseInput): Promise<void> {
  await db.runAsync(
    'INSERT INTO expense (date, bucket, amount_cents, note) VALUES (?, ?, ?, ?)',
    input.date,
    input.bucket,
    input.amountCents,
    input.note,
  );
}

export async function updateExpense(db: SQLiteDatabase, id: number, input: ExpenseInput): Promise<void> {
  await db.runAsync(
    'UPDATE expense SET date = ?, bucket = ?, amount_cents = ?, note = ? WHERE id = ?',
    input.date,
    input.bucket,
    input.amountCents,
    input.note,
    id,
  );
}

export async function deleteExpense(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM expense WHERE id = ?', id);
}
