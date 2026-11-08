import { runMigrations } from "@/db/migrate";
import { MIGRATIONS } from "@/db/migrations";

import { createFakeDb } from "../../test-support/fake-sqlite";

async function newDb() {
  const db = createFakeDb() as any;
  await runMigrations(db, MIGRATIONS);
  return db;
}

const plan = (over: Record<string, string> = {}) => {
  const v = {
    month: "'2026-07'",
    income: "200000",
    fu: "'eur'",
    fv: "100000",
    kb: "'savings'",
    ku: "'pct'",
    kv: "30",
    ...over,
  };
  return `INSERT INTO plan_version (effective_month, income_cents, fixed_unit, fixed_value, kept_bucket, kept_unit, kept_value) VALUES (${v.month}, ${v.income}, ${v.fu}, ${v.fv}, ${v.kb}, ${v.ku}, ${v.kv})`;
};
const override = (month: string, cents: string) =>
  `INSERT INTO month_income_override (month, income_cents) VALUES (${month}, ${cents})`;
const expense = (date: string, bucket: string, cents: string) =>
  `INSERT INTO expense (date, bucket, amount_cents, note) VALUES (${date}, ${bucket}, ${cents}, 'x')`;

describe("The database rejects invalid data", () => {
  it.each([
    ["text income in a plan", plan({ income: "'abc'" })],
    ["decimal income in a plan", plan({ income: "2000.5" })],
    ["decimal fixed value", plan({ fv: "10.5" })],
    ["text kept value", plan({ kv: "'many'" })],
    ["decimal percentage", plan({ fu: "'pct'", fv: "12.5" })],
    ["text income override", override("'2026-11'", "'abc'")],
    ["decimal income override", override("'2026-11'", "1000.5")],
    ["text expense amount", expense("'2026-11-05'", "'leisure'", "'abc'")],
    ["decimal expense amount", expense("'2026-11-05'", "'leisure'", "12.5")],
  ])(
    "Text or a decimal in a money or percentage column is refused: %s",
    async (_name, sql) => {
      const db = await newDb();
      await expect(db.execAsync(sql)).rejects.toThrow();
    },
  );

  it.each([
    ["plan month without a dash", plan({ month: "'202607'" })],
    ["plan month with letters", plan({ month: "'2026-ab'" })],
    ["plan month with a day", plan({ month: "'2026-07-01'" })],
    ["override month with letters", override("'abcd-ef'", "1000")],
    ["override month with one digit", override("'2026-7'", "1000")],
    [
      "expense date without zero padding",
      expense("'2026-1-5'", "'leisure'", "100"),
    ],
    ["expense date with a slash", expense("'2026/11/05'", "'leisure'", "100")],
    [
      "expense date with only a month",
      expense("'2026-11'", "'leisure'", "100"),
    ],
  ])("A badly formatted date or month is refused: %s", async (_name, sql) => {
    const db = await newDb();
    await expect(db.execAsync(sql)).rejects.toThrow();
  });

  it.each([
    ["zero plan income", plan({ income: "0" })],
    ["negative plan income", plan({ income: "-1" })],
    ["zero override income", override("'2026-11'", "0")],
    ["negative override income", override("'2026-11'", "-500")],
    ["fixed percentage above 100", plan({ fu: "'pct'", fv: "101" })],
    ["kept percentage above 100", plan({ ku: "'pct'", kv: "101" })],
    ["negative fixed value", plan({ fv: "-1" })],
    ["negative kept value", plan({ kv: "-1" })],
    ["zero expense", expense("'2026-11-05'", "'leisure'", "0")],
    ["negative expense", expense("'2026-11-05'", "'leisure'", "-100")],
    ["unknown unit", plan({ fu: "'weeks'" })],
    ["unknown kept bucket", plan({ kb: "'fixed'" })],
    ["unknown expense bucket", expense("'2026-11-05'", "'food'", "100")],
  ])(
    "A zero or negative amount, a percentage above 100 or an unknown value is refused: %s",
    async (_name, sql) => {
      const db = await newDb();
      await expect(db.execAsync(sql)).rejects.toThrow();
    },
  );

  it("Refused values leave nothing stored", async () => {
    const db = await newDb();
    await expect(db.execAsync(plan({ income: "0" }))).rejects.toThrow();
    expect(await db.getAllAsync("SELECT * FROM plan_version")).toEqual([]);
  });

  it("Valid data is accepted, including 100 percent, zero values and amounts above 900 000,00 euros", async () => {
    const db = await newDb();
    await db.execAsync(plan());
    await db.execAsync(
      plan({
        month: "'2026-08'",
        fu: "'pct'",
        fv: "100",
        ku: "'pct'",
        kv: "0",
      }),
    );
    await db.execAsync(
      plan({ month: "'2026-09'", income: "90000001", fv: "90000001" }),
    );
    await db.execAsync(override("'2026-11'", "90000001"));
    await db.execAsync(expense("'2026-11-05'", "'fixed'", "90000001"));
    await db.execAsync(expense("'2026-11-06'", "'savings'", "1"));

    expect(await db.getAllAsync("SELECT * FROM plan_version")).toHaveLength(3);
    expect(
      await db.getAllAsync("SELECT amount_cents FROM expense ORDER BY id"),
    ).toEqual([{ amount_cents: 90000001 }, { amount_cents: 1 }]);
    expect(
      await db.getAllAsync("SELECT income_cents FROM month_income_override"),
    ).toEqual([{ income_cents: 90000001 }]);
  });

  it("All tables enforce column types", async () => {
    const db = await newDb();
    const tables = await db.getAllAsync(
      "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(tables.map((t: any) => t.name).sort()).toEqual([
      "expense",
      "month_income_override",
      "plan_version",
    ]);
    for (const t of tables) expect(t.sql).toMatch(/STRICT\s*$/i);
  });

  it("Tables and columns stay the same as today", async () => {
    const db = await newDb();
    const cols = async (t: string) =>
      (await db.getAllAsync(`PRAGMA table_info(${t})`)).map((c: any) => c.name);
    expect(await cols("plan_version")).toEqual([
      "effective_month",
      "income_cents",
      "fixed_unit",
      "fixed_value",
      "kept_bucket",
      "kept_unit",
      "kept_value",
    ]);
    expect(await cols("month_income_override")).toEqual([
      "month",
      "income_cents",
    ]);
    expect(await cols("expense")).toEqual([
      "id",
      "date",
      "bucket",
      "amount_cents",
      "note",
      "created_at",
    ]);
  });
});
