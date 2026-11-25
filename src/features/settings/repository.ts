import type { SQLiteDatabase } from 'expo-sqlite';

import { CURRENCIES, type Currency } from '@/shared/money';
import { readOneOf } from '@/shared/read-checks';

const APP_LOCK = 'app_lock';
const LOCK_VALUES = ['on', 'off'] as const;

/** Whether the app lock is on. It is on until the user turns it off, so a missing value means on. */
export async function getAppLock(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ value: unknown }>('SELECT value FROM setting WHERE key = ?', APP_LOCK);
  if (row === null) return true;
  return readOneOf(row.value, LOCK_VALUES, 'setting.app_lock') === 'on';
}

export async function saveAppLock(db: SQLiteDatabase, on: boolean): Promise<void> {
  await db.runAsync(
    `INSERT INTO setting (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    APP_LOCK,
    on ? 'on' : 'off',
  );
}

const CURRENCY = 'currency';

/** The app's currency. Euro until the user picks another, so a missing value means EUR. */
export async function getCurrency(db: SQLiteDatabase): Promise<Currency> {
  const row = await db.getFirstAsync<{ value: unknown }>('SELECT value FROM setting WHERE key = ?', CURRENCY);
  if (row === null) return 'EUR';
  return readOneOf(row.value, CURRENCIES, 'setting.currency');
}

export async function saveCurrency(db: SQLiteDatabase, currency: Currency): Promise<void> {
  await db.runAsync(
    `INSERT INTO setting (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    CURRENCY,
    currency,
  );
}
