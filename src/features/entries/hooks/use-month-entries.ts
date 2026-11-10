import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getEntriesOfMonth } from '@/features/entries/repository';
import type { Entry } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/**
 * A month's entries ('YYYY-MM'), reloaded when the screen gets focus or the month changes.
 * Changing `refresh` reloads after a change made on this same screen.
 */
export function useMonthEntries(month: string, refresh = 0): Loadable<Entry[]> {
  const db = useSQLiteContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => getEntriesOfMonth(db, month), [db, month, refresh]);
  return useFocusedData(month, load);
}
