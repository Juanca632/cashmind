import type { SQLiteDatabase } from 'expo-sqlite';

import type { Amount, FlexibleBucket, IncomePlan, MonthOverrides, PlanVersion } from '@/domain/income-plan';

type Unit = 'eur' | 'pct';

type PlanVersionRow = {
  effective_month: string;
  income_cents: number;
  fixed_unit: Unit;
  fixed_value: number;
  kept_bucket: FlexibleBucket;
  kept_unit: Unit;
  kept_value: number;
};

function toAmount(unit: Unit, value: number): Amount {
  return unit === 'eur' ? { unit, cents: value } : { unit, pct: value };
}

function amountValue(amount: Amount): number {
  return amount.unit === 'eur' ? amount.cents : amount.pct;
}

export async function getPlanVersions(db: SQLiteDatabase): Promise<PlanVersion[]> {
  const rows = await db.getAllAsync<PlanVersionRow>(
    `SELECT effective_month, income_cents, fixed_unit, fixed_value, kept_bucket, kept_unit, kept_value
     FROM plan_version ORDER BY effective_month`,
  );
  return rows.map((row) => ({
    effectiveMonth: row.effective_month,
    incomeCents: row.income_cents,
    fixed: toAmount(row.fixed_unit, row.fixed_value),
    kept: row.kept_bucket,
    keptAmount: toAmount(row.kept_unit, row.kept_value),
  }));
}

/** Saves the plan as the version that applies from `month` onwards, replacing that month's version if any. */
export async function savePlanFromMonth(db: SQLiteDatabase, plan: IncomePlan, month: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO plan_version
       (effective_month, income_cents, fixed_unit, fixed_value, kept_bucket, kept_unit, kept_value)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(effective_month) DO UPDATE SET
       income_cents = excluded.income_cents,
       fixed_unit = excluded.fixed_unit,
       fixed_value = excluded.fixed_value,
       kept_bucket = excluded.kept_bucket,
       kept_unit = excluded.kept_unit,
       kept_value = excluded.kept_value`,
    month,
    plan.incomeCents,
    plan.fixed.unit,
    amountValue(plan.fixed),
    plan.kept,
    plan.keptAmount.unit,
    amountValue(plan.keptAmount),
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
