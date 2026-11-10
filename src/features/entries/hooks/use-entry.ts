import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getEntry } from '@/features/entries/repository';
import type { Entry } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** One entry by id; null when it does not exist, or when no id is given for a new entry. */
export function useEntry(id: number | null): Loadable<Entry | null> {
  const db = useSQLiteContext();
  const load = useCallback(async () => (id === null ? null : getEntry(db, id)), [db, id]);
  return useFocusedData(String(id), load);
}
