/** How the month's savings goal is split into pockets (specs/030-split-savings). Pure logic, money in integer cents. */
import type { Entry } from '@/features/entries/rules';

type SavingLike = Pick<Entry, 'date' | 'kind' | 'amountCents' | 'pocketId'>;

/** What of the goal is still to put into pockets this month; never below 0. */
export function toSplit(goalCents: number, savedCents: number): number {
  return Math.max(goalCents - savedCents, 0);
}

/** The month's savings added up per pocket id. */
export function savedByPocket(entries: readonly SavingLike[], month: string): Map<number, number> {
  const byPocket = new Map<number, number>();
  for (const entry of entries) {
    if (entry.kind !== 'savings' || entry.pocketId === null || entry.date.slice(0, 7) !== month) continue;
    byPocket.set(entry.pocketId, (byPocket.get(entry.pocketId) ?? 0) + entry.amountCents);
  }
  return byPocket;
}

/** How the most recent month before `month` with savings split them per pocket; empty when there is none. */
export function previousSplit(entries: readonly SavingLike[], month: string): Map<number, number> {
  let latest: string | null = null;
  for (const entry of entries) {
    if (entry.kind !== 'savings' || entry.pocketId === null) continue;
    const entryMonth = entry.date.slice(0, 7);
    if (entryMonth < month && (latest === null || entryMonth > latest)) latest = entryMonth;
  }
  return latest === null ? new Map() : savedByPocket(entries, latest);
}

/**
 * Shares `amountCents` out over the pockets in their order, in the proportions of `previous`.
 * Each share is rounded down to the currency's smallest unit (`unitCents`: the cent, or the whole
 * peso) and the remainder goes to the first pocket with a share,
 * so the shares always add up to the amount. Pockets with no previous share get 0, and so do all
 * of them when nothing was split before.
 */
export function shareOut(
  amountCents: number,
  previous: ReadonlyMap<number, number>,
  pocketIds: readonly number[],
  unitCents = 1,
): number[] {
  const weights = pocketIds.map((id) => Math.max(previous.get(id) ?? 0, 0));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0 || amountCents <= 0) return pocketIds.map(() => 0);
  // BigInt: amount × weight can pass the largest exact number for big amounts.
  const unit = BigInt(unitCents);
  const shares = weights.map((weight) => Number(((BigInt(amountCents) * BigInt(weight)) / BigInt(total) / unit) * unit));
  const first = weights.findIndex((weight) => weight > 0);
  shares[first] += amountCents - shares.reduce((sum, share) => sum + share, 0);
  return shares;
}
