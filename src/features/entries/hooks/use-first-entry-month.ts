import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getFirstEntryMonth } from '@/features/entries/repository';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** Month of the oldest recorded entry ('YYYY-MM'), or null when nothing was recorded. */
export function useFirstEntryMonth(): Loadable<string | null> {
  const db = useSQLiteContext();
  const load = useCallback(() => getFirstEntryMonth(db), [db]);
  return useFocusedData('first-entry-month', load);
}
