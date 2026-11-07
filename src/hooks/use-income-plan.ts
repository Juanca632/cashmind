import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getMonthOverrides, getPlanVersions } from '@/data/income-plan-repo';
import type { MonthOverrides, PlanVersion } from '@/domain/income-plan';

type State =
  | { status: 'loading' }
  | { status: 'ready'; versions: PlanVersion[]; overrides: MonthOverrides };

/** Loads all plan versions and month overrides, and reloads them every time the screen gets focus. */
export function useIncomePlan(): State {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getPlanVersions(db), getMonthOverrides(db)]).then(([versions, overrides]) => {
        if (active) setState({ status: 'ready', versions, overrides });
      });
      return () => {
        active = false;
      };
    }, [db]),
  );

  return state;
}
