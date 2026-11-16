import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getEntriesBetween } from '@/features/entries/repository';
import type { Entry } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** The entries of the months from `from` to `to` ('YYYY-MM'), reloaded when the screen gets focus. */
export function useEntriesBetween(from: string, to: string): Loadable<Entry[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getEntriesBetween(db, from, to), [db, from, to]);
  return useFocusedData(`${from}:${to}`, load);
}
