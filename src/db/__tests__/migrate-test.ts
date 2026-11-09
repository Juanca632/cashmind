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
  it("Given an empty database, the final structure is created and marked as the latest version", async () => {
    const db = createFakeDb() as any;
    await runMigrations(db, MIGRATIONS);

    expect(await version(db)).toBe(MIGRATIONS.length);
    const names = (await structure(db)).map((r: any) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "plan_version",
        "expense",
        "fixed_item",
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

  const entries = `
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-05', 'leisure', 1250, 'Cinema');
    INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-11-06', 'fixed', 90000, '');
  `;
  const sampleData: Record<number, string> = {
    1: `
      INSERT INTO plan_version VALUES ('2026-07', 200000, 'eur', 100000, 'savings', 'pct', 30);
      INSERT INTO plan_version VALUES ('2026-09', 250000, 'pct', 40, 'leisure', 'eur', 5000);
      INSERT INTO month_income_override VALUES ('2026-11', 300000);
      ${entries}
    `,
    2: `
      INSERT INTO plan_version VALUES ('2026-07', 200000, 'savings', 'pct', 30);
      INSERT INTO plan_version VALUES ('2026-09', 250000, 'leisure', 'eur', 5000);
      INSERT INTO fixed_item (effective_month, name, amount_cents) VALUES ('2026-07', 'House', 100000);
      INSERT INTO month_income_override VALUES ('2026-11', 300000);
      ${entries}
    `,
    3: `
      INSERT INTO plan_version VALUES ('2026-07', 'savings', 'pct', 30);
      INSERT INTO plan_version VALUES ('2026-09', 'leisure', 'eur', 5000);
      INSERT INTO fixed_item (effective_month, name, amount_cents) VALUES ('2026-07', 'House', 100000);
      ${entries}
    `,
  };
  const dump = async (db: any) => [
    await db.getAllAsync(
      "SELECT effective_month, kept_bucket, kept_unit, kept_value FROM plan_version ORDER BY effective_month",
    ),
    await db.getAllAsync("SELECT * FROM expense WHERE bucket <> 'income' ORDER BY id"),
  ];

  it.each(Object.keys(RELEASED_SCHEMAS).map(Number))(
    "The structure saved for released version %i upgrades to the same structure as a new install and keeps its data",
    async (released) => {
      const old = createFakeDb() as any;
      await old.execAsync(RELEASED_SCHEMAS[released]);
      await old.execAsync(sampleData[released]);
      await old.execAsync(`PRAGMA user_version = ${released}`);
      const dataBefore = await dump(old);

      await runMigrations(old, MIGRATIONS);

      const fresh = createFakeDb() as any;
      await runMigrations(fresh, MIGRATIONS);
      expect(await structure(old)).toEqual(await structure(fresh));
      expect(await version(old)).toBe(MIGRATIONS.length);
      expect(await dump(old)).toEqual(dataBefore);
      expect(dataBefore[1]).toHaveLength(2);
    },
  );

  describe("Existing data is kept", () => {
    const upgradeFromV1 = async (data: string) => {
      const db = createFakeDb() as any;
      await db.execAsync(RELEASED_SCHEMAS[1]);
      await db.execAsync(data);
      await db.execAsync("PRAGMA user_version = 1");
      await runMigrations(db, MIGRATIONS);
      return db;
    };
    const items = (db: any) =>
      db.getAllAsync("SELECT effective_month, name, amount_cents FROM fixed_item ORDER BY id");
    const planRow = (month: string, income: number, unit: string, value: number) =>
      `INSERT INTO plan_version VALUES ('${month}', ${income}, '${unit}', ${value}, 'savings', 'pct', 20);`;

    it("Amount becomes one item", async () => {
      const db = await upgradeFromV1(planRow("2026-07", 200000, "eur", 100000));
      expect(await items(db)).toEqual([
        { effective_month: "2026-07", name: "Fixed expenses", amount_cents: 100000 },
      ]);
    });

    it("Percentage becomes euros", async () => {
      const db = await upgradeFromV1(planRow("2026-07", 200000, "pct", 40));
      expect(await items(db)).toEqual([
        { effective_month: "2026-07", name: "Fixed expenses", amount_cents: 80000 },
      ]);
    });

    it("A percentage rounds down to the cent, as before", async () => {
      const db = await upgradeFromV1(planRow("2026-07", 100001, "pct", 50));
      expect((await items(db))[0].amount_cents).toBe(50000);
    });

    it("Every past plan keeps its total", async () => {
      const db = await upgradeFromV1(
        planRow("2026-07", 200000, "eur", 100000) + planRow("2026-09", 250000, "pct", 40),
      );
      expect((await items(db)).map((i: any) => [i.effective_month, i.amount_cents])).toEqual([
        ["2026-07", 100000],
        ["2026-09", 100000],
      ]);
      expect(await db.getAllAsync("SELECT * FROM plan_version")).toHaveLength(2);
    });

    it("A plan with no fixed expenses gets an empty list", async () => {
      const db = await upgradeFromV1(planRow("2026-07", 200000, "eur", 0));
      expect(await items(db)).toEqual([]);
      expect(await db.getAllAsync("SELECT * FROM plan_version")).toHaveLength(1);
    });

    describe("Income becomes recorded entries", () => {
      beforeEach(() => {
        jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate", "queueMicrotask"] });
        jest.setSystemTime(new Date(2026, 10, 9, 12));
      });
      afterEach(() => jest.useRealTimers());

      const incomes = (db: any) =>
        db.getAllAsync("SELECT date, amount_cents, note FROM expense WHERE bucket = 'income' ORDER BY date");
      const amounts = async (db: any) => (await incomes(db)).map((row: any) => [row.date, row.amount_cents]);

      it("Plan income becomes entries", async () => {
        const db = await upgradeFromV1(planRow("2026-07", 200000, "eur", 100000));
        expect(await amounts(db)).toEqual([
          ["2026-07-01", 200000],
          ["2026-08-01", 200000],
          ["2026-09-01", 200000],
          ["2026-10-01", 200000],
          ["2026-11-01", 200000],
        ]);
        expect((await incomes(db))[0].note).toBe("Monthly income");
      });

      it("One-month income", async () => {
        const db = await upgradeFromV1(
          planRow("2026-09", 200000, "eur", 100000) + "INSERT INTO month_income_override VALUES ('2026-09', 300000);",
        );
        expect((await amounts(db))[0]).toEqual(["2026-09-01", 300000]);
        expect((await amounts(db))[1]).toEqual(["2026-10-01", 200000]);
      });

      it("Plan change", async () => {
        const db = await upgradeFromV1(planRow("2026-07", 200000, "eur", 100000) + planRow("2026-10", 240000, "eur", 100000));
        const rows = await amounts(db);
        expect(rows[2]).toEqual(["2026-09-01", 200000]);
        expect(rows[3]).toEqual(["2026-10-01", 240000]);
      });

      it("Crossing a year", async () => {
        jest.setSystemTime(new Date(2027, 0, 15, 12));
        const db = await upgradeFromV1(planRow("2026-12", 200000, "eur", 100000));
        expect(await amounts(db)).toEqual([
          ["2026-12-01", 200000],
          ["2027-01-01", 200000],
        ]);
      });

      it("An override outside the plan's months is kept", async () => {
        const db = await upgradeFromV1(
          planRow("2026-09", 200000, "eur", 100000) + "INSERT INTO month_income_override VALUES ('2026-05', 150000);",
        );
        expect((await amounts(db))[0]).toEqual(["2026-05-01", 150000]);
      });

      it("No plan, no income", async () => {
        const db = await upgradeFromV1("");
        expect(await incomes(db)).toEqual([]);
      });

      it("Everything else is unchanged and the override table is gone", async () => {
        const db = await upgradeFromV1(
          planRow("2026-07", 200000, "pct", 40) +
            "INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-07-05', 'leisure', 1250, 'Cinema');",
        );
        expect(await db.getAllAsync("SELECT effective_month, kept_bucket, kept_unit, kept_value FROM plan_version")).toEqual([
          { effective_month: "2026-07", kept_bucket: "savings", kept_unit: "pct", kept_value: 20 },
        ]);
        expect(await db.getAllAsync("SELECT note FROM expense WHERE bucket = 'leisure'")).toEqual([{ note: "Cinema" }]);
        expect(await db.getAllAsync("SELECT name FROM sqlite_master WHERE name = 'month_income_override'")).toEqual([]);
      });
    });

    it("Recorded fixed expenses stay", async () => {
      const db = await upgradeFromV1(
        planRow("2026-07", 200000, "eur", 100000) +
          "INSERT INTO expense (date, bucket, amount_cents, note) VALUES ('2026-07-05', 'fixed', 90000, 'Rent');",
      );
      expect(await db.getAllAsync("SELECT bucket, amount_cents, note FROM expense WHERE bucket <> 'income'")).toEqual([
        { bucket: "fixed", amount_cents: 90000, note: "Rent" },
      ]);
    });
  });
});
