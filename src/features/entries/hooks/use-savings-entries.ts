import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getSavingsEntries } from '@/features/entries/repository';
import type { Entry } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** Every savings entry, newest first, reloaded when the screen gets focus. */
export function useSavingsEntries(): Loadable<Entry[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getSavingsEntries(db), [db]);
  return useFocusedData('savings', load);
}
