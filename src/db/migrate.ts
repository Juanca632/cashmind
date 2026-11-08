import type { SQLiteDatabase } from 'expo-sqlite';

export type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

/** The database was saved by a newer version of the app. */
export class DatabaseNewerError extends Error {
  constructor() {
    super('The database is newer than this version of the app');
    this.name = 'DatabaseNewerError';
  }
}

/** A migration step failed. Its changes were rolled back. */
export class DatabaseMigrationError extends Error {
  constructor(version: number, cause: unknown) {
    // Keeps the original error for debugging. Never log it: it could contain user data.
    super(`Could not migrate the database to version ${version}`, { cause });
    this.name = 'DatabaseMigrationError';
  }
}

async function readVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/** Applies the steps the database is missing, in order, each in its own transaction. */
export async function runMigrations(db: SQLiteDatabase, migrations: readonly Migration[]): Promise<void> {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) throw new Error('Migrations must be numbered 1, 2, 3… with no gaps');
  });

  const current = await readVersion(db);
  if (current > migrations.length) throw new DatabaseNewerError();

  for (const migration of migrations.slice(current)) {
    try {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      });
    } catch (error) {
      throw new DatabaseMigrationError(migration.version, error);
    }
  }
}
