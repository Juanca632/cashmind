import type { SQLiteDatabase } from 'expo-sqlite';

/** Month key `offset` months away from today. */
function monthAt(today: Date, offset: number): string {
  const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

type Entry = [day: number, kind: 'income' | 'savings' | 'expense', cents: number, note: string];

/** Bills every month has, recorded as ordinary expenses. */
const BILLS: Entry[] = [
  [2, 'expense', 70000, 'Rent'],
  [4, 'expense', 6000, 'Transport'],
  [5, 'expense', 2000, 'Phone'],
];

/** One list per month, oldest first; the fourth month spends more than it allows (left to spend is negative). */
const MONTHS: Entry[][] = [
  [[1, 'income', 210000, 'Salary'], [3, 'expense', 4250, 'Dinner out'], [9, 'expense', 25000, 'Supermarket'], [15, 'savings', 42000, 'Monthly saving'], [22, 'expense', 8900, 'Shoes']],
  [[1, 'income', 210000, 'Salary'], [2, 'expense', 3100, 'Bar'], [11, 'expense', 24000, 'Supermarket'], [15, 'savings', 42000, 'Monthly saving'], [27, 'expense', 2300, 'Books']],
  [[1, 'income', 230000, 'Salary'], [5, 'expense', 6400, 'Birthday dinner'], [10, 'expense', 26000, 'Supermarket'], [14, 'savings', 57500, 'Monthly saving'], [19, 'expense', 4500, 'Museum']],
  [[1, 'income', 300000, 'Salary and bonus'], [1, 'expense', 32000, 'Weekend trip'], [8, 'expense', 106000, 'New laptop'], [14, 'savings', 75000, 'Bonus saved'], [20, 'expense', 19000, 'Dinner out']],
  [[1, 'income', 230000, 'Salary'], [2, 'expense', 11000, 'Flights'], [6, 'expense', 25000, 'Supermarket'], [12, 'savings', 30000, 'Monthly saving'], [24, 'expense', 5200, 'Gift']],
  [[1, 'income', 230000, 'Salary'], [1, 'expense', 1500, 'Coffee'], [3, 'expense', 4200, 'Dinner out'], [6, 'savings', 20000, 'Monthly saving'], [8, 'expense', 2750, 'Cinema']],
];

/**
 * Replaces everything in the demo database with six invented months ending today. Only ever called
 * on the separate demo database, so real data is never involved.
 */
export async function seedDemoData(db: SQLiteDatabase, today: Date): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM entry; DELETE FROM plan_version;');

    const plans: [string, number][] = [
      [monthAt(today, -5), 20],
      [monthAt(today, -3), 25],
    ];
    for (const [month, savingsPercent] of plans) {
      await db.runAsync('INSERT INTO plan_version (effective_month, savings_pct) VALUES (?, ?)', month, savingsPercent);
    }

    for (const [index, entries] of MONTHS.entries()) {
      const offset = index - (MONTHS.length - 1);
      const month = monthAt(today, offset);
      for (const [day, kind, cents, note] of [...BILLS, ...entries]) {
        // The current month only goes up to today, so nothing is dated in the future.
        const safeDay = offset === 0 ? Math.min(day, today.getDate()) : day;
        await db.runAsync(
          'INSERT INTO entry (date, kind, amount_cents, note) VALUES (?, ?, ?, ?)',
          `${month}-${String(safeDay).padStart(2, '0')}`,
          kind,
          cents,
          note,
        );
      }
    }
  });
}
