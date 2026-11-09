import { act, fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';

import { insertExpense } from '@/features/expenses/repository';
import { migrateDbIfNeeded } from '@/db/database';
import { savePlanFromMonth, setMonthOverride } from '@/features/plan/repository';
import type { ExpenseInput } from '@/features/expenses/rules';
import type { IncomePlan } from '@/features/plan/rules';

import { resetDevice, seedDevice } from './fake-sqlite';

/** 2000 € income, 1000 € fixed in one item, savings 30 % kept, leisure automatic (400 €). */
export const standardPlan: IncomePlan = {
  incomeCents: 200000,
  fixedItems: [{ name: 'House', amountCents: 100000 }],
  kept: 'savings',
  keptAmount: { unit: 'pct', pct: 30 },
};

type Setup = {
  /** Local date the app thinks it is. */
  today: [year: number, monthIndex: number, day: number];
  /** Plans saved on the device: [plan, month it applies from]. */
  plans?: [IncomePlan, string][];
  overrides?: Record<string, number>;
  expenses?: ExpenseInput[];
  /** Raw SQL run last, to store rows the app itself would never write (damaged data). */
  raw?: string[];
};

/** Puts a fresh device in the given state, fixes the clock and opens the app on its home screen. */
export async function startApp({ today, plans = [], overrides = {}, expenses = [], raw = [] }: Setup) {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  jest.setSystemTime(new Date(today[0], today[1], today[2], 12));
  resetDevice();
  await seedDevice(async (db) => {
    await migrateDbIfNeeded(db);
    for (const [plan, month] of plans) await savePlanFromMonth(db, plan, month);
    for (const [month, cents] of Object.entries(overrides)) await setMonthOverride(db, month, cents);
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
      await db.getAllAsync('SELECT * FROM month_income_override ORDER BY month'),
    ];
  });
  return rows;
}
