import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getPlanVersions } from '@/features/plan/repository';
import type { PlanVersion } from '@/features/plan/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** Every saved savings percentage, reloaded every time the screen gets focus. */
export function usePlanVersions(): Loadable<PlanVersion[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getPlanVersions(db), [db]);
  return useFocusedData('plan-versions', load);
}
