import {
  DatabaseMigrationError,
  DatabaseNewerError,
  runMigrations,
  type Migration,
} from "@/db/migrate";
import { MIGRATIONS } from "@/db/migrations";

import { createFakeDb } from "../../test-support/fake-sqlite";
import { RELEASED_SCHEMAS } from "../../test-support/released-schemas";

const version = async (db: any) =>
  (await db.getFirstAsync("PRAGMA user_version")).user_version as number;
/** Tables, indexes and their SQL from sqlite_master; whitespace is ignored, as it is only layout. */
const structure = async (db: any) =>
  (
    await db.getAllAsync(
      "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name",
    )
  ).map((r: any) => ({
    ...r,
    sql: String(r.sql)
      .replace(/\s+/g, " ")
      .replace(/\( /g, "(")
      .replace(/ \)/g, ")"),
  }));

/** A made-up step that creates a table named after its version. */
const createTable = (v: number, log?: number[]): Migration => ({
  version: v,
  up: async (db) => {
    log?.push(v);
    await db.execAsync(`CREATE TABLE t${v} (x INTEGER)`);
  },
});

describe("Updates never lose or break data (runner)", () => {
  it("Given an empty database, every step runs in order", async () => {
    const db = createFakeDb() as any;
    const log: number[] = [];
    await runMigrations(db, [
      createTable(1, log),
      createTable(2, log),
      createTable(3, log),
    ]);

    expect(log).toEqual([1, 2, 3]);
    expect(await version(db)).toBe(3);
  });

  it("Given a database at the latest version with data, nothing changes", async () => {
    const db = createFakeDb() as any;
    const steps = [createTable(1), createTable(2)];
    await runMigrations(db, steps);
    await db.runAsync("INSERT INTO t2 (x) VALUES (7)");
    const before = await structure(db);
    const log: number[] = [];

    await runMigrations(db, [createTable(1, log), createTable(2, log)]);

    expect(log).toEqual([]);
    expect(await structure(db)).toEqual(before);
    expect(await db.getAllAsync("SELECT x FROM t2")).toEqual([{ x: 7 }]);
    expect(await version(db)).toBe(2);
  });

  it("Given a database several versions behind with data, only missing steps run in order and data is kept", async () => {
    const db = createFakeDb() as any;
    await runMigrations(db, [createTable(1)]);
    await db.runAsync("INSERT INTO t1 (x) VALUES (41)");
    const log: number[] = [];

    await runMigrations(db, [
      createTable(1, log),
      createTable(2, log),
      {
        version: 3,
        up: async (d) => {
          log.push(3);
          await d.execAsync("ALTER TABLE t1 ADD COLUMN y INTEGER DEFAULT 5");
        },
      },
      createTable(4, log),
    ]);

    expect(log).toEqual([2, 3, 4]);
    expect(await db.getAllAsync("SELECT x, y FROM t1")).toEqual([
      { x: 41, y: 5 },
    ]);
    expect(await version(db)).toBe(4);
  });
});

