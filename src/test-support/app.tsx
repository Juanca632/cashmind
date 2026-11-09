import { act, fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';

import { insertExpense } from '@/features/expenses/repository';
import { migrateDbIfNeeded } from '@/db/database';
import { savePlanFromMonth } from '@/features/plan/repository';
import type { ExpenseInput } from '@/features/expenses/rules';
import type { IncomePlan } from '@/features/plan/rules';

import { resetDevice, seedDevice } from './fake-sqlite';

/** A plan plus the income recorded each month it applies. */
export type TestPlan = IncomePlan & { incomeCents: number };

/** 2000 € income, 1000 € fixed in one item, savings 30 % kept, leisure automatic (400 €). */
export const standardPlan: TestPlan = {
  incomeCents: 200000,
  fixedItems: [{ name: 'House', amountCents: 100000 }],
  kept: 'savings',
  keptAmount: { unit: 'pct', pct: 30 },
};

type Setup = {
  /** Local date the app thinks it is. */
  today: [year: number, monthIndex: number, day: number];
  /** Plans saved on the device: [plan, month it applies from]. */
  plans?: [TestPlan, string][];
  /** Income of a month instead of its plan's. */
  overrides?: Record<string, number>;
  /** Leaves the months without any recorded income. */
  noIncome?: boolean;
  expenses?: ExpenseInput[];
  /** Raw SQL run last, to store rows the app itself would never write (damaged data). */
  raw?: string[];
};

export const SEEDED_INCOME = 'Seeded income';

/** The income of each month from the first plan up to today, as migration step 3 would create it. */
function monthIncomes(plans: [TestPlan, string][], overrides: Record<string, number>, today: Setup['today']): [string, number][] {
  if (plans.length === 0) return [];
  const sorted = [...plans].sort((a, b) => a[1].localeCompare(b[1]));
  const last = `${today[0]}-${String(today[1] + 1).padStart(2, '0')}`;
  const result: [string, number][] = [];
  let [year, month] = sorted[0][1].split('-').map(Number);
  for (let key = sorted[0][1]; key <= last; key = `${year}-${String(month).padStart(2, '0')}`) {
    const plan = sorted.filter(([, from]) => from <= key).at(-1)?.[0];
    result.push([key, overrides[key] ?? plan?.incomeCents ?? 0]);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

/** Puts a fresh device in the given state, fixes the clock and opens the app on its home screen. */
export async function startApp({ today, plans = [], overrides = {}, noIncome = false, expenses = [], raw = [] }: Setup) {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  jest.setSystemTime(new Date(today[0], today[1], today[2], 12));
  resetDevice();
  await seedDevice(async (db) => {
    await migrateDbIfNeeded(db);
    for (const [plan, month] of plans) await savePlanFromMonth(db, plan, month);
    for (const [month, cents] of noIncome ? [] : monthIncomes(plans, overrides, today)) {
      await insertExpense(db, { date: `${month}-01`, bucket: 'income', amountCents: cents, note: SEEDED_INCOME });
    }
    for (const expense of expenses) await insertExpense(db, expense);
    for (const sql of raw) await db.execAsync(sql);
  });
  return renderRouter('./src/app');
}

/** Matches a text exactly, whatever kind of space the formatter puts in amounts like "1 000,00 €". */
export function exactText(text: string): RegExp {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s\\u00a0\\u202f]');
  return new RegExp(`^${escaped}$`);
}

/** Matches a fragment of text, whatever kind of space the formatter puts in amounts. */
export function partialText(text: string): RegExp {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s\\u00a0\\u202f]');
  return new RegExp(escaped);
}

/** Presses a button of the open confirmation dialog. */
export async function answerDialog(label: string) {
  await act(async () => {
    fireEvent.press(within(screen.getByTestId('confirm-dialog')).getByRole('button', { name: label }));
  });
}

/** Closes the app and opens it again on the same device, optionally on another day. */
export async function reopenApp(today?: [year: number, monthIndex: number, day: number]) {
  await screen.unmount();
  if (today) jest.setSystemTime(new Date(today[0], today[1], today[2], 12));
  return renderRouter('./src/app');
}

/** Makes every write of the device database reject, like a full or broken disk. Reads keep working. */
export async function breakDeviceWrites() {
  await seedDevice(async (db) => {
    const fail = async () => {
      throw new Error('disk failure');
    };
    db.runAsync = fail;
    db.execAsync = fail;
    db.withTransactionAsync = fail;
    db.withExclusiveTransactionAsync = fail;
  });
}

/** Every stored row of the app tables, to prove nothing was changed. */
export async function dumpDevice() {
  let rows: unknown[] = [];
  await seedDevice(async (db) => {
    rows = [
      await db.getAllAsync('SELECT * FROM expense ORDER BY id'),
      await db.getAllAsync('SELECT * FROM plan_version ORDER BY effective_month'),
      await db.getAllAsync('SELECT * FROM fixed_item ORDER BY id'),
    ];
  });
  return rows;
}
