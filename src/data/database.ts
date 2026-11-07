import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'cashmind.db';

const DATABASE_VERSION = 2;

/** Runs before the app renders (SQLiteProvider onInit). Add a new step per version. */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (version === 0) {
      await db.execAsync(`
        CREATE TABLE plan (
          id INTEGER PRIMARY KEY CHECK (id = 1),
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

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
