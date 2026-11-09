import type { SQLiteDatabase } from 'expo-sqlite';

/** Month key `offset` months away from today. */
function monthAt(today: Date, offset: number): string {
  const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const FIRST_PLAN: [string, number][] = [
  ['House', 70000],
  ['Transport', 6000],
  ['Phone', 2000],
  ['Supermarket', 25000],
  ['Gym', 3000],
];
const SECOND_PLAN: [string, number][] = [['House', 75000], ...FIRST_PLAN.slice(1)];

type Entry = [day: number, bucket: 'leisure' | 'savings', cents: number, note: string];

/** One list per month, oldest first; the fourth month goes over its wants budget. */
const MONTHS: Entry[][] = [
  [[3, 'leisure', 4250, 'Dinner out'], [9, 'leisure', 1250, 'Cinema'], [15, 'savings', 42000, 'Monthly saving'], [22, 'leisure', 8900, 'Shoes']],
  [[2, 'leisure', 3100, 'Bar'], [11, 'leisure', 12000, 'Concert'], [15, 'savings', 42000, 'Monthly saving'], [27, 'leisure', 2300, 'Books']],
  [[5, 'leisure', 6400, 'Birthday dinner'], [14, 'savings', 57500, 'Monthly saving'], [19, 'leisure', 4500, 'Museum'], [28, 'leisure', 1800, 'Coffee']],
  [[1, 'leisure', 32000, 'Weekend trip'], [8, 'leisure', 26000, 'New jacket'], [14, 'savings', 75000, 'Bonus saved'], [20, 'leisure', 19000, 'Dinner out']],
  [[2, 'leisure', 11000, 'Flights'], [6, 'leisure', 3800, 'Lunch'], [12, 'savings', 30000, 'Monthly saving'], [24, 'leisure', 5200, 'Gift']],
  [[1, 'leisure', 1500, 'Coffee'], [3, 'leisure', 4200, 'Dinner out'], [6, 'savings', 20000, 'Monthly saving'], [8, 'leisure', 2750, 'Cinema']],
];

/**
 * Replaces everything in the demo database with six invented months ending today. Only ever called
 * on the separate demo database, so real data is never involved.
 */
export async function seedDemoData(db: SQLiteDatabase, today: Date): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM expense; DELETE FROM fixed_item; DELETE FROM month_income_override; DELETE FROM plan_version;');

    const plans: [string, number, number, [string, number][]][] = [
      [monthAt(today, -5), 210000, 20, FIRST_PLAN],
      [monthAt(today, -3), 230000, 25, SECOND_PLAN],
    ];
    for (const [month, income, savingsPercent, items] of plans) {
      await db.runAsync(
        "INSERT INTO plan_version (effective_month, income_cents, kept_bucket, kept_unit, kept_value) VALUES (?, ?, 'savings', 'pct', ?)",
        month,
        income,
        savingsPercent,
      );
      for (const [name, cents] of items) {
        await db.runAsync('INSERT INTO fixed_item (effective_month, name, amount_cents) VALUES (?, ?, ?)', month, name, cents);
      }
    }
    await db.runAsync('INSERT INTO month_income_override (month, income_cents) VALUES (?, ?)', monthAt(today, -2), 300000);

    for (const [index, entries] of MONTHS.entries()) {
      const offset = index - (MONTHS.length - 1);
      const month = monthAt(today, offset);
      for (const [day, bucket, cents, note] of entries) {
        // The current month only goes up to today, so nothing is dated in the future.
        const safeDay = offset === 0 ? Math.min(day, today.getDate()) : day;
        await db.runAsync(
          'INSERT INTO expense (date, bucket, amount_cents, note) VALUES (?, ?, ?, ?)',
          `${month}-${String(safeDay).padStart(2, '0')}`,
          bucket,
          cents,
          note,
        );
      }
    }
  });
}
