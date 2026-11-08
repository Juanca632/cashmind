// Minimal typing for Node's built-in SQLite, used by the expo-sqlite test double (no @types/node in the project).
declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    close(): void;
    prepare(sql: string): {
      run(...params: any[]): { changes: number | bigint; lastInsertRowid: number | bigint };
      all(...params: any[]): Record<string, unknown>[];
      get(...params: any[]): Record<string, unknown> | undefined;
    };
  }
}
