/** The only way to change the plan. Every write is validated here first. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { savePlanFromMonth } from '@/features/plan/repository';
import { planErrorMessage, validatePlan, type IncomePlan } from '@/features/plan/rules';
import { monthKey } from '@/shared/months';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const PLAN_FAILED = 'The plan could not be saved. Please try again.';

export function savePlan(db: SQLiteDatabase, plan: IncomePlan, today: Date): Promise<WriteResult> {
  return attemptWrite(PLAN_FAILED, async () => {
    const [error] = validatePlan(plan);
    if (error) return rejected(planErrorMessage(error, plan));
    await savePlanFromMonth(db, plan, monthKey(today));
    return WRITE_OK;
  });
}
