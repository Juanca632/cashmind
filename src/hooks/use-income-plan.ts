import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getMonthOverrides, getPlan } from '@/data/income-plan-repo';
import type { IncomePlan, MonthOverrides } from '@/domain/income-plan';

type State =
  | { status: 'loading' }
  | { status: 'ready'; plan: IncomePlan | null; overrides: MonthOverrides };

/** Loads the plan and month overrides, and reloads them every time the screen gets focus. */
export function useIncomePlan(): State {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getPlan(db), getMonthOverrides(db)]).then(([plan, overrides]) => {
        if (active) setState({ status: 'ready', plan, overrides });
      });
      return () => {
        active = false;
      };
    }, [db]),
  );

  return state;
}
