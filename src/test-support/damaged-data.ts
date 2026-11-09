/**
 * Simulates a database file damaged by other means (disk fault, manual edit): replaces each table
 * with a copy that has the same columns and rows but no STRICT typing and no CHECK rules, so tests
 * can store rows the real tables refuse. Run it after the app's migrations and before the bad rows.
 */
export const RELAX_TABLES: string[] = [
  `CREATE TABLE plan_version_loose (
     effective_month TEXT PRIMARY KEY NOT NULL,
     kept_bucket TEXT NOT NULL, kept_unit TEXT NOT NULL, kept_value INTEGER NOT NULL)`,
  "INSERT INTO plan_version_loose SELECT effective_month, kept_bucket, kept_unit, kept_value FROM plan_version",
  "DROP TABLE plan_version",
  "ALTER TABLE plan_version_loose RENAME TO plan_version",
  `CREATE TABLE fixed_item_loose (
     id INTEGER PRIMARY KEY AUTOINCREMENT, effective_month TEXT NOT NULL, name TEXT NOT NULL, amount_cents INTEGER NOT NULL)`,
  "INSERT INTO fixed_item_loose SELECT id, effective_month, name, amount_cents FROM fixed_item",
  "DROP TABLE fixed_item",
  "ALTER TABLE fixed_item_loose RENAME TO fixed_item",
  `CREATE TABLE expense_loose (
     id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, bucket TEXT NOT NULL, amount_cents INTEGER NOT NULL,
     note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  "INSERT INTO expense_loose SELECT id, date, bucket, amount_cents, note, created_at FROM expense",
  "DROP TABLE expense",
  "ALTER TABLE expense_loose RENAME TO expense",
];
