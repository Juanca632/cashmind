import type { SQLiteDatabase } from 'expo-sqlite';

import type { Amount, FixedItem, IncomePlan, PlanVersion } from '@/features/plan/rules';
import type { FlexibleBucket } from '@/shared/buckets';
import { readInteger, readMonth, readOneOf, readPositiveInteger, readText } from '@/shared/read-checks';

const UNITS = ['eur', 'pct'] as const;
const FLEXIBLE_BUCKETS: readonly FlexibleBucket[] = ['leisure', 'savings'];

type PlanVersionRow = Record<
  'effective_month' | 'kept_bucket' | 'kept_unit' | 'kept_value',
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

async function getFixedItemsByMonth(db: SQLiteDatabase): Promise<Map<string, FixedItem[]>> {
  const rows = await db.getAllAsync<Record<'effective_month' | 'name' | 'amount_cents', unknown>>(
    'SELECT effective_month, name, amount_cents FROM fixed_item ORDER BY id',
  );
  const byMonth = new Map<string, FixedItem[]>();
  for (const row of rows) {
    const month = readMonth(row.effective_month, 'fixed_item.effective_month');
    const item = {
      name: readText(row.name, 'fixed_item.name'),
      amountCents: readPositiveInteger(row.amount_cents, 'fixed_item.amount_cents'),
    };
    byMonth.set(month, [...(byMonth.get(month) ?? []), item]);
  }
  return byMonth;
}

export async function getPlanVersions(db: SQLiteDatabase): Promise<PlanVersion[]> {
  const rows = await db.getAllAsync<PlanVersionRow>(
    `SELECT effective_month, kept_bucket, kept_unit, kept_value
     FROM plan_version ORDER BY effective_month`,
  );
  const itemsByMonth = await getFixedItemsByMonth(db);
  return rows.map((row) => {
    const effectiveMonth = readMonth(row.effective_month, 'plan_version.effective_month');
    return {
      effectiveMonth,
      fixedItems: itemsByMonth.get(effectiveMonth) ?? [],
      kept: readOneOf(row.kept_bucket, FLEXIBLE_BUCKETS, 'plan_version.kept_bucket'),
      keptAmount: toAmount(row.kept_unit, row.kept_value, 'plan_version.kept'),
    };
  });
}

/**
 * Saves the plan as the version that applies from `month` onwards, replacing that month's version
 * and list if any. The version and its items are written together or not at all.
 */
export async function savePlanFromMonth(db: SQLiteDatabase, plan: IncomePlan, month: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO plan_version (effective_month, kept_bucket, kept_unit, kept_value)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(effective_month) DO UPDATE SET
         kept_bucket = excluded.kept_bucket,
         kept_unit = excluded.kept_unit,
         kept_value = excluded.kept_value`,
      month,
      plan.kept,
      plan.keptAmount.unit,
      amountValue(plan.keptAmount),
    );
    await db.runAsync('DELETE FROM fixed_item WHERE effective_month = ?', month);
    for (const item of plan.fixedItems) {
      await db.runAsync(
        'INSERT INTO fixed_item (effective_month, name, amount_cents) VALUES (?, ?, ?)',
        month,
        item.name.trim(),
        item.amountCents,
      );
    }
  });
}
