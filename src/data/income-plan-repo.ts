import type { SQLiteDatabase } from 'expo-sqlite';

import type { IncomePlan, MonthOverrides } from '@/domain/income-plan';

type PlanRow = {
  income_cents: number;
  fixed_cents: number;
  savings_pct: number;
};

export async function getPlan(db: SQLiteDatabase): Promise<IncomePlan | null> {
  const row = await db.getFirstAsync<PlanRow>(
    'SELECT income_cents, fixed_cents, savings_pct FROM plan WHERE id = 1',
  );
  if (!row) return null;
  return { incomeCents: row.income_cents, fixedCents: row.fixed_cents, savingsPct: row.savings_pct };
}

export async function savePlan(db: SQLiteDatabase, plan: IncomePlan): Promise<void> {
  await db.runAsync(
    `INSERT INTO plan (id, income_cents, fixed_cents, savings_pct)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       income_cents = excluded.income_cents,
       fixed_cents = excluded.fixed_cents,
       savings_pct = excluded.savings_pct`,
    plan.incomeCents,
    plan.fixedCents,
    plan.savingsPct,
  );
}

export async function getMonthOverrides(db: SQLiteDatabase): Promise<MonthOverrides> {
  const rows = await db.getAllAsync<{ month: string; income_cents: number }>(
    'SELECT month, income_cents FROM month_income_override',
  );
  return Object.fromEntries(rows.map((row) => [row.month, row.income_cents]));
}

export async function setMonthOverride(db: SQLiteDatabase, month: string, incomeCents: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO month_income_override (month, income_cents) VALUES (?, ?)
     ON CONFLICT(month) DO UPDATE SET income_cents = excluded.income_cents`,
    month,
    incomeCents,
  );
}

export async function removeMonthOverride(db: SQLiteDatabase, month: string): Promise<void> {
  await db.runAsync('DELETE FROM month_income_override WHERE month = ?', month);
}
