/** The only way to change the settings. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { saveAppLock, saveCurrency } from '@/features/settings/repository';
import { CURRENCIES, type Currency } from '@/shared/money';
import { WRITE_OK, attemptWrite, rejected, type WriteResult } from '@/shared/write-result';

const SETTING_FAILED = 'The setting could not be saved. Please try again.';

/** Turns the app lock on or off. The screen asks the phone's authentication before calling this. */
export function setAppLock(db: SQLiteDatabase, on: boolean): Promise<WriteResult> {
  return attemptWrite(SETTING_FAILED, async () => {
    await saveAppLock(db, on);
    return WRITE_OK;
  });
}

/** Picks the app's currency. Stored amounts are not converted. */
export function setCurrency(db: SQLiteDatabase, currency: Currency): Promise<WriteResult> {
  return attemptWrite(SETTING_FAILED, async () => {
    if (!CURRENCIES.includes(currency)) return rejected('Pick one of the listed currencies.');
    await saveCurrency(db, currency);
    return WRITE_OK;
  });
}
