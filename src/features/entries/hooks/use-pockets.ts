import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getPockets } from '@/features/entries/repository';
import type { Pocket } from '@/features/entries/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** Every pocket in creation order, reloaded when the screen gets focus (a new one shows on return). */
export function usePockets(): Loadable<Pocket[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getPockets(db), [db]);
  return useFocusedData('pockets', load);
}
