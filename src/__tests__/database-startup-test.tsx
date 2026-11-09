import { renderRouter, screen } from "expo-router/testing-library";

import { resetDevice, seedDevice } from "../test-support/fake-sqlite";

jest.mock(
  "expo-sqlite",
  () => jest.requireActual("../test-support/fake-sqlite").expoSqliteMock,
);

const FAILED = /could not update your data.*data is safe/i;
const NEWER = /newer version/i;

const state = async () => {
  let out: unknown;
  await seedDevice(async (db) => {
    out = {
      version: (await db.getFirstAsync("PRAGMA user_version")).user_version,
      master: await db.getAllAsync(
        "SELECT name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name",
      ),
    };
  });
  return out;
};

let errorSpy: jest.SpyInstance;
beforeEach(() => {
  resetDevice();
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());

describe("A failed update is explained and harmless (screen)", () => {
  it("A step that fails midway: the screen says the app could not update the data and that it is safe", async () => {
    await seedDevice(async (db) => {
      await db.execAsync(
        "CREATE TABLE expense (x TEXT); INSERT INTO expense VALUES ('mine')",
      );
    });
    const before = await state();

    await renderRouter("./src/app");

    expect(await screen.findByText(FAILED)).toBeOnTheScreen();
    expect(screen.queryByText(NEWER)).not.toBeOnTheScreen();
    expect(await state()).toEqual(before);
    await seedDevice(async (db) => {
      expect(await db.getAllAsync("SELECT x FROM expense")).toEqual([
        { x: "mine" },
      ]);
    });
  });

  it("A failed first step leaves the version at 0 and no table of the step", async () => {
    await seedDevice(async (db) => {
      await db.execAsync("CREATE TABLE expense (x TEXT)");
    });
    await renderRouter("./src/app");
    await screen.findByText(FAILED);

    await seedDevice(async (db) => {
      expect((await db.getFirstAsync("PRAGMA user_version")).user_version).toBe(
        0,
      );
      const names = (
        await db.getAllAsync(
          "SELECT name FROM sqlite_master WHERE type='table'",
        )
      ).map((r: any) => r.name);
      expect(names).toEqual(["expense"]);
    });
  });

  it("A database saved by a newer version: the screen asks to install the latest version and nothing is written", async () => {
    await seedDevice(async (db) => {
      await db.execAsync(
        "CREATE TABLE old (x TEXT); INSERT INTO old VALUES ('dev'); PRAGMA user_version = 99",
      );
    });
    const before = await state();

    await renderRouter("./src/app");

    expect(await screen.findByText(NEWER)).toBeOnTheScreen();
    expect(screen.queryByText(FAILED)).not.toBeOnTheScreen();
    expect(await state()).toEqual(before);
  });

  it("A development database (version 5) counts as newer than the app", async () => {
    await seedDevice(async (db) => {
      await db.execAsync("PRAGMA user_version = 5");
    });
    await renderRouter("./src/app");

    expect(await screen.findByText(NEWER)).toBeOnTheScreen();
  });

  it("A normal new install shows no update message", async () => {
    await renderRouter("./src/app");

    expect(await screen.findByText("Plan your month")).toBeOnTheScreen();
    expect(screen.queryByText(FAILED)).not.toBeOnTheScreen();
    expect(screen.queryByText(NEWER)).not.toBeOnTheScreen();
  });

  it("An error unrelated to updating the database is not shown as an update problem", async () => {
    await seedDevice(async (db) => {
      const original = db.execAsync.bind(db);
      db.getFirstAsync = async () => {
        throw new TypeError("unrelated failure");
      };
      db.execAsync = original;
    });

    // The error keeps going up (to the app's own error handling) instead of becoming an update message.
    await expect(renderRouter("./src/app")).rejects.toThrow(
      "unrelated failure",
    );
  });
});
