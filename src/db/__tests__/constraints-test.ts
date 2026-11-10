import { runMigrations } from "@/db/migrate";
import { MIGRATIONS } from "@/db/migrations";

import { createFakeDb } from "../../test-support/fake-sqlite";

async function newDb() {
  const db = createFakeDb() as any;
  await runMigrations(db, MIGRATIONS);
  return db;
}

const plan = (month: string, pct: string) =>
  `INSERT INTO plan_version (effective_month, savings_pct) VALUES (${month}, ${pct})`;
const entry = (date: string, kind: string, cents: string) =>
  `INSERT INTO entry (date, kind, amount_cents, note) VALUES (${date}, ${kind}, ${cents}, 'x')`;

describe("The database rejects invalid data", () => {
  it.each([
    ["text percentage", plan("'2026-07'", "'many'")],
    ["decimal percentage", plan("'2026-07'", "12.5")],
    ["percentage above 100", plan("'2026-07'", "101")],
    ["negative percentage", plan("'2026-07'", "-1")],
    ["text amount", entry("'2026-11-05'", "'expense'", "'abc'")],
    ["decimal amount", entry("'2026-11-05'", "'expense'", "12.5")],
    ["zero amount", entry("'2026-11-05'", "'expense'", "0")],
    ["negative amount", entry("'2026-11-05'", "'expense'", "-100")],
  ])("A wrong money or percentage value is refused: %s", async (_name, sql) => {
    const db = await newDb();
    await expect(db.execAsync(sql)).rejects.toThrow();
  });

  it.each([
    ["plan month without a dash", plan("'202607'", "30")],
    ["plan month with letters", plan("'2026-ab'", "30")],
    ["plan month with a day", plan("'2026-07-01'", "30")],
    ["entry date without zero padding", entry("'2026-1-5'", "'expense'", "100")],
    ["entry date with a slash", entry("'2026/11/05'", "'expense'", "100")],
    ["entry date with only a month", entry("'2026-11'", "'expense'", "100")],
  ])("A badly formatted date or month is refused: %s", async (_name, sql) => {
    const db = await newDb();
    await expect(db.execAsync(sql)).rejects.toThrow();
  });

  it.each([
    ["fixed", "'fixed'"],
    ["leisure", "'leisure'"],
    ["unknown kind", "'food'"],
  ])("An entry of kind %s is refused: there are only income, savings and expense", async (_name, kind) => {
    const db = await newDb();
    await expect(db.execAsync(entry("'2026-11-05'", kind, "100"))).rejects.toThrow();
  });

  it("Refused values leave nothing stored", async () => {
    const db = await newDb();
    await expect(db.execAsync(plan("'2026-07'", "101"))).rejects.toThrow();
    expect(await db.getAllAsync("SELECT * FROM plan_version")).toEqual([]);
  });

  it("Valid data is accepted: 0 and 100 percent, the three kinds and amounts above 900 000,00 euros", async () => {
    const db = await newDb();
    await db.execAsync(plan("'2026-07'", "0"));
    await db.execAsync(plan("'2026-08'", "100"));
    await db.execAsync(plan("'2026-09'", "30"));
    await db.execAsync(entry("'2026-11-05'", "'expense'", "90000001"));
    await db.execAsync(entry("'2026-11-06'", "'savings'", "1"));
    await db.execAsync(entry("'2026-11-07'", "'income'", "200000"));

    expect(await db.getAllAsync("SELECT * FROM plan_version")).toHaveLength(3);
    expect(await db.getAllAsync("SELECT kind, amount_cents FROM entry ORDER BY id")).toEqual([
      { kind: "expense", amount_cents: 90000001 },
      { kind: "savings", amount_cents: 1 },
      { kind: "income", amount_cents: 200000 },
    ]);
  });

  it("All tables enforce column types and only the entry and plan tables exist", async () => {
    const db = await newDb();
    const tables = await db.getAllAsync(
      "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(tables.map((t: any) => t.name).sort()).toEqual(["entry", "plan_version"]);
    for (const t of tables) expect(t.sql).toMatch(/STRICT\s*$/i);
  });

  it("Tables and columns stay the same as today", async () => {
    const db = await newDb();
    const cols = async (t: string) => (await db.getAllAsync(`PRAGMA table_info(${t})`)).map((c: any) => c.name);
    expect(await cols("plan_version")).toEqual(["effective_month", "savings_pct"]);
    expect(await cols("entry")).toEqual(["id", "date", "kind", "amount_cents", "note", "created_at"]);
  });
});
