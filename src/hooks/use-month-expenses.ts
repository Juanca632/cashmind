import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getExpensesOfMonth } from '@/data/expense-repo';
import type { Expense } from '@/domain/expenses';

/** Loads a month's expenses ('YYYY-MM'), reloading every time the screen gets focus or the month changes. */
export function useMonthExpenses(month: string): Expense[] | null {
  const db = useSQLiteContext();
  const [loaded, setLoaded] = useState<{ month: string; expenses: Expense[] } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getExpensesOfMonth(db, month).then((expenses) => {
        if (active) setLoaded({ month, expenses });
      });
      return () => {
        active = false;
      };
    }, [db, month]),
  );

  // Don't show the previous month's rows while the new month loads.
  return loaded?.month === month ? loaded.expenses : null;
}