describe("A failed update is explained and harmless (runner)", () => {
  const failing = (v: number): Migration => ({
    version: v,
    up: async (db) => {
      await db.execAsync(`CREATE TABLE half${v} (x INTEGER)`);
      await db.runAsync(`INSERT INTO half${v} (x) VALUES (1)`);
      await db.execAsync("THIS IS NOT SQL");
    },
  });

  it("A step that fails midway throws a migration error, leaves none of its changes and keeps the version", async () => {
    const db = createFakeDb() as any;
    await runMigrations(db, [createTable(1)]);
    const before = await structure(db);

    await expect(
      runMigrations(db, [createTable(1), failing(2)]),
    ).rejects.toBeInstanceOf(DatabaseMigrationError);

    expect(await structure(db)).toEqual(before);
    expect(await version(db)).toBe(1);
  });

  it("Two pending steps where the second fails keep the first step and its version", async () => {
    const db = createFakeDb() as any;

    await expect(
      runMigrations(db, [createTable(1), failing(2)]),
    ).rejects.toBeInstanceOf(DatabaseMigrationError);

    expect(await version(db)).toBe(1);
    const names = (await structure(db)).map((r: any) => r.name);
    expect(names).toContain("t1");
    expect(names).not.toContain("half2");
  });

  it("A step that fails with the data already in place keeps that data", async () => {
    const db = createFakeDb() as any;
    await runMigrations(db, [createTable(1)]);
    await db.runAsync("INSERT INTO t1 (x) VALUES (9)");

    await expect(
      runMigrations(db, [
        createTable(1),
        {
          version: 2,
          up: async (d) => {
            await d.execAsync("DELETE FROM t1");
            await d.execAsync("THIS IS NOT SQL");
          },
        },
      ]),
    ).rejects.toBeInstanceOf(DatabaseMigrationError);

    expect(await db.getAllAsync("SELECT x FROM t1")).toEqual([{ x: 9 }]);
  });

  it("A database saved by a newer version throws and writes nothing", async () => {
    const db = createFakeDb() as any;
    await db.execAsync(
      "CREATE TABLE keep (x INTEGER); INSERT INTO keep VALUES (3); PRAGMA user_version = 5",
    );
    const before = await structure(db);
    const log: number[] = [];

    await expect(
      runMigrations(db, [createTable(1, log), createTable(2, log)]),
    ).rejects.toBeInstanceOf(DatabaseNewerError);

    expect(log).toEqual([]);
    expect(await structure(db)).toEqual(before);
    expect(await version(db)).toBe(5);
    expect(await db.getAllAsync("SELECT x FROM keep")).toEqual([{ x: 3 }]);
  });
});

describe("Updates never lose or break data (real list)", () => {
  it("Given an empty database, the final structure is created and marked as version 1", async () => {
    const db = createFakeDb() as any;
    await runMigrations(db, MIGRATIONS);

    expect(await version(db)).toBe(1);
    const names = (await structure(db)).map((r: any) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "plan_version",
        "month_income_override",
        "expense",
      ]),
    );
  });

  it("Every migration version has a saved released structure", () => {
    for (const { version: v } of MIGRATIONS) {
      expect(RELEASED_SCHEMAS[v]).toBeDefined();
    }
  });

  it("The versions are numbered 1, 2, 3 with no gaps", () => {
    expect(MIGRATIONS.map((m) => m.version)).toEqual(
      MIGRATIONS.map((_, i) => i + 1),
    );
  });

  const sampleData = `
    INSERT INTO plan_version VALUES ('2026-07', 200000, 'eur', 100000, 'savings', 'pct', 30);
    INSERT INTO plan_version VALUES ('2026-09', 250000, 'pct', 40, 'leisure', 'eur', 5000);
    INSERT INTO month_income_override VALUES ('2026-11', 300000);
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-05', 'leisure', 1250, 'Cinema');
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-06', 'fixed', 90000, '');
  `;
  const dump = async (db: any) => [
    await db.getAllAsync("SELECT * FROM plan_version ORDER BY effective_month"),
    await db.getAllAsync("SELECT * FROM month_income_override ORDER BY month"),
    await db.getAllAsync("SELECT * FROM expense ORDER BY id"),
  ];

  it.each(Object.keys(RELEASED_SCHEMAS).map(Number))(
    "The structure saved for released version %i upgrades to the same structure as a new install and keeps its data",
    async (released) => {
      const old = createFakeDb() as any;
      await old.execAsync(RELEASED_SCHEMAS[released]);
      await old.execAsync(sampleData);
      await old.execAsync(`PRAGMA user_version = ${released}`);
      const dataBefore = await dump(old);

      await runMigrations(old, MIGRATIONS);

      const fresh = createFakeDb() as any;
      await runMigrations(fresh, MIGRATIONS);
      expect(await structure(old)).toEqual(await structure(fresh));
      expect(await version(old)).toBe(MIGRATIONS.length);
      expect(await dump(old)).toEqual(dataBefore);
      expect(dataBefore[2]).toHaveLength(2);
    },
  );
});
