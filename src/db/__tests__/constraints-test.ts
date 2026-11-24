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

  const categorized = (kind: string, category: string) =>
    `INSERT INTO entry (date, kind, amount_cents, note, category) VALUES ('2026-11-05', '${kind}', 100, 'x', '${category}')`;

  it.each([
    ["an unknown category", "expense", "food"],
    ["an empty category", "expense", ""],
    ["an income category on an expense", "expense", "salary"],
    ["an expense category on income", "income", "groceries"],
    ["a savings category on income", "income", "goal"],
    ["an expense category on savings", "savings", "housing"],
    ["a display label instead of the key", "expense", "Eating out"],
  ])("A category that does not belong to the kind is refused: %s", async (_name, kind, category) => {
    const db = await newDb();
    await expect(db.execAsync(categorized(kind, category))).rejects.toThrow();
    expect(await db.getAllAsync("SELECT * FROM entry")).toEqual([]);
  });

  it("Every category of every kind is accepted", async () => {
    const db = await newDb();
    const lists: Record<string, string[]> = {
      expense: ["housing", "groceries", "transport", "eating_out", "leisure", "health", "subscriptions", "other"],
      income: ["salary", "freelance", "benefits", "gifts", "other"],
      savings: ["emergency_fund", "investments", "travel", "goal", "other"],
    };
    for (const [kind, categories] of Object.entries(lists)) {
      for (const category of categories) await db.execAsync(categorized(kind, category));
    }
    expect(await db.getAllAsync("SELECT * FROM entry")).toHaveLength(18);
  });

  it("An entry written without a category is stored in Other", async () => {
    const db = await newDb();
    await db.execAsync(entry("'2026-11-05'", "'income'", "100"));
    expect(await db.getAllAsync("SELECT category FROM entry")).toEqual([{ category: "other" }]);
  });

  it("A category cannot be changed to one of another kind or to nothing", async () => {
    const db = await newDb();
    await db.execAsync(categorized("expense", "groceries"));
    await expect(db.execAsync("UPDATE entry SET category = 'salary'")).rejects.toThrow();
    await expect(db.execAsync("UPDATE entry SET category = NULL")).rejects.toThrow();
    expect(await db.getAllAsync("SELECT category FROM entry")).toEqual([{ category: "groceries" }]);
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

  it("All tables enforce column types and only the entry, plan, recurring and setting tables exist", async () => {
    const db = await newDb();
    const tables = await db.getAllAsync(
      "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(tables.map((t: any) => t.name).sort()).toEqual(["entry", "plan_version", "recurring", "setting"]);
    for (const t of tables) expect(t.sql).toMatch(/STRICT\s*$/i);
  });

  it("Tables and columns stay the same as today", async () => {
    const db = await newDb();
    const cols = async (t: string) => (await db.getAllAsync(`PRAGMA table_info(${t})`)).map((c: any) => c.name);
    expect(await cols("plan_version")).toEqual(["effective_month", "savings_pct"]);
    expect(await cols("entry")).toEqual(["id", "date", "kind", "amount_cents", "note", "created_at", "category", "recurring_id"]);
    expect(await cols("recurring")).toEqual(["id", "kind", "category", "amount_cents", "note", "active", "last_month"]);
  });
});

describe("The database rejects invalid recurring items", () => {
  const item = (over: Partial<Record<string, string>> = {}) => {
    const v = { kind: "'expense'", category: "'housing'", amount: "90000", active: "1", month: "'2026-11'", ...over };
    return `INSERT INTO recurring (kind, category, amount_cents, note, active, last_month) VALUES (${v.kind}, ${v.category}, ${v.amount}, 'Rent', ${v.active}, ${v.month})`;
  };

  it("A valid item is accepted, active by default, with no note by default", async () => {
    const db = await newDb();
    await db.execAsync(item());
    await db.execAsync("INSERT INTO recurring (kind, category, amount_cents, last_month) VALUES ('income', 'salary', 100, '2026-11')");
    expect(await db.getAllAsync("SELECT kind, category, amount_cents, note, active, last_month FROM recurring ORDER BY id")).toEqual([
      { kind: "expense", category: "housing", amount_cents: 90000, note: "Rent", active: 1, last_month: "2026-11" },
      { kind: "income", category: "salary", amount_cents: 100, note: "", active: 1, last_month: "2026-11" },
    ]);
  });

  it.each([
    ["zero amount", { amount: "0" }],
    ["negative amount", { amount: "-5" }],
    ["decimal amount", { amount: "12.5" }],
    ["text amount", { amount: "'abc'" }],
    ["an income category on an expense", { category: "'salary'" }],
    ["an unknown category", { category: "'food'" }],
    ["an expense category on income", { kind: "'income'", category: "'housing'" }],
    ["a savings category on income", { kind: "'income'", category: "'goal'" }],
    ["an expense category on savings", { kind: "'savings'", category: "'housing'" }],
    ["an unknown kind", { kind: "'fixed'" }],
    ["active 2", { active: "2" }],
    ["active -1", { active: "-1" }],
    ["a month without a dash", { month: "'202611'" }],
    ["a month with letters", { month: "'2026-ab'" }],
    ["a month with a day", { month: "'2026-11-01'" }],
  ])("Refused: %s", async (_name, over) => {
    const db = await newDb();
    await expect(db.execAsync(item(over))).rejects.toThrow();
    expect(await db.getAllAsync("SELECT * FROM recurring")).toEqual([]);
  });

  it("A category cannot be changed to one of another kind", async () => {
    const db = await newDb();
    await db.execAsync(item());
    await expect(db.execAsync("UPDATE recurring SET category = 'salary'")).rejects.toThrow();
  });

  it("An entry can link to an item and a link to a missing item is refused", async () => {
    const db = await newDb();
    await db.execAsync(item());
    await db.execAsync("INSERT INTO entry (date, kind, amount_cents, recurring_id) VALUES ('2026-11-01', 'expense', 100, 1)");
    expect(await db.getAllAsync("SELECT recurring_id FROM entry")).toEqual([{ recurring_id: 1 }]);
    await expect(
      db.execAsync("INSERT INTO entry (date, kind, amount_cents, recurring_id) VALUES ('2026-11-01', 'expense', 100, 99)"),
    ).rejects.toThrow();
  });
});
