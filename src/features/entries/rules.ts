/**
 * Entry domain logic. Pure functions, no React and no storage.
 * Dates are local-time day keys 'YYYY-MM-DD'; months are 'YYYY-MM'. Money is integer cents.
 */
import { CATEGORIES, CATEGORY_LABELS, isCategoryOf, type EntryCategory } from '@/features/entries/categories';
import { ENTRY_KINDS, KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { AMOUNT_TOO_LARGE, isValidCents } from '@/shared/money';
import { POCKET_COLOR_NAMES, type PocketColor } from '@/shared/theme/theme';
import { addDays, dayKey, dayToDate, isValidDayKey } from '@/shared/days';
import { isValidMonthKey, monthKey } from '@/shared/months';

export type Entry = {
  id: number;
  date: string;
  kind: EntryKind;
  amountCents: number;
  note: string;
  category: EntryCategory;
  /** The monthly item this entry was recorded by or marked from; null when it never repeated. */
  recurringId: number | null;
  /** The pocket of a saving (specs/025-pockets); null for income and expenses. */
  pocketId: number | null;
  /** That pocket's name and emoji, read with the entry; null when there is no pocket. */
  pocketName: string | null;
  pocketEmoji: string | null;
  /** When it was recorded ('YYYY-MM-DD HH:MM:SS'), to order it among the rows of its day; read only. */
  createdAt?: string;
};

export type EntryInput = Omit<Entry, 'id' | 'recurringId' | 'pocketName' | 'pocketEmoji' | 'createdAt'>;

/** An entry that is recorded again on the 1st of every new month until it is stopped. */
export type RecurringItem = {
  id: number;
  kind: EntryKind;
  category: EntryCategory;
  amountCents: number;
  note: string;
  active: boolean;
  /** The latest month 'YYYY-MM' that already has this item's entry. */
  lastMonth: string;
  /** The pocket a monthly saving goes into; null for income and expenses. */
  pocketId: number | null;
  pocketName: string | null;
  pocketEmoji: string | null;
};

/** What can change on a monthly item; its kind is fixed. */
export type RecurringInput = Pick<RecurringItem, 'category' | 'amountCents' | 'note' | 'pocketId'>;

export const RECURRING_MISSING = 'This monthly entry no longer exists.';

/** The same amount and category checks as an entry, for the item's fixed kind. */
export function validateRecurring(kind: EntryKind, input: RecurringInput): EntryError[] {
  const errors: EntryError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  else if (!isValidCents(input.amountCents)) errors.push('amount-too-large');
  if (!isCategoryOf(kind, input.category)) errors.push('category-invalid');
  const pocketError = checkPocket(kind, input.pocketId);
  if (pocketError) errors.push(pocketError);
  return errors;
}

/** Savings need a pocket, an expense may be paid from one, and income never has one. */
function checkPocket(kind: EntryKind, pocketId: number | null): EntryError | null {
  if (kind === 'savings') return pocketId === null ? 'pocket-missing' : null;
  if (kind === 'income') return pocketId === null ? null : 'pocket-not-allowed';
  return null;
}

/**
 * What the monthly expenses paid from the month add up to. Repeating income and savings are not
 * costs, and expenses paid from a pocket are not the month's money (specs/026-pocket-spending).
 */
export function fixedCostsCents(items: readonly Pick<RecurringItem, 'kind' | 'amountCents' | 'active' | 'pocketId'>[]): number {
  return items.reduce(
    (sum, item) => (item.active && item.kind === 'expense' && countsInMonth(item) ? sum + item.amountCents : sum),
    0,
  );
}

/**
 * False only for an expense paid from a pocket (specs/026-pocket-spending): it lowers the pocket,
 * not the month, so every month figure leaves it out. Lists still show it.
 */
export function countsInMonth(entry: Pick<Entry, 'kind' | 'pocketId'>): boolean {
  return !(entry.kind === 'expense' && entry.pocketId !== null);
}

export type EntryError =
  | 'amount-not-positive'
  | 'amount-too-large'
  | 'kind-invalid'
  | 'date-invalid'
  | 'category-invalid'
  | 'pocket-missing'
  | 'pocket-not-allowed';

export function validateEntry(input: EntryInput, today: Date): EntryError[] {
  const errors: EntryError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  else if (!isValidCents(input.amountCents)) errors.push('amount-too-large');
  if (!ENTRY_KINDS.includes(input.kind)) errors.push('kind-invalid');
  else {
    if (!isCategoryOf(input.kind, input.category)) errors.push('category-invalid');
    const pocketError = checkPocket(input.kind, input.pocketId);
    if (pocketError) errors.push(pocketError);
  }
  if (!isValidDayKey(input.date) || input.date > dayKey(today)) errors.push('date-invalid');
  return errors;
}

export const ENTRY_MISSING = 'This entry no longer exists.';
export const POCKET_MISSING = 'Pick a pocket.';

export function entryErrorMessage(error: EntryError): string {
  switch (error) {
    case 'amount-not-positive':
      return 'The amount must be greater than 0.';
    case 'amount-too-large':
      return AMOUNT_TOO_LARGE;
    case 'kind-invalid':
      return 'Pick income, savings or expense.';
    case 'date-invalid':
      return 'Pick a date that is not in the future.';
    case 'category-invalid':
      return 'Pick a category for this kind.';
    case 'pocket-missing':
      return POCKET_MISSING;
    case 'pocket-not-allowed':
      return 'Income never goes into a pocket.';
  }
}

/** Last day of a month 'YYYY-MM'. */
export function lastDayOfMonth(month: string): string {
  return dayKey(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0));
}

