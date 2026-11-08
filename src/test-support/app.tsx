import { renderRouter, screen } from 'expo-router/testing-library';

import { insertExpense } from '@/data/expense-repo';
import { migrateDbIfNeeded } from '@/data/database';
import { savePlanFromMonth, setMonthOverride } from '@/data/income-plan-repo';
import type { ExpenseInput } from '@/domain/expenses';
import type { IncomePlan } from '@/domain/income-plan';

import { resetDevice, seedDevice } from './fake-sqlite';

/** 2000 € income, 1000 € fixed, savings 30 % kept, leisure automatic (400 €). */
export const standardPlan: IncomePlan = {
  incomeCents: 200000,
  fixed: { unit: 'eur', cents: 100000 },
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
};

/** Puts a fresh device in the given state, fixes the clock and opens the app on its home screen. */
export async function startApp({ today, plans = [], overrides = {}, expenses = [] }: Setup) {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  jest.setSystemTime(new Date(today[0], today[1], today[2], 12));
  resetDevice();
  await seedDevice(async (db) => {
    await migrateDbIfNeeded(db);
    for (const [plan, month] of plans) await savePlanFromMonth(db, plan, month);
    for (const [month, cents] of Object.entries(overrides)) await setMonthOverride(db, month, cents);
    for (const expense of expenses) await insertExpense(db, expense);
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

/** Closes the app and opens it again on the same device, optionally on another day. */
export async function reopenApp(today?: [year: number, monthIndex: number, day: number]) {
  await screen.unmount();
  if (today) jest.setSystemTime(new Date(today[0], today[1], today[2], 12));
  return renderRouter('./src/app');
}
