import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getExpensesOfMonth } from '@/features/expenses/repository';
import type { Expense } from '@/features/expenses/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** A month's expenses ('YYYY-MM'), reloaded when the screen gets focus or the month changes. */
export function useMonthExpenses(month: string): Loadable<Expense[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getExpensesOfMonth(db, month), [db, month]);
  return useFocusedData(month, load);
}
