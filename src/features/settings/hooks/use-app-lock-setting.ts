import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { hasDeviceLock } from '@/features/settings/device-auth';
import { getAppLock } from '@/features/settings/repository';
import { useFocusedData, type Loadable } from '@/shared/hooks/use-focused-data';

export type AppLockSetting = { enabled: boolean; deviceLock: boolean };

/** The stored lock setting and whether the phone has a screen lock, reloaded on focus. */
export function useAppLockSetting(): Loadable<AppLockSetting> {
  const db = useSQLiteContext();
  const load = useCallback(
    async () => ({ enabled: await getAppLock(db), deviceLock: await hasDeviceLock() }),
    [db],
  );
  return useFocusedData('app-lock-setting', load);
}
