/** The only way to change the plan and month incomes. Every write is validated here first. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { removeMonthOverride, savePlanFromMonth, setMonthOverride } from '@/features/plan/repository';
import { incomeErrorMessage, isValidMonthIncome, planErrorMessage, validatePlan, type IncomePlan } from '@/features/plan/rules';
import { monthKey } from '@/shared/months';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const PLAN_FAILED = 'The plan could not be saved. Please try again.';
const INCOME_FAILED = "This month's income could not be saved. Please try again.";

export function savePlan(db: SQLiteDatabase, plan: IncomePlan, today: Date): Promise<WriteResult> {
  return attemptWrite(PLAN_FAILED, async () => {
    const [error] = validatePlan(plan);
    if (error) return rejected(planErrorMessage(error, plan));
    await savePlanFromMonth(db, plan, monthKey(today));
    return WRITE_OK;
  });
}

export function setMonthIncome(db: SQLiteDatabase, incomeCents: number, today: Date): Promise<WriteResult> {
  return attemptWrite(INCOME_FAILED, async () => {
    if (!isValidMonthIncome(incomeCents)) return rejected(incomeErrorMessage(incomeCents));
    await setMonthOverride(db, monthKey(today), incomeCents);
    return WRITE_OK;
  });
}

export function removeMonthIncome(db: SQLiteDatabase, today: Date): Promise<WriteResult> {
  return attemptWrite(INCOME_FAILED, async () => {
    await removeMonthOverride(db, monthKey(today));
    return WRITE_OK;
  });
}
