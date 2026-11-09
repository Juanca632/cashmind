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
    process.env.EXPO_PUBLIC_DEMO = '1';
    jest.isolateModules(() => {
      expect(require('@/db/database').DATABASE_NAME).toBe('cashmind-demo.db');
    });
    delete process.env.EXPO_PUBLIC_DEMO;
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
});
