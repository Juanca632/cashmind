import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from '@/db/migrate';
import { MIGRATIONS } from '@/db/migrations';

export const DATABASE_NAME = 'cashmind.db';

/** Runs before the app renders (SQLiteProvider onInit). */
export function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  return runMigrations(db, MIGRATIONS);
}
