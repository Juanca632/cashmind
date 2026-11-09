/**
 * The database structure of each released version, exactly as it exists on a phone. Tests rebuild
 * these to prove that upgrades work. Add one entry per released version and never edit an entry.
 */
export const RELEASED_SCHEMAS: Record<number, string> = {
  1: `
    CREATE TABLE plan_version (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      income_cents INTEGER NOT NULL CHECK (income_cents > 0),
      fixed_unit TEXT NOT NULL CHECK (fixed_unit IN ('eur', 'pct')),
      fixed_value INTEGER NOT NULL CHECK (fixed_value >= 0 AND (fixed_unit = 'eur' OR fixed_value <= 100)),
      kept_bucket TEXT NOT NULL CHECK (kept_bucket IN ('leisure', 'savings')),
      kept_unit TEXT NOT NULL CHECK (kept_unit IN ('eur', 'pct')),
      kept_value INTEGER NOT NULL CHECK (kept_value >= 0 AND (kept_unit = 'eur' OR kept_value <= 100))
    ) STRICT;
    CREATE TABLE month_income_override (
      month TEXT PRIMARY KEY NOT NULL CHECK (month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      income_cents INTEGER NOT NULL CHECK (income_cents > 0)
    ) STRICT;
    CREATE TABLE expense (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      bucket TEXT NOT NULL CHECK (bucket IN ('fixed', 'leisure', 'savings')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    ) STRICT;
  `,
  2: `
    CREATE TABLE month_income_override (
      month TEXT PRIMARY KEY NOT NULL CHECK (month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      income_cents INTEGER NOT NULL CHECK (income_cents > 0)
    ) STRICT;
    CREATE TABLE expense (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      bucket TEXT NOT NULL CHECK (bucket IN ('fixed', 'leisure', 'savings')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    ) STRICT;
    CREATE TABLE fixed_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      effective_month TEXT NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0)
    ) STRICT;
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      income_cents INTEGER NOT NULL CHECK (income_cents > 0),
      kept_bucket TEXT NOT NULL CHECK (kept_bucket IN ('leisure', 'savings')),
      kept_unit TEXT NOT NULL CHECK (kept_unit IN ('eur', 'pct')),
      kept_value INTEGER NOT NULL CHECK (kept_value >= 0 AND (kept_unit = 'eur' OR kept_value <= 100))
    ) STRICT;
  `,
  3: `
    CREATE TABLE fixed_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      effective_month TEXT NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0)
    ) STRICT;
    CREATE TABLE "expense" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      bucket TEXT NOT NULL CHECK (bucket IN ('fixed', 'leisure', 'savings', 'income')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    ) STRICT;
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      kept_bucket TEXT NOT NULL CHECK (kept_bucket IN ('leisure', 'savings')),
      kept_unit TEXT NOT NULL CHECK (kept_unit IN ('eur', 'pct')),
      kept_value INTEGER NOT NULL CHECK (kept_value >= 0 AND (kept_unit = 'eur' OR kept_value <= 100))
    ) STRICT;
  `,
};
