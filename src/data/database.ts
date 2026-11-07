import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'cashmind.db';

const DATABASE_VERSION = 1;

/** Runs before the app renders (SQLiteProvider onInit). Add a new step per version. */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE plan (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        income_cents INTEGER NOT NULL,
        fixed_pct INTEGER NOT NULL,
        leisure_pct INTEGER NOT NULL,
        savings_pct INTEGER NOT NULL
      );
      CREATE TABLE month_income_override (
        month TEXT PRIMARY KEY NOT NULL,
        income_cents INTEGER NOT NULL
      );
    `);
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
