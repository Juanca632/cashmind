import type { SQLiteDatabase } from 'expo-sqlite';

import { monthKey } from '@/shared/months';

export const DATABASE_NAME = 'cashmind.db';

const DATABASE_VERSION = 5;

/** Runs before the app renders (SQLiteProvider onInit). Each step upgrades one version. */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (version === 0) {
      await db.execAsync(`
        CREATE TABLE plan_version (
          effective_month TEXT PRIMARY KEY NOT NULL,
          income_cents INTEGER NOT NULL,
          fixed_cents INTEGER NOT NULL,
          savings_pct INTEGER NOT NULL
        );
        CREATE TABLE month_income_override (
          month TEXT PRIMARY KEY NOT NULL,
          income_cents INTEGER NOT NULL
        );
      `);
    }

    if (version === 1) {
      // Fixed expenses go from a percentage to an amount; leisure is no longer stored.
      await db.execAsync(`
        ALTER TABLE plan ADD COLUMN fixed_cents INTEGER NOT NULL DEFAULT 0;
        UPDATE plan SET fixed_cents = income_cents * fixed_pct / 100;
        ALTER TABLE plan DROP COLUMN fixed_pct;
        ALTER TABLE plan DROP COLUMN leisure_pct;
      `);
    }

    if (version === 1 || version === 2) {
      // The single plan becomes the first version, applying from the earliest month with data.
      const oldest = await db.getFirstAsync<{ month: string | null }>(
        'SELECT MIN(month) AS month FROM month_income_override',
      );
      const currentMonth = monthKey(new Date());
      const effectiveMonth = oldest?.month && oldest.month < currentMonth ? oldest.month : currentMonth;
      await db.execAsync(`
        CREATE TABLE plan_version (
          effective_month TEXT PRIMARY KEY NOT NULL,
          income_cents INTEGER NOT NULL,
          fixed_cents INTEGER NOT NULL,
          savings_pct INTEGER NOT NULL
        );
      `);
      await db.runAsync(
        `INSERT INTO plan_version (effective_month, income_cents, fixed_cents, savings_pct)
         SELECT ?, income_cents, fixed_cents, savings_pct FROM plan`,
        effectiveMonth,
      );
      await db.execAsync('DROP TABLE plan');
    }

    if (version <= 3) {
      await db.execAsync(`
        CREATE TABLE expense (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          bucket TEXT NOT NULL CHECK (bucket IN ('fixed', 'leisure', 'savings')),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    }

    if (version <= 4) {
      // Each bucket is stored as typed (euros or percent); the other flexible bucket is automatic.
      await db.execAsync(`
        CREATE TABLE plan_version_new (
          effective_month TEXT PRIMARY KEY NOT NULL,
          income_cents INTEGER NOT NULL,
          fixed_unit TEXT NOT NULL CHECK (fixed_unit IN ('eur', 'pct')),
          fixed_value INTEGER NOT NULL,
          kept_bucket TEXT NOT NULL CHECK (kept_bucket IN ('leisure', 'savings')),
          kept_unit TEXT NOT NULL CHECK (kept_unit IN ('eur', 'pct')),
          kept_value INTEGER NOT NULL
        );
        INSERT INTO plan_version_new
          (effective_month, income_cents, fixed_unit, fixed_value, kept_bucket, kept_unit, kept_value)
        SELECT effective_month, income_cents, 'eur', fixed_cents, 'savings', 'pct', savings_pct FROM plan_version;
        DROP TABLE plan_version;
        ALTER TABLE plan_version_new RENAME TO plan_version;
      `);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
