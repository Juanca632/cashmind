import type { SQLiteDatabase } from 'expo-sqlite';

import type { Amount, IncomePlan, MonthOverrides, PlanVersion } from '@/features/plan/rules';
import type { FlexibleBucket } from '@/shared/buckets';
import { readInteger, readMonth, readOneOf } from '@/shared/read-checks';

const UNITS = ['eur', 'pct'] as const;
const FLEXIBLE_BUCKETS: readonly FlexibleBucket[] = ['leisure', 'savings'];

type PlanVersionRow = Record<
  'effective_month' | 'income_cents' | 'fixed_unit' | 'fixed_value' | 'kept_bucket' | 'kept_unit' | 'kept_value',
  unknown
>;

function toAmount(unit: unknown, value: unknown, field: string): Amount {
  const checkedUnit = readOneOf(unit, UNITS, `${field}_unit`);
  const checkedValue = readInteger(value, `${field}_value`);
  return checkedUnit === 'eur' ? { unit: checkedUnit, cents: checkedValue } : { unit: checkedUnit, pct: checkedValue };
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
    effectiveMonth: readMonth(row.effective_month, 'plan_version.effective_month'),
    incomeCents: readInteger(row.income_cents, 'plan_version.income_cents'),
    fixed: toAmount(row.fixed_unit, row.fixed_value, 'plan_version.fixed'),
    kept: readOneOf(row.kept_bucket, FLEXIBLE_BUCKETS, 'plan_version.kept_bucket'),
    keptAmount: toAmount(row.kept_unit, row.kept_value, 'plan_version.kept'),
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
  const rows = await db.getAllAsync<Record<'month' | 'income_cents', unknown>>(
    'SELECT month, income_cents FROM month_income_override',
  );
  return Object.fromEntries(
    rows.map((row) => [
      readMonth(row.month, 'month_income_override.month'),
      readInteger(row.income_cents, 'month_income_override.income_cents'),
    ]),
  );
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
