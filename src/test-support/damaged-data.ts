/**
 * Simulates a database file damaged by other means (disk fault, manual edit): replaces each table
 * with a copy that has the same columns and rows but no STRICT typing and no CHECK rules, so tests
 * can store rows the real tables refuse. Run it after the app's migrations and before the bad rows.
 */
export const RELAX_TABLES: string[] = [
  `CREATE TABLE plan_version_loose (
     effective_month TEXT PRIMARY KEY NOT NULL, income_cents INTEGER NOT NULL, fixed_unit TEXT NOT NULL,
     fixed_value INTEGER NOT NULL, kept_bucket TEXT NOT NULL, kept_unit TEXT NOT NULL, kept_value INTEGER NOT NULL)`,
  "INSERT INTO plan_version_loose SELECT effective_month, income_cents, fixed_unit, fixed_value, kept_bucket, kept_unit, kept_value FROM plan_version",
  "DROP TABLE plan_version",
  "ALTER TABLE plan_version_loose RENAME TO plan_version",
  `CREATE TABLE month_income_override_loose (month TEXT PRIMARY KEY NOT NULL, income_cents INTEGER NOT NULL)`,
  "INSERT INTO month_income_override_loose SELECT month, income_cents FROM month_income_override",
  "DROP TABLE month_income_override",
  "ALTER TABLE month_income_override_loose RENAME TO month_income_override",
  `CREATE TABLE expense_loose (
     id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, bucket TEXT NOT NULL, amount_cents INTEGER NOT NULL,
     note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  "INSERT INTO expense_loose SELECT id, date, bucket, amount_cents, note, created_at FROM expense",
  "DROP TABLE expense",
  "ALTER TABLE expense_loose RENAME TO expense",
];
