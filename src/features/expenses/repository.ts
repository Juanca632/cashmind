import type { SQLiteDatabase } from 'expo-sqlite';

import type { Expense, ExpenseInput } from '@/features/expenses/rules';
import { ENTRY_BUCKETS } from '@/shared/buckets';
import { readDay, readInteger, readOneOf, readPositiveInteger, readText } from '@/shared/read-checks';

type ExpenseRow = Record<'id' | 'date' | 'bucket' | 'amount_cents' | 'note', unknown>;

const COLUMNS = 'id, date, bucket, amount_cents, note';

function toExpense(row: ExpenseRow): Expense {
  return {
    id: readInteger(row.id, 'expense.id'),
    date: readDay(row.date, 'expense.date'),
    bucket: readOneOf(row.bucket, ENTRY_BUCKETS, 'expense.bucket'),
    amountCents: readPositiveInteger(row.amount_cents, 'expense.amount_cents'),
    note: readText(row.note, 'expense.note'),
  };
}

/** Expenses of a month ('YYYY-MM'), newest first. */
export async function getExpensesOfMonth(db: SQLiteDatabase, month: string): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT ${COLUMNS} FROM expense WHERE substr(date, 1, 7) = ? ORDER BY date DESC, id DESC`,
    month,
  );
  return rows.map(toExpense);
}

/**
 * Total income of the most recent month before `month`, or null when there is none. Every earlier
 * income is format-checked, like any other read.
 */
export async function getLatestIncomeBefore(db: SQLiteDatabase, month: string): Promise<number | null> {
  const rows = await db.getAllAsync<Record<'date' | 'amount_cents', unknown>>(
    `SELECT date, amount_cents FROM expense
     WHERE bucket = 'income' AND substr(date, 1, 7) < ?
     ORDER BY date DESC, id DESC`,
    month,
  );
  const incomes = rows.map((row) => ({
    month: readDay(row.date, 'expense.date').slice(0, 7),
    cents: readPositiveInteger(row.amount_cents, 'expense.amount_cents'),
  }));
  if (incomes.length === 0) return null;
  const latest = incomes[0].month;
  return incomes.filter((income) => income.month === latest).reduce((sum, income) => sum + income.cents, 0);
}

/** Month ('YYYY-MM') of the oldest recorded entry, or null when nothing was recorded. */
export async function getFirstEntryMonth(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ first: unknown }>('SELECT min(date) AS first FROM expense');
  return row?.first == null ? null : readDay(row.first, 'expense.date').slice(0, 7);
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