/** Today, or the last day of the requested month when adding to a past month. */
export function defaultEntryDate(month: string | undefined, today: Date): string {
  return isValidMonthKey(month) && month < monthKey(today) ? lastDayOfMonth(month) : dayKey(today);
}

export function totalsByKind(entries: readonly Pick<Entry, 'kind' | 'amountCents'>[]): Record<EntryKind, number> {
  const totals: Record<EntryKind, number> = { income: 0, savings: 0, expense: 0 };
  for (const entry of entries) totals[entry.kind] += entry.amountCents;
  return totals;
}

/** How many entries home lists before linking to the whole month. */
export const HOME_LIST_SIZE = 5;

/** The entries of one kind, in the same order; null keeps every entry. */
export function entriesOfKind<T extends Pick<Entry, 'kind'>>(entries: readonly T[], kind: EntryKind | null): T[] {
  return kind === null ? [...entries] : entries.filter((entry) => entry.kind === kind);
}

/** The first `size` entries and how many there are in all. */
export function firstEntries<T>(entries: readonly T[], size: number): { shown: T[]; total: number } {
  return { shown: entries.slice(0, size), total: entries.length };
}

/** True for a kind of entry; used to read a kind from route params. */
export function isEntryKind(value: unknown): value is EntryKind {
  return typeof value === 'string' && (ENTRY_KINDS as readonly string[]).includes(value);
}

/** What a list filtered to one kind says when the month has none of it. */
export const EMPTY_KIND_TEXTS: Record<EntryKind, string> = {
  income: 'No income this month.',
  savings: 'No savings this month.',
  expense: 'No expenses this month.',
};

/** One category's part of a kind's total for the month. */
export type CategoryShare = { category: EntryCategory; cents: number; percent: number };

/**
 * A kind's entries added up by category, largest first (ties in list order), with each one's whole
 * percentage of the kind's total rounded to the nearest. Empty when the kind has no entries.
 */
