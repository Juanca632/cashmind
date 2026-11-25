import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getMove, getMoves } from '@/features/entries/repository';
import type { Move } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** Every move between pockets and Main, newest first, reloaded on focus (specs/028-move-money). */
export function useMoves(): Loadable<Move[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getMoves(db), [db]);
  return useFocusedData('moves', load);
}

/** One move by id; null when it does not exist, or when no id is given for a new move. */
export function useMove(id: number | null): Loadable<Move | null> {
  const db = useSQLiteContext();
  const load = useCallback(async () => (id === null ? null : getMove(db, id)), [db, id]);
  return useFocusedData(`move:${String(id)}`, load);
}
