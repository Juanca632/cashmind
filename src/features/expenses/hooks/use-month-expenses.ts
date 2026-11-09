import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getExpensesOfMonth } from '@/features/expenses/repository';
import type { Expense } from '@/features/expenses/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/**
 * A month's entries ('YYYY-MM'), reloaded when the screen gets focus or the month changes.
 * Changing `refresh` reloads after a change made on this same screen.
 */
export function useMonthExpenses(month: string, refresh = 0): Loadable<Expense[]> {
  const db = useSQLiteContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => getExpensesOfMonth(db, month), [db, month, refresh]);
  return useFocusedData(month, load);
}
