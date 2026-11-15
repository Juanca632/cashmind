import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getRecurringItem } from '@/features/entries/repository';
import type { RecurringItem } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** One monthly item by id, active or stopped; null when it does not exist or no id is given. */
export function useRecurringItem(id: number | null): Loadable<RecurringItem | null> {
  const db = useSQLiteContext();
  const load = useCallback(async () => (id === null ? null : getRecurringItem(db, id)), [db, id]);
  return useFocusedData(String(id), load);
}