export function categorySplit(entries: readonly Pick<Entry, 'kind' | 'amountCents' | 'category'>[], kind: EntryKind): CategoryShare[] {
  const order = CATEGORIES[kind];
  const cents = new Map<EntryCategory, number>();
  let total = 0;
  for (const entry of entries) {
    if (entry.kind !== kind) continue;
    cents.set(entry.category, (cents.get(entry.category) ?? 0) + entry.amountCents);
    total += entry.amountCents;
  }
  return [...cents]
    .map(([category, sum]) => ({ category, cents: sum, percent: Math.round((sum * 100) / total) }))
    .sort((a, b) => b.cents - a.cents || order.indexOf(a.category) - order.indexOf(b.category));
}

/** What a row is called: its note, else its pocket (savings) or category, else its kind. */
export function entryTitle(entry: Pick<Entry, 'kind' | 'category' | 'note'> & { pocketName?: string | null }): string {
  if (entry.note) return entry.note;
  if (entry.kind === 'savings') return entry.pocketName ?? KIND_LABELS.savings;
  return entry.category === 'other' ? KIND_LABELS[entry.kind] : CATEGORY_LABELS[entry.category];
}

/** How far back the form looks for expenses to suggest, in days including today. */
export const QUICK_ADD_DAYS = 60;
/** How many times an expense must have been recorded in that period to be suggested. */
export const QUICK_ADD_MIN = 2;
/** How many suggestions the form shows at most. */
export const QUICK_ADD_MAX = 4;

/** An expense the user records often: the values the form is filled with, and how often it was recorded. */
export type QuickAddSuggestion = Pick<Entry, 'category' | 'amountCents' | 'note'> & { count: number; lastDate: string };

/**
 * The expenses recorded at least QUICK_ADD_MIN times in the last QUICK_ADD_DAYS days (same category,
 * amount and exact note), most often first, then most recent; at most QUICK_ADD_MAX. Entries recorded
 * by a monthly repeat are left out, since the app records them by itself.
 */
export function quickAddSuggestions(entries: readonly Entry[], today: Date): QuickAddSuggestion[] {
  const last = dayKey(today);
  const first = addDays(last, -(QUICK_ADD_DAYS - 1));
  const groups = new Map<string, QuickAddSuggestion>();
  for (const entry of entries) {
    if (entry.kind !== 'expense' || !countsInMonth(entry) || entry.recurringId !== null || entry.date < first || entry.date > last) continue;
    const key = JSON.stringify([entry.category, entry.amountCents, entry.note]);
    const group = groups.get(key);
    if (group) {
      group.count += 1;
      if (entry.date > group.lastDate) group.lastDate = entry.date;
    } else {
      groups.set(key, { category: entry.category, amountCents: entry.amountCents, note: entry.note, count: 1, lastDate: entry.date });
    }
  }
  return [...groups.values()]
    .filter((group) => group.count >= QUICK_ADD_MIN)
    .sort((a, b) => b.count - a.count || (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0))
    .slice(0, QUICK_ADD_MAX);
}

/** The months ('YYYY-MM') that hold the days quickAddSuggestions looks at. */
export function quickAddRange(today: Date): { from: string; to: string } {
  return { from: monthKey(dayToDate(addDays(dayKey(today), -(QUICK_ADD_DAYS - 1)))), to: monthKey(today) };
}

/** A place the user saves for, with money saved before the app (specs/025-pockets). */
export type Pocket = {
  id: number;
  name: string;
  startingCents: number;
  /** An optional emoji to recognise it by; '' when there is none (specs/027-spaces). */
  emoji: string;
  color: PocketColor;
};

export type PocketInput = Pick<Pocket, 'name' | 'startingCents' | 'emoji' | 'color'>;

export const POCKET_NAME_MAX = 40;
/** Room for one emoji, even one made of several characters (flags, skin tones, families). */
export const POCKET_EMOJI_MAX = 8;

export type PocketError = 'pocket-name' | 'amount-too-large' | 'pocket-emoji' | 'pocket-color';

export function isPocketColor(value: unknown): value is PocketColor {
  return POCKET_COLOR_NAMES.includes(value as PocketColor);
}

