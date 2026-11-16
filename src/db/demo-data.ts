import type { SQLiteDatabase } from 'expo-sqlite';

import type { EntryCategory } from '@/features/entries/categories';

/** Month key `offset` months away from today. */
function monthAt(today: Date, offset: number): string {
  const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

type Kind = 'income' | 'savings' | 'expense';
type Entry = [day: number, kind: Kind, cents: number, note: string, category: EntryCategory];

/** What repeats every month, recorded on the 1st (see seedDemoData), so My plan lists them. */
const RECURRING: [kind: Kind, cents: number, note: string, category: EntryCategory][] = [
  ['expense', 70000, 'Rent', 'housing'],
  ['expense', 2000, 'Phone', 'subscriptions'],
  ['expense', 3500, 'Gym', 'health'],
  ['expense', 1399, 'Streaming', 'subscriptions'],
];

/**
 * One list per month, oldest first, so Trends has six varied months: a holiday month, a month
 * with a bonus that spends more than it allows (left to spend is negative), freelance income in
 * some months, and a savings goal reached in four of the six months.
 */
const MONTHS: Entry[][] = [
  // Five months ago: a calm month at 20 %.
  [
    [1, 'income', 210000, 'Salary', 'salary'],
    [3, 'expense', 6240, 'Supermarket', 'groceries'],
    [4, 'expense', 6000, 'Transport pass', 'transport'],
    [6, 'expense', 4250, 'Dinner out', 'eating_out'],
    [10, 'expense', 4815, 'Supermarket', 'groceries'],
    [12, 'expense', 1290, 'Pharmacy', 'health'],
    [15, 'savings', 45000, 'Monthly saving', 'emergency_fund'],
    [17, 'expense', 7130, 'Supermarket', 'groceries'],
    [19, 'expense', 1800, 'Cinema', 'leisure'],
    [22, 'expense', 8900, 'Shoes', 'other'],
    [24, 'expense', 2800, 'Lunch with friends', 'eating_out'],
    [26, 'expense', 5580, 'Supermarket', 'groceries'],
  ],
  // Four months ago: some freelance work and a festival.
  [
    [1, 'income', 210000, 'Salary', 'salary'],
    [2, 'expense', 5820, 'Supermarket', 'groceries'],
    [4, 'expense', 6000, 'Transport pass', 'transport'],
    [7, 'expense', 3560, 'Pizza night', 'eating_out'],
    [9, 'expense', 6675, 'Supermarket', 'groceries'],
    [12, 'income', 35000, 'Website for a client', 'freelance'],
    [14, 'savings', 40000, 'Monthly saving', 'emergency_fund'],
    [14, 'savings', 15000, 'Summer trip', 'travel'],
    [16, 'expense', 9500, 'Music festival', 'leisure'],
    [18, 'expense', 6000, 'Dentist', 'health'],
    [20, 'expense', 4990, 'Supermarket', 'groceries'],
    [23, 'expense', 5230, 'Birthday dinner', 'eating_out'],
    [27, 'expense', 6110, 'Supermarket', 'groceries'],
    [29, 'expense', 1840, 'Brunch', 'eating_out'],
  ],
  // Three months ago: the plan goes up to 25 %; a holiday, so the goal is not reached.
  [
    [1, 'income', 230000, 'Salary', 'salary'],
    [3, 'expense', 4530, 'Supermarket', 'groceries'],
    [4, 'expense', 6000, 'Transport pass', 'transport'],
    [5, 'expense', 18000, 'Holiday flights', 'leisure'],
    [8, 'savings', 30000, 'Holiday fund', 'travel'],
    [10, 'expense', 32000, 'Hotel', 'leisure'],
    [11, 'expense', 6400, 'Tapas', 'eating_out'],
    [12, 'expense', 8550, 'Seafood dinner', 'eating_out'],
    [13, 'expense', 2400, 'Taxi', 'transport'],
    [14, 'expense', 4120, 'Beach bar', 'eating_out'],
    [21, 'expense', 5210, 'Supermarket', 'groceries'],
    [28, 'expense', 5890, 'Supermarket', 'groceries'],
  ],
  // Two months ago: a bonus, a new laptop and a weekend trip spend more than the month allows.
  [
    [1, 'income', 300000, 'Salary and bonus', 'salary'],
    [2, 'expense', 32000, 'Weekend trip', 'leisure'],
    [4, 'expense', 6000, 'Transport pass', 'transport'],
    [6, 'expense', 6120, 'Supermarket', 'groceries'],
    [8, 'expense', 106000, 'New laptop', 'other'],
    [12, 'expense', 5740, 'Supermarket', 'groceries'],
    [14, 'savings', 75000, 'Bonus invested', 'investments'],
    [17, 'expense', 4500, 'Physio', 'health'],
    [19, 'expense', 6380, 'Supermarket', 'groceries'],
    [20, 'expense', 19000, 'Team dinner', 'eating_out'],
    [26, 'expense', 5960, 'Supermarket', 'groceries'],
  ],
  // Last month: back to normal, with freelance income and both kinds of savings.
  [
    [1, 'income', 230000, 'Salary', 'salary'],
    [3, 'expense', 5480, 'Supermarket', 'groceries'],
    [4, 'expense', 6000, 'Transport pass', 'transport'],
    [7, 'expense', 3250, 'Sushi', 'eating_out'],
    [10, 'expense', 6230, 'Supermarket', 'groceries'],
    [11, 'income', 42000, 'Logo design', 'freelance'],
    [13, 'savings', 50000, 'Monthly saving', 'emergency_fund'],
    [13, 'savings', 20000, 'Index fund', 'investments'],
    [15, 'expense', 5500, 'Concert', 'leisure'],
    [17, 'expense', 5810, 'Supermarket', 'groceries'],
    [18, 'expense', 2300, 'Books', 'leisure'],
    [21, 'expense', 2870, 'Lunch out', 'eating_out'],
    [24, 'expense', 5200, 'Gift for mum', 'other'],
    [25, 'expense', 6040, 'Supermarket', 'groceries'],
    [30, 'expense', 4100, 'Dinner out', 'eating_out'],
  ],
  // This month, up to mid-month: saving has started but the goal is not reached yet.
  [
    [1, 'income', 230000, 'Salary', 'salary'],
    [2, 'expense', 1500, 'Coffee', 'eating_out'],
    [3, 'expense', 5420, 'Supermarket', 'groceries'],
    [4, 'expense', 6000, 'Transport pass', 'transport'],
    [6, 'savings', 30000, 'Monthly saving', 'emergency_fund'],
    [7, 'expense', 4200, 'Dinner out', 'eating_out'],
    [8, 'expense', 2750, 'Cinema', 'leisure'],
    [10, 'expense', 6380, 'Supermarket', 'groceries'],
    [12, 'expense', 1890, 'Pharmacy', 'health'],
    [14, 'expense', 2850, 'Lunch out', 'eating_out'],
  ],
];

/**
 * Replaces everything in the demo database with six invented months ending today. Only ever called
 * on the separate demo database, so real data is never involved.
 */
export async function seedDemoData(db: SQLiteDatabase, today: Date): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM entry; DELETE FROM recurring; DELETE FROM plan_version;');

    // The monthly entries repeat every month, so My plan lists them; this month already has them.
    const recurringIds = new Map<string, number>();
    for (const [kind, cents, note, category] of RECURRING) {
      const row = await db.runAsync(
        'INSERT INTO recurring (kind, category, amount_cents, note, last_month) VALUES (?, ?, ?, ?, ?)',
        kind,
        category,
        cents,
        note,
        monthAt(today, 0),
      );
      recurringIds.set(note, row.lastInsertRowId);
    }

    const plans: [string, number][] = [
      [monthAt(today, -5), 20],
      [monthAt(today, -3), 25],
    ];
    for (const [month, savingsPercent] of plans) {
      await db.runAsync('INSERT INTO plan_version (effective_month, savings_pct) VALUES (?, ?)', month, savingsPercent);
    }

    const recurringEntries: Entry[] = RECURRING.map(([kind, cents, note, category]) => [1, kind, cents, note, category]);
    for (const [index, entries] of MONTHS.entries()) {
      const offset = index - (MONTHS.length - 1);
      const month = monthAt(today, offset);
      for (const [day, kind, cents, note, category] of [...recurringEntries, ...entries]) {
        // Days fit the month (no 30 February), and the current month only goes up to today.
        const lastDay = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0).getDate();
        const safeDay = Math.min(day, lastDay, offset === 0 ? today.getDate() : lastDay);
        await db.runAsync(
          'INSERT INTO entry (date, kind, amount_cents, note, category, recurring_id) VALUES (?, ?, ?, ?, ?, ?)',
          `${month}-${String(safeDay).padStart(2, '0')}`,
          kind,
          cents,
          note,
          category,
          recurringIds.get(note) ?? null,
        );
      }
    }
  });
}
