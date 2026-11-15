import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getActiveRecurringItems } from '@/features/entries/repository';
import type { RecurringItem } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** The monthly items that still repeat, reloaded when the screen gets focus. */
export function useRecurringItems(): Loadable<RecurringItem[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getActiveRecurringItems(db), [db]);
  return useFocusedData('recurring', load);
}
