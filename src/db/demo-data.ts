import type { SQLiteDatabase } from 'expo-sqlite';

import type { EntryCategory } from '@/features/entries/categories';

/** Month key `offset` months away from today. */
function monthAt(today: Date, offset: number): string {
  const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

type Entry = [day: number, kind: 'income' | 'savings' | 'expense', cents: number, note: string, category: EntryCategory];

/** Bills every month has, recorded as ordinary expenses. */
const BILLS: Entry[] = [
  [2, 'expense', 70000, 'Rent', 'housing'],
  [4, 'expense', 6000, 'Transport', 'transport'],
  [5, 'expense', 2000, 'Phone', 'subscriptions'],
];

/** One list per month, oldest first; the fourth month spends more than it allows (left to spend is negative). */
const MONTHS: Entry[][] = [
  [[1, 'income', 210000, 'Salary', 'salary'], [3, 'expense', 4250, 'Dinner out', 'eating_out'], [9, 'expense', 25000, 'Supermarket', 'groceries'], [15, 'savings', 42000, 'Monthly saving', 'emergency_fund'], [22, 'expense', 8900, 'Shoes', 'other']],
  [[1, 'income', 210000, 'Salary', 'salary'], [2, 'expense', 3100, 'Bar', 'eating_out'], [11, 'expense', 24000, 'Supermarket', 'groceries'], [15, 'savings', 42000, 'Monthly saving', 'emergency_fund'], [27, 'expense', 2300, 'Books', 'leisure']],
  [[1, 'income', 230000, 'Salary', 'salary'], [5, 'expense', 6400, 'Birthday dinner', 'eating_out'], [10, 'expense', 26000, 'Supermarket', 'groceries'], [14, 'savings', 57500, 'Monthly saving', 'emergency_fund'], [19, 'expense', 4500, 'Museum', 'leisure']],
  [[1, 'income', 300000, 'Salary and bonus', 'salary'], [1, 'expense', 32000, 'Weekend trip', 'leisure'], [8, 'expense', 106000, 'New laptop', 'other'], [14, 'savings', 75000, 'Bonus saved', 'investments'], [20, 'expense', 19000, 'Dinner out', 'eating_out']],
  [[1, 'income', 230000, 'Salary', 'salary'], [2, 'expense', 11000, 'Flights', 'leisure'], [6, 'expense', 25000, 'Supermarket', 'groceries'], [12, 'savings', 30000, 'Monthly saving', 'emergency_fund'], [24, 'expense', 5200, 'Gift', 'other']],
  [[1, 'income', 230000, 'Salary', 'salary'], [1, 'expense', 1500, 'Coffee', 'eating_out'], [3, 'expense', 4200, 'Dinner out', 'eating_out'], [6, 'savings', 20000, 'Monthly saving', 'emergency_fund'], [8, 'expense', 2750, 'Cinema', 'leisure']],
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
      for (const [day, kind, cents, note, category] of [...BILLS, ...entries]) {
        // The current month only goes up to today, so nothing is dated in the future.
        const safeDay = offset === 0 ? Math.min(day, today.getDate()) : day;
        await db.runAsync(
          'INSERT INTO entry (date, kind, amount_cents, note, category) VALUES (?, ?, ?, ?, ?)',
          `${month}-${String(safeDay).padStart(2, '0')}`,
          kind,
          cents,
          note,
          category,
        );
      }
    }
  });
}
