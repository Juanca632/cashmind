import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getLatestIncomeBefore } from '@/features/entries/repository';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** The income of the most recent month before `month`, in cents, or null when there is none. */
export function usePreviousIncome(month: string, refresh: number): Loadable<number | null> {
  const db = useSQLiteContext();
  // `refresh` reloads after a change made on this same screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => getLatestIncomeBefore(db, month), [db, month, refresh]);
  return useFocusedData(month, load);
}
