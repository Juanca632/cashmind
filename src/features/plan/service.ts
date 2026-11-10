/** The only way to change the plan. Every write is validated here first. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { savePlanFromMonth } from '@/features/plan/repository';
import { PERCENT_INVALID, isValidPercent } from '@/features/plan/rules';
import { monthKey } from '@/shared/months';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const PLAN_FAILED = 'The plan could not be saved. Please try again.';

/** Saves the savings percentage from the current month onwards; past months keep theirs. */
export function savePlan(db: SQLiteDatabase, savingsPercent: number, today: Date): Promise<WriteResult> {
  return attemptWrite(PLAN_FAILED, async () => {
    if (!isValidPercent(savingsPercent)) return rejected(PERCENT_INVALID);
    await savePlanFromMonth(db, savingsPercent, monthKey(today));
    return WRITE_OK;
  });
}
