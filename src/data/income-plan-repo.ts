import type { SQLiteDatabase } from 'expo-sqlite';

import type { IncomePlan, MonthOverrides, PlanVersion } from '@/domain/income-plan';

type PlanVersionRow = {
  effective_month: string;
  income_cents: number;
  fixed_cents: number;
  savings_pct: number;
};

export async function getPlanVersions(db: SQLiteDatabase): Promise<PlanVersion[]> {
  const rows = await db.getAllAsync<PlanVersionRow>(
    'SELECT effective_month, income_cents, fixed_cents, savings_pct FROM plan_version ORDER BY effective_month',
  );
  return rows.map((row) => ({
    effectiveMonth: row.effective_month,
    incomeCents: row.income_cents,
    fixedCents: row.fixed_cents,
    savingsPct: row.savings_pct,
  }));
}

/** Saves the plan as the version that applies from `month` onwards, replacing that month's version if any. */
export async function savePlanFromMonth(db: SQLiteDatabase, plan: IncomePlan, month: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO plan_version (effective_month, income_cents, fixed_cents, savings_pct)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(effective_month) DO UPDATE SET
       income_cents = excluded.income_cents,
       fixed_cents = excluded.fixed_cents,
       savings_pct = excluded.savings_pct`,
    month,
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
