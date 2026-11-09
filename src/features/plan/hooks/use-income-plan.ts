import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getPlanVersions } from '@/features/plan/repository';
import type { PlanVersion } from '@/features/plan/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

/** All plan versions, reloaded every time the screen gets focus. */
export function useIncomePlan(): Loadable<PlanVersion[]> {
  const db = useSQLiteContext();
  const load = useCallback(() => getPlanVersions(db), [db]);
  return useFocusedData('income-plan', load);
}
