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
  4: `
    CREATE TABLE "expense" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      bucket TEXT NOT NULL CHECK (bucket IN ('expense', 'savings', 'income')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    ) STRICT;
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)
    ) STRICT;
  `,
  5: `
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)
    ) STRICT;
    CREATE TABLE entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    ) STRICT;
  `,
  6: `
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)
    ) STRICT;
    CREATE TABLE entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      category TEXT NOT NULL DEFAULT 'other' CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      )
    ) STRICT;
  `,
  7: `
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)
    ) STRICT;
    CREATE TABLE entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      category TEXT NOT NULL DEFAULT 'other' CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      ),
      recurring_id INTEGER REFERENCES recurring(id)
    ) STRICT;
    CREATE TABLE recurring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      category TEXT NOT NULL CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      ),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      last_month TEXT NOT NULL CHECK (last_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]')
    ) STRICT;
  `,
  8: `
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)
    ) STRICT;
    CREATE TABLE entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      category TEXT NOT NULL DEFAULT 'other' CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      ),
      recurring_id INTEGER REFERENCES recurring(id)
    ) STRICT;
    CREATE TABLE recurring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      category TEXT NOT NULL CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      ),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      last_month TEXT NOT NULL CHECK (last_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]')
    ) STRICT;
    CREATE TABLE setting (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    ) STRICT;
  `,
  9: `
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)
    ) STRICT;
    CREATE TABLE entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      category TEXT NOT NULL DEFAULT 'other' CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      ),
      recurring_id INTEGER REFERENCES recurring(id),
      pocket_id INTEGER REFERENCES pocket(id)
    ) STRICT;
    CREATE TABLE recurring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      category TEXT NOT NULL CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      ),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      last_month TEXT NOT NULL CHECK (last_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      pocket_id INTEGER REFERENCES pocket(id)
    ) STRICT;
    CREATE TABLE setting (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    ) STRICT;
    CREATE TABLE pocket (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
      starting_cents INTEGER NOT NULL DEFAULT 0 CHECK (starting_cents >= 0)
    ) STRICT;
  `,
  10: `
    CREATE TABLE "plan_version" (
      effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)
    ) STRICT;
    CREATE TABLE entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      category TEXT NOT NULL DEFAULT 'other' CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      ),
      recurring_id INTEGER REFERENCES recurring(id),
      pocket_id INTEGER REFERENCES pocket(id)
    ) STRICT;
    CREATE TABLE recurring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
      category TEXT NOT NULL CHECK (
        (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
        OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
        OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
      ),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      last_month TEXT NOT NULL CHECK (last_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
      pocket_id INTEGER REFERENCES pocket(id)
    ) STRICT;
    CREATE TABLE setting (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    ) STRICT;
    CREATE TABLE pocket (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
      starting_cents INTEGER NOT NULL DEFAULT 0 CHECK (starting_cents >= 0),
      emoji TEXT NOT NULL DEFAULT '' CHECK (length(emoji) <= 8),
      color TEXT NOT NULL DEFAULT 'blue'
        CHECK (color IN ('blue', 'indigo', 'purple', 'pink', 'orange', 'amber', 'green', 'slate'))
    ) STRICT;
  `,
};
