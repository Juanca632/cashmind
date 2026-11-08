/* Test double for expo-sqlite, backed by Node's built-in SQLite so the real SQL of the app runs. */
import { DatabaseSync } from 'node:sqlite';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Params = unknown[];

function normalize(params: Params): any[] {
  if (params.length === 1 && Array.isArray(params[0])) return params[0] as any[];
  return params as any[];
}

export function createFakeDb() {
  const sqlite = new DatabaseSync(':memory:');
  const db = {
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },
    async runAsync(sql: string, ...params: Params) {
      const result = sqlite.prepare(sql).run(...normalize(params));
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    async getAllAsync(sql: string, ...params: Params) {
      return sqlite.prepare(sql).all(...normalize(params)).map((row) => ({ ...row }));
    },
    async getFirstAsync(sql: string, ...params: Params) {
      const row = sqlite.prepare(sql).get(...normalize(params));
      return row ? { ...row } : null;
    },
    async withTransactionAsync(task: () => Promise<void>) {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    async withExclusiveTransactionAsync(task: (txn: unknown) => Promise<void>) {
      return db.withTransactionAsync(() => task(db));
    },
    close() {
      sqlite.close();
    },
  };
  return db;
}

type FakeDb = ReturnType<typeof createFakeDb>;

let current: FakeDb | null = null;
let initialized = false;
const DbContext = createContext<FakeDb | null>(null);

/** Starts every test with an empty device. */
export function resetDevice() {
  current?.close();
  current = createFakeDb();
  initialized = false;
}

/** Same as SQLiteProvider but the database survives unmount/mount, like a file on the device. */
function SQLiteProvider({ children, onInit }: { children: React.ReactNode; onInit?: (db: any) => Promise<void> }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (!current) resetDevice();
    (async () => {
      try {
        if (!initialized) {
          initialized = true;
          await onInit?.(current);
        }
        setReady(true);
      } catch (e) {
        setError(e as Error);
      }
    })();
  }, [onInit]);
  // Like the real provider, initialization errors surface during render.
  if (error) throw error;
  if (!ready || !current) return null;
  return <DbContext.Provider value={current}>{children}</DbContext.Provider>;
}

function useSQLiteContext() {
  const db = useContext(DbContext);
  if (!db) throw new Error('No database');
  return db;
}

export const expoSqliteMock = { SQLiteProvider, useSQLiteContext };

/** Gives tests direct access to the device database to prepare data before the app starts. */
export async function seedDevice(task: (db: any) => Promise<void>) {
  if (!current) resetDevice();
  await task(current);
}
