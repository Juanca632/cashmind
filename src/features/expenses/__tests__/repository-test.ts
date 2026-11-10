import { migrateDbIfNeeded } from '@/db/database';
import { getExpensesOfMonth, getFirstEntryMonth, getLatestIncomeBefore } from '@/features/expenses/repository';

import { createFakeDb } from '../../../test-support/fake-sqlite';

async function newDb() {
  const db = createFakeDb();
  await migrateDbIfNeeded(db as any);
  return db as any;
}

const add = (db: any, date: string, bucket: string, cents: number, note = '', createdAt = '2026-01-01 00:00:00') =>
  db.runAsync('INSERT INTO expense (date, bucket, amount_cents, note, created_at) VALUES (?, ?, ?, ?, ?)', date, bucket, cents, note, createdAt);

describe('Most recent earlier income', () => {
  it('is null when no month before has income', async () => {
    const db = await newDb();
    await add(db, '2026-10-05', 'expense', 1000);
    await add(db, '2026-11-01', 'income', 200000);

    expect(await getLatestIncomeBefore(db, '2026-11')).toBeNull();
    expect(await getLatestIncomeBefore(db, '2026-10')).toBeNull();
  });

  it('is the total of the incomes of the closest earlier month that has income', async () => {
    const db = await newDb();
    await add(db, '2026-06-01', 'income', 999900);
    await add(db, '2026-08-01', 'income', 150000);
    await add(db, '2026-08-20', 'income', 50000);

    expect(await getLatestIncomeBefore(db, '2026-11')).toBe(200000);
  });

  it('ignores savings and expenses, and months that only have those', async () => {
    const db = await newDb();
    await add(db, '2026-08-01', 'income', 120000);
    await add(db, '2026-09-02', 'savings', 900000);
    await add(db, '2026-10-03', 'expense', 700000);
    await add(db, '2026-08-05', 'expense', 5000);

    expect(await getLatestIncomeBefore(db, '2026-11')).toBe(120000);
  });

  it('ignores the month asked about and every later month', async () => {
    const db = await newDb();
    await add(db, '2026-08-01', 'income', 100000);
    await add(db, '2026-09-01', 'income', 333300);
    await add(db, '2026-10-01', 'income', 444400);
    await add(db, '2026-12-01', 'income', 555500);

    expect(await getLatestIncomeBefore(db, '2026-09')).toBe(100000);
  });

  it('crosses a year boundary', async () => {
    const db = await newDb();
    await add(db, '2025-12-31', 'income', 80000);
    await add(db, '2025-11-30', 'income', 70000);

    expect(await getLatestIncomeBefore(db, '2026-02')).toBe(80000);
  });
});

describe('First entry month', () => {
  it('is null with no entries', async () => {
    expect(await getFirstEntryMonth(await newDb())).toBeNull();
  });

  it('is the month of the oldest entry, whatever its kind or id', async () => {
    const db = await newDb();
    await add(db, '2026-11-02', 'income', 100);
    await add(db, '2025-03-10', 'savings', 100);
    await add(db, '2026-01-01', 'expense', 100);

    expect(await getFirstEntryMonth(db)).toBe('2025-03');
  });
});

describe('Entries of a month', () => {
  it('only returns that month, newest date first and, on the same day, the one recorded later first', async () => {
    const db = await newDb();
    await add(db, '2026-11-05', 'expense', 1, 'early', '2026-11-05 08:00:00');
    await add(db, '2026-11-05', 'expense', 2, 'late', '2026-11-05 18:00:00');
    await add(db, '2026-11-06', 'income', 3, 'next day', '2026-11-05 07:00:00');
    await add(db, '2026-10-31', 'expense', 4, 'other month');
    await add(db, '2026-12-01', 'expense', 5, 'other month');

    const entries = await getExpensesOfMonth(db, '2026-11');

    expect(entries.map((entry) => entry.note)).toEqual(['next day', 'late', 'early']);
    expect(entries[1]).toMatchObject({ date: '2026-11-05', bucket: 'expense', amountCents: 2 });
  });
});
