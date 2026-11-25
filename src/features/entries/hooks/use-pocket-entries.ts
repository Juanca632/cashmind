import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getPocketEntries } from '@/features/entries/repository';
import type { Entry } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** Every entry with a pocket (savings and expenses paid from one), newest first, reloaded on focus. */
export function usePocketEntries(): Loadable<Entry[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getPocketEntries(db), [db]);
  return useFocusedData('pocket-entries', load);
}
