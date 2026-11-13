import type { Migration } from '@/db/migrate';

/**
 * Every database change, in order. A step that has been released is never edited: a new change
 * is always a new step, added here together with its structure in
 * src/test-support/released-schemas.ts and a test that upgrades sample data.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    up: (db) =>
      db.execAsync(`
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
      `),
  },
  {
    // Fixed expenses become a list of items per plan version; their sum replaces the fixed amount.
    version: 2,
    up: (db) =>
      db.execAsync(`
        CREATE TABLE fixed_item (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          effective_month TEXT NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
          name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0)
        ) STRICT;
        INSERT INTO fixed_item (effective_month, name, amount_cents)
          SELECT effective_month, 'Fixed expenses',
                 CASE fixed_unit WHEN 'eur' THEN fixed_value ELSE income_cents * fixed_value / 100 END
          FROM plan_version
          WHERE CASE fixed_unit WHEN 'eur' THEN fixed_value ELSE income_cents * fixed_value / 100 END > 0
          ORDER BY effective_month;
        CREATE TABLE plan_version_new (
          effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
          income_cents INTEGER NOT NULL CHECK (income_cents > 0),
          kept_bucket TEXT NOT NULL CHECK (kept_bucket IN ('leisure', 'savings')),
          kept_unit TEXT NOT NULL CHECK (kept_unit IN ('eur', 'pct')),
          kept_value INTEGER NOT NULL CHECK (kept_value >= 0 AND (kept_unit = 'eur' OR kept_value <= 100))
        ) STRICT;
        INSERT INTO plan_version_new (effective_month, income_cents, kept_bucket, kept_unit, kept_value)
          SELECT effective_month, income_cents, kept_bucket, kept_unit, kept_value FROM plan_version;
        DROP TABLE plan_version;
        ALTER TABLE plan_version_new RENAME TO plan_version;
      `),
  },
  {
    // Income becomes recorded entries: each month gets the income it had, and the plan stops storing one.
    version: 3,
    up: async (db) => {
      const versions = await db.getAllAsync<{ effective_month: string; income_cents: number }>(
        'SELECT effective_month, income_cents FROM plan_version ORDER BY effective_month',
      );
      const overrides = await db.getAllAsync<{ month: string; income_cents: number }>(
        'SELECT month, income_cents FROM month_income_override',
      );

      await db.execAsync(`
        CREATE TABLE expense_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
          bucket TEXT NOT NULL CHECK (bucket IN ('fixed', 'leisure', 'savings', 'income')),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        ) STRICT;
        INSERT INTO expense_new (id, date, bucket, amount_cents, note, created_at)
          SELECT id, date, bucket, amount_cents, note, created_at FROM expense;
        DROP TABLE expense;
        ALTER TABLE expense_new RENAME TO expense;
      `);

      const pad = (n: number) => String(n).padStart(2, '0');
      const now = new Date();
      const lastMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

      if (versions.length > 0) {
        const overrideOf = new Map(overrides.map((row) => [row.month, row.income_cents]));
        let [year, monthNumber] = versions[0].effective_month.split('-').map(Number);
        for (;;) {
          const month = `${year}-${pad(monthNumber)}`;
          if (month > lastMonth) break;
          const planned = versions.filter((version) => version.effective_month <= month).at(-1);
          const income = overrideOf.get(month) ?? planned?.income_cents;
          if (income !== undefined) {
            await db.runAsync(
              "INSERT INTO expense (date, bucket, amount_cents, note) VALUES (?, 'income', ?, 'Monthly income')",
              `${month}-01`,
              income,
            );
          }
          monthNumber += 1;
          if (monthNumber > 12) {
            monthNumber = 1;
            year += 1;
          }
        }
      }

      // An override outside the months above is still the user's data: keep it as an entry too.
      const firstMonth = versions[0]?.effective_month;
      for (const { month, income_cents: cents } of overrides) {
        if (firstMonth === undefined || month < firstMonth || month > lastMonth) {
          await db.runAsync(
            "INSERT INTO expense (date, bucket, amount_cents, note) VALUES (?, 'income', ?, 'Monthly income')",
            `${month}-01`,
            cents,
          );
        }
      }

      await db.execAsync(`
        CREATE TABLE plan_version_new (
          effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
          kept_bucket TEXT NOT NULL CHECK (kept_bucket IN ('leisure', 'savings')),
          kept_unit TEXT NOT NULL CHECK (kept_unit IN ('eur', 'pct')),
          kept_value INTEGER NOT NULL CHECK (kept_value >= 0 AND (kept_unit = 'eur' OR kept_value <= 100))
        ) STRICT;
        INSERT INTO plan_version_new (effective_month, kept_bucket, kept_unit, kept_value)
          SELECT effective_month, kept_bucket, kept_unit, kept_value FROM plan_version;
        DROP TABLE plan_version;
        ALTER TABLE plan_version_new RENAME TO plan_version;
        DROP TABLE month_income_override;
      `);
    },
  },
  {
    // The plan becomes one savings percentage. Fixed and leisure entries become expenses; the fixed
    // expenses list is removed with its feature (agreed before v1.0.0, see specs/008-simple-plan).
    version: 4,
    up: (db) =>
      db.execAsync(`
        CREATE TABLE expense_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
          bucket TEXT NOT NULL CHECK (bucket IN ('expense', 'savings', 'income')),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        ) STRICT;
        INSERT INTO expense_new (id, date, bucket, amount_cents, note, created_at)
          SELECT id, date, CASE WHEN bucket IN ('fixed', 'leisure') THEN 'expense' ELSE bucket END,
                 amount_cents, note, created_at
          FROM expense;
        DROP TABLE expense;
        ALTER TABLE expense_new RENAME TO expense;
        CREATE TABLE plan_version_new (
          effective_month TEXT PRIMARY KEY NOT NULL CHECK (effective_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
          savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)
        ) STRICT;
        INSERT INTO plan_version_new (effective_month, savings_pct)
          SELECT effective_month,
                 CASE WHEN kept_bucket = 'savings' AND kept_unit = 'pct' THEN kept_value ELSE 20 END
          FROM plan_version;
        DROP TABLE plan_version;
        ALTER TABLE plan_version_new RENAME TO plan_version;
        DROP TABLE fixed_item;
      `),
  },
  {
    // Renames expense to entry and bucket to kind: since step 4 the table holds every kind of entry.
    version: 5,
    up: (db) =>
      db.execAsync(`
        CREATE TABLE entry (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
          kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        ) STRICT;
        INSERT INTO entry (id, date, kind, amount_cents, note, created_at)
          SELECT id, date, bucket, amount_cents, note, created_at FROM expense;
        DROP TABLE expense;
      `),
  },
  {
    // Every entry gets a category from its kind's fixed list (specs/015-categories). Existing entries
    // become 'other'; no row is changed in any other way.
    version: 6,
    up: (db) =>
      db.execAsync(`
        ALTER TABLE entry ADD COLUMN category TEXT NOT NULL DEFAULT 'other' CHECK (
          (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
          OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
          OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
        );
      `),
  },
];
