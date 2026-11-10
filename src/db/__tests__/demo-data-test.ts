import { runMigrations } from '@/db/migrate';
import { MIGRATIONS } from '@/db/migrations';
import { DATABASE_NAME } from '@/db/database';
import { seedDemoData } from '@/db/demo-data';

import { createFakeDb } from '../../test-support/fake-sqlite';

async function seeded(today: Date) {
  const db = createFakeDb() as any;
  await runMigrations(db, MIGRATIONS);
  await seedDemoData(db, today);
  return db;
}

describe('Demo data', () => {
  it('Is not used by a normal build', () => {
    expect(DATABASE_NAME).toBe('cashmind.db');
  });

  it('Demo mode opens its own database file', () => {
    const previous = process.env.EXPO_PUBLIC_DEMO;
    process.env.EXPO_PUBLIC_DEMO = '1';
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        expect(require('@/db/database').DATABASE_NAME).toBe('cashmind-demo.db');
      });
    } finally {
      if (previous === undefined) delete process.env.EXPO_PUBLIC_DEMO;
      else process.env.EXPO_PUBLIC_DEMO = previous;
    }
  });

  it('Covers six months ending in the current one', async () => {
    const db = await seeded(new Date(2026, 10, 9, 12));
    const months = await db.getAllAsync("SELECT DISTINCT substr(date, 1, 7) AS month FROM expense ORDER BY month");

    expect(months.map((row: any) => row.month)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
  });

  it('Never dates an expense in the future, even on the first of the month', async () => {
    const db = await seeded(new Date(2027, 0, 1, 12));
    const [{ last }] = await db.getAllAsync('SELECT max(date) AS last FROM expense');

    expect(last).toBe('2027-01-01');
  });

  it('Seeding again replaces the previous data', async () => {
    const db = await seeded(new Date(2026, 10, 9, 12));
    const count = async () => (await db.getAllAsync('SELECT count(*) AS n FROM expense'))[0].n;
    const before = await count();

    await seedDemoData(db, new Date(2026, 10, 9, 12));

    expect(await count()).toBe(before);
  });

  it('The month two before the current one shows a negative left to spend', async () => {
    const db = await seeded(new Date(2026, 10, 9, 12));
    const total = async (bucket: string) =>
      (await db.getAllAsync("SELECT COALESCE(SUM(amount_cents), 0) AS n FROM expense WHERE substr(date, 1, 7) = '2026-09' AND bucket = ?", bucket))[0].n as number;
    const plan = await db.getAllAsync("SELECT savings_pct FROM plan_version WHERE effective_month <= '2026-09' ORDER BY effective_month DESC LIMIT 1");
    const percent = plan[0]?.savings_pct ?? 20;
    const income = await total('income');
    const goal = Math.floor((income * percent) / 100);

    expect(income - (await total('expense')) - Math.max(goal, await total('savings'))).toBeLessThan(0);
  });
});