export function validatePocket(input: PocketInput): PocketError[] {
  const errors: PocketError[] = [];
  const name = input.name.trim();
  if (name.length === 0 || name.length > POCKET_NAME_MAX) errors.push('pocket-name');
  if (!isValidCents(input.startingCents)) errors.push('amount-too-large');
  if (input.emoji.trim().length > POCKET_EMOJI_MAX) errors.push('pocket-emoji');
  if (!isPocketColor(input.color)) errors.push('pocket-color');
  return errors;
}

export function pocketErrorMessage(error: PocketError): string {
  switch (error) {
    case 'pocket-name':
      return 'Give the pocket a name.';
    case 'amount-too-large':
      return AMOUNT_TOO_LARGE;
    case 'pocket-emoji':
      return 'Use one emoji.';
    case 'pocket-color':
      return 'Pick a colour.';
  }
}

/** How a pocket is named on screen: its emoji, if any, before its name. */
export function pocketLabel(pocket: { name: string; emoji: string | null }): string {
  return pocket.emoji ? `${pocket.emoji} ${pocket.name}` : pocket.name;
}

/**
 * What a pocket holds: `cents` = starting + saved − spent − moved out + moved in, which may be below
 * zero (specs/028-move-money).
 */
export type PocketBalance = {
  pocket: Pocket;
  cents: number;
  savedCents: number;
  spentCents: number;
  movedOutCents: number;
  movedInCents: number;
};

/** Each pocket's balance from its starting amount, savings, expenses paid from it and moves, in the pockets' order. */
export function pocketBalances(
  pockets: readonly Pocket[],
  entries: readonly Pick<Entry, 'kind' | 'pocketId' | 'amountCents'>[],
  moves: readonly Pick<Move, 'fromPocketId' | 'toPocketId' | 'amountCents'>[] = [],
): PocketBalance[] {
  return pockets.map((pocket) => {
    let savedCents = 0;
    let spentCents = 0;
    for (const entry of entries) {
      if (entry.pocketId !== pocket.id) continue;
      if (entry.kind === 'savings') savedCents += entry.amountCents;
      else if (entry.kind === 'expense') spentCents += entry.amountCents;
    }
    let movedOutCents = 0;
    let movedInCents = 0;
    for (const move of moves) {
      if (move.fromPocketId === pocket.id) movedOutCents += move.amountCents;
      if (move.toPocketId === pocket.id) movedInCents += move.amountCents;
    }
    const cents = pocket.startingCents + savedCents - spentCents - movedOutCents + movedInCents;
    return { pocket, cents, savedCents, spentCents, movedOutCents, movedInCents };
  });
}

export function pocketsTotal(balances: readonly PocketBalance[]): number {
  return balances.reduce((sum, balance) => sum + balance.cents, 0);
}

/**
 * Money taken out of a pocket, into Main (`toPocketId` null) or into another pocket
 * (specs/028-move-money). The pockets' names and emojis are read with it.
 */
export type Move = {
  id: number;
  date: string;
  amountCents: number;
  note: string;
  fromPocketId: number;
  fromName: string;
  fromEmoji: string;
  toPocketId: number | null;
  toName: string | null;
  toEmoji: string | null;
  /** When it was recorded, to order it among the entries of its day. */
  createdAt?: string;
};

export type MoveInput = Pick<Move, 'date' | 'amountCents' | 'note' | 'fromPocketId' | 'toPocketId'>;

export type MoveError = 'amount-not-positive' | 'amount-too-large' | 'date-invalid' | 'move-same-pocket';

export const MOVE_MISSING = 'This move no longer exists.';
export const MOVE_TOO_MUCH = 'There is not that much in this pocket.';

