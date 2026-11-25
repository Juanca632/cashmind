import type { Entry, Move, Pocket } from '@/features/entries/rules';
import { monthKey } from '@/shared/months';

/** A pocket's balance day by day through the current month (specs/029-pocket-balance-chart). Money in cents. */
export type PocketMonth = {
  daysInMonth: number;
  /** What the pocket held at the end of last month: its starting amount and everything dated before. */
  startCents: number;
  /** The balance at the end of each day, from the 1st to today. */
  steps: { day: number; cents: number }[];
  /** Today's balance. */
  endCents: number;
};

/**
 * Savings into the pocket and moves into it raise it; expenses paid from it and moves out of it
 * lower it. `entries` are the pocket's own; `moves` may be every move.
 */
export function pocketMonth(
  pocket: Pick<Pocket, 'id' | 'startingCents'>,
  entries: readonly Pick<Entry, 'date' | 'kind' | 'amountCents' | 'pocketId'>[],
  moves: readonly Pick<Move, 'date' | 'amountCents' | 'fromPocketId' | 'toPocketId'>[],
  today: Date,
): PocketMonth {
  const month = monthKey(today);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const byDay = new Array<number>(daysInMonth + 1).fill(0);
  let startCents = pocket.startingCents;

  // Months 'YYYY-MM' sort as text, so an earlier month compares lower.
  const add = (date: string, cents: number) => {
    const entryMonth = date.slice(0, 7);
    if (entryMonth < month) startCents += cents;
    else if (entryMonth === month) byDay[Number(date.slice(8, 10))] += cents;
  };
  for (const entry of entries) {
    if (entry.pocketId !== pocket.id) continue;
    if (entry.kind === 'savings') add(entry.date, entry.amountCents);
    else if (entry.kind === 'expense') add(entry.date, -entry.amountCents);
  }
  for (const move of moves) {
    if (move.fromPocketId === pocket.id) add(move.date, -move.amountCents);
    else if (move.toPocketId === pocket.id) add(move.date, move.amountCents);
  }

  const steps: PocketMonth['steps'] = [];
  let cents = startCents;
  for (let day = 1; day <= today.getDate(); day++) {
    cents += byDay[day];
    steps.push({ day, cents });
  }
  return { daysInMonth, startCents, steps, endCents: cents };
}

/** How the pocket changed this month, in neutral words. */
export function balanceSentence(changeCents: number, format: (cents: number) => string): string {
  if (changeCents === 0) return 'No change this month';
  return changeCents > 0 ? `Up ${format(changeCents)} this month` : `Down ${format(-changeCents)} this month`;
}
