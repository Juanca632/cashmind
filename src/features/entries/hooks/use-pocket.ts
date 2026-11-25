import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getPocket, pocketInUse } from '@/features/entries/repository';
import type { Pocket } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

export type LoadedPocket = { pocket: Pocket; inUse: boolean } | null;

/** One pocket and whether any saving points to it; null when it does not exist. */
export function usePocket(id: number): Loadable<LoadedPocket> {
  const db = useSQLiteContext();
  const load = useCallback(async () => {
    const pocket = await getPocket(db, id);
    return pocket ? { pocket, inUse: await pocketInUse(db, id) } : null;
  }, [db, id]);
  return useFocusedData(`pocket:${id}`, load);
}