export function validateMove(input: MoveInput, today: Date): MoveError[] {
  const errors: MoveError[] = [];
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.push('amount-not-positive');
  else if (!isValidCents(input.amountCents)) errors.push('amount-too-large');
  if (!isValidDayKey(input.date) || input.date > dayKey(today)) errors.push('date-invalid');
  if (input.toPocketId === input.fromPocketId) errors.push('move-same-pocket');
  return errors;
}

export function moveErrorMessage(error: MoveError): string {
  switch (error) {
    case 'amount-not-positive':
      return 'The amount must be greater than 0.';
    case 'amount-too-large':
      return AMOUNT_TOO_LARGE;
    case 'date-invalid':
      return 'Pick a date that is not in the future.';
    case 'move-same-pocket':
      return 'Pick another place to move it to.';
  }
}

/** Money that is not in the pocket cannot be moved (unlike spending, which really happened). */
export function moveTooMuch(amountCents: number, balanceCents: number): boolean {
  return amountCents > balanceCents;
}

/** What the moves of a month added to Main: it counts in that month's left to spend. */
export function movedIntoMain(moves: readonly Pick<Move, 'date' | 'toPocketId' | 'amountCents'>[], month: string): number {
  return moves.reduce((sum, move) => (move.toPocketId === null && move.date.slice(0, 7) === month ? sum + move.amountCents : sum), 0);
}

/** A move as one side sees it: +1 where it arrives, -1 where it leaves. */
export type MoveLine = { move: Move; sign: 1 | -1 };

/** One row of a list: an entry or a move. */
export type ListItem = { type: 'entry'; entry: Entry } | ({ type: 'move' } & MoveLine);

/**
 * Entries and moves in one list, newest first: by day, then by when each was recorded, so a move
 * made after an expense of the same day lists above it. On a tie the entry goes first. Both lists
 * come newest first and each keeps its own order.
 */
export function mergeByDate(entries: readonly Entry[], lines: readonly MoveLine[]): ListItem[] {
  const items: ListItem[] = [];
  let e = 0;
  let m = 0;
  while (e < entries.length || m < lines.length) {
    if (m >= lines.length || (e < entries.length && !isNewer(lines[m].move, entries[e]))) {
      items.push({ type: 'entry', entry: entries[e] });
      e += 1;
    } else {
      items.push({ type: 'move', ...lines[m] });
      m += 1;
    }
  }
  return items;
}

/** True when the move goes above the entry: a later day, or the same day recorded later. */
function isNewer(move: Pick<Move, 'date' | 'createdAt'>, entry: Pick<Entry, 'date' | 'createdAt'>): boolean {
  if (move.date !== entry.date) return move.date > entry.date;
  return (move.createdAt ?? '') > (entry.createdAt ?? '');
}

/** What a move's row is called: its note, else where it went ("To Main") or came from ("From Car"). */
export function moveTitle(move: Move, sign: 1 | -1): string {
  if (move.note) return move.note;
  if (sign === -1) return `To ${move.toPocketId === null ? MAIN_NAME : pocketLabel({ name: move.toName ?? '', emoji: move.toEmoji })}`;
  return `From ${pocketLabel({ name: move.fromName, emoji: move.fromEmoji })}`;
}

/** What the month's money is called, as Revolut calls its main account (specs/027-spaces). */
export const MAIN_NAME = 'Main';

/** The moves a pocket sees: out of it (-1) and into it (+1), in the moves' order. */
export function pocketMoveLines(moves: readonly Move[], pocketId: number): MoveLine[] {
  const lines: MoveLine[] = [];
  for (const move of moves) {
    if (move.fromPocketId === pocketId) lines.push({ move, sign: -1 });
    else if (move.toPocketId === pocketId) lines.push({ move, sign: 1 });
  }
  return lines;
}

/** The moves into Main dated in a month, as Main's list shows them. */
export function mainMoveLines(moves: readonly Move[], month: string): MoveLine[] {
  return moves.filter((move) => move.toPocketId === null && move.date.slice(0, 7) === month).map((move) => ({ move, sign: 1 }));
}
