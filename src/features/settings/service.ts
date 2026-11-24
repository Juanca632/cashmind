/** The only way to change the settings. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { saveAppLock } from '@/features/settings/repository';
import { WRITE_OK, attemptWrite, type WriteResult } from '@/shared/write-result';

const SETTING_FAILED = 'The setting could not be saved. Please try again.';

/** Turns the app lock on or off. The screen asks the phone's authentication before calling this. */
export function setAppLock(db: SQLiteDatabase, on: boolean): Promise<WriteResult> {
  return attemptWrite(SETTING_FAILED, async () => {
    await saveAppLock(db, on);
    return WRITE_OK;
  });
}
