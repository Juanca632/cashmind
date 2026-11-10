import type { SQLiteDatabase } from 'expo-sqlite';

import type { PlanVersion } from '@/features/plan/rules';
import { DataFormatError, readInteger, readMonth } from '@/shared/read-checks';

type PlanVersionRow = Record<'effective_month' | 'savings_pct', unknown>;

function readPercent(value: unknown): number {
  const percent = readInteger(value, 'plan_version.savings_pct');
  if (percent < 0 || percent > 100) throw new DataFormatError('plan_version.savings_pct');
  return percent;
}

export async function getPlanVersions(db: SQLiteDatabase): Promise<PlanVersion[]> {
  const rows = await db.getAllAsync<PlanVersionRow>(
    'SELECT effective_month, savings_pct FROM plan_version ORDER BY effective_month',
  );
  return rows.map((row) => ({
    effectiveMonth: readMonth(row.effective_month, 'plan_version.effective_month'),
    savingsPercent: readPercent(row.savings_pct),
  }));
}

/** Saves the percentage as the version that applies from `month` onwards, replacing that month's version. */
export async function savePlanFromMonth(db: SQLiteDatabase, savingsPercent: number, month: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO plan_version (effective_month, savings_pct) VALUES (?, ?)
     ON CONFLICT(effective_month) DO UPDATE SET savings_pct = excluded.savings_pct`,
    month,
    savingsPercent,
  );
}
