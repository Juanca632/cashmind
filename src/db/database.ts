import type { SQLiteDatabase } from 'expo-sqlite';

import { seedDemoData } from '@/db/demo-data';
import { runMigrations } from '@/db/migrate';
import { MIGRATIONS } from '@/db/migrations';
import { IS_DEMO } from '@/shared/demo';

/** Demo mode opens its own file, so invented data never mixes with real data. */
export const DATABASE_NAME = IS_DEMO ? 'cashmind-demo.db' : 'cashmind.db';

/** Runs before the app renders (SQLiteProvider onInit). */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await runMigrations(db, MIGRATIONS);
  if (IS_DEMO) await seedDemoData(db, new Date());
}
