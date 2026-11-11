import { fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';

import { insertEntry } from '@/features/entries/repository';
import { migrateDbIfNeeded } from '@/db/database';
import { savePlanFromMonth } from '@/features/plan/repository';
import type { EntryInput } from '@/features/entries/rules';

import { resetDevice, seedDevice } from './fake-sqlite';
import { RELEASED_SCHEMAS } from './released-schemas';

type Setup = {
  /** Local date the app thinks it is. */
  today: [year: number, monthIndex: number, day: number];
  /** Plans saved on the device: [savings percentage, month it applies from]. */
  plans?: [number, string][];
  /** Entries (income, savings and expenses) already recorded on the device. */
  entries?: EntryInput[];
  /** Raw SQL run last, to store rows the app itself would never write (damaged data). */
  raw?: string[];
};

/** Puts a fresh device in the given state, fixes the clock and opens the app on its home screen. */
export async function startApp({ today, plans = [], entries = [], raw = [] }: Setup) {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  jest.setSystemTime(new Date(today[0], today[1], today[2], 12));
  resetDevice();
  await seedDevice(async (db) => {
    await migrateDbIfNeeded(db);
    for (const [percent, month] of plans) await savePlanFromMonth(db, percent, month);
    for (const entry of entries) await insertEntry(db, entry);
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

export const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
export const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
export const choose = (name: string) => fireEvent.press(screen.getByRole('radio', { name }));

/** Checks the amount shown on the "Left to spend" card, e.g. "700,00 €" or "-100,00 €". */
export function expectLeftToSpend(amount: string) {
  const escaped = amount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s\\u00a0\\u202f]');
  expect(screen.getByText('Left to spend').parent).toHaveTextContent(new RegExp(`^Left to spend${escaped}`));
}

/** Records one entry through the form opened from home, for the kind and amount typed. */
export async function record(kind: 'Income' | 'Savings' | 'Expense', amount: string, note?: string) {
  await press('Add expense');
  await choose(kind);
  await type('Amount', amount);
  if (note) await type('Note (optional)', note);
  await press(kind === 'Income' ? 'Add income' : kind === 'Savings' ? 'Add to savings' : 'Add expense');
}

export const DELETE_DIALOG = 'Delete this entry?';
export const DISCARD_DIALOG = 'Discard changes?';

/** The open confirmation dialog, found by its title (the only header that asks a question). */
function openDialog(title?: string) {
  const header = screen.getByRole('header', { name: title ?? /\?$/ });
  return { header, dialog: within(header.parent!) };
}

/** Checks that the confirmation dialog with this title is open. */
export function expectDialog(title: string) {
  expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
}

/** Checks that no confirmation dialog is open. */
export function expectNoDialog() {
  expect(screen.queryByRole('header', { name: /\?$/ })).not.toBeOnTheScreen();
}

/** Presses a button of the open confirmation dialog, found through its title. */
export async function answerDialog(label: string, title?: string) {
  await fireEvent.press(openDialog(title).dialog.getByRole('button', { name: label }));
}

/** Titles shown in the navigation header, outermost screen first (e.g. ["CashMind", "Add expense"]). */
export function headerTitles(): string[] {
  const titles: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node === 'string') return;
    if (Array.isArray(node)) return node.forEach(walk);
    const { props, children } = node as { props?: { title?: unknown }; children?: unknown };
    if (typeof props?.title === 'string') titles.push(props.title);
    walk(children);
  };
  walk(screen.toJSON());
  return titles;
}

/** Opens the app on a database left by a released version, to prove the update keeps the user's data. */
export async function startAppOnReleasedVersion(
  today: [year: number, monthIndex: number, day: number],
  version: number,
  data: string,
) {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  jest.setSystemTime(new Date(today[0], today[1], today[2], 12));
  resetDevice();
  await seedDevice(async (db) => {
    await db.execAsync(RELEASED_SCHEMAS[version]);
    await db.execAsync(data);
    await db.execAsync(`PRAGMA user_version = ${version}`);
  });
  return renderRouter('./src/app');
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
      await db.getAllAsync('SELECT * FROM entry ORDER BY id'),
      await db.getAllAsync('SELECT * FROM plan_version ORDER BY effective_month'),
    ];
  });
  return rows;
}
