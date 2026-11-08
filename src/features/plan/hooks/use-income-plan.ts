import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getMonthOverrides, getPlanVersions } from '@/features/plan/repository';
import type { MonthOverrides, PlanVersion } from '@/features/plan/rules';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

type IncomePlanData = { versions: PlanVersion[]; overrides: MonthOverrides };

/** All plan versions and month overrides, reloaded every time the screen gets focus. */
export function useIncomePlan(): Loadable<IncomePlanData> {
  const db = useSQLiteContext();
  const load = useCallback(async () => {
    const [versions, overrides] = await Promise.all([getPlanVersions(db), getMonthOverrides(db)]);
    return { versions, overrides };
  }, [db]);
  return useFocusedData('income-plan', load);
}
