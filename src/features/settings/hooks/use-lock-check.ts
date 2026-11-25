import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { hasDeviceLock } from '@/features/settings/device-auth';
import { getAppLock } from '@/features/settings/repository';

/**
 * Returns a stable function that tells whether the app should lock now: the lock setting is on
 * (an unreadable setting counts as on) and the phone has a screen lock to unlock with.
 */
export function useLockCheck(): () => Promise<boolean> {
  const db = useSQLiteContext();
  return useCallback(async () => {
    const enabled = await getAppLock(db).catch(() => true);
    return enabled && (await hasDeviceLock());
  }, [db]);
}
