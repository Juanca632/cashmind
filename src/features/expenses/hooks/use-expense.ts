import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getExpense } from '@/features/expenses/repository';
import type { Expense } from '@/features/expenses/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** One expense by id; null when it does not exist, or when no id is given for a new expense. */
export function useExpense(id: number | null): Loadable<Expense | null> {
  const db = useSQLiteContext();
  const load = useCallback(async () => (id === null ? null : getExpense(db, id)), [db, id]);
  return useFocusedData(String(id), load);
}
