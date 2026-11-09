/** Pure logic of the plan form: moving between what the user types and plan values. */
import { wholePercent, type Amount, type FixedItem } from '@/features/plan/rules';
import { centsToInput, formatPercentOf, parseEurosToCents, parsePercent } from '@/shared/money';

/** One row of the fixed expenses editor, as typed. `key` only identifies the row on screen. */
export type ItemDraft = { key: number; name: string; amountText: string };

export function itemDrafts(items: readonly FixedItem[]): ItemDraft[] {
  if (items.length === 0) return [{ key: 1, name: '', amountText: '' }];
  return items.map((item, index) => ({ key: index + 1, name: item.name, amountText: centsToInput(item.amountCents) }));
}

export function isBlankDraft(draft: ItemDraft): boolean {
  return draft.name.trim() === '' && draft.amountText.trim() === '';
}

export function draftToItem(draft: ItemDraft): FixedItem {
  return { name: draft.name, amountCents: parseEurosToCents(draft.amountText) ?? 0 };
}

/** The items to save. A row left completely empty is not an item. */
export function draftsToItems(drafts: readonly ItemDraft[]): FixedItem[] {
  return drafts.filter((draft) => !isBlankDraft(draft)).map(draftToItem);
}

/** A saved share as the whole percentage shown in the form; euro amounts open at the nearest one, if an income is known. */
export function keptPercentText(amount: Amount, incomeCents: number): string {
  if (amount.unit === 'eur' && incomeCents === 0) return '';
  return String(wholePercent(amount, incomeCents));
}

export function parsePercentField(text: string): Amount {
  return { unit: 'pct', pct: parsePercent(text) ?? Number.NaN };
}

/** A share of the income as field text, e.g. "28,5". */
export function shareText(cents: number, incomeCents: number): string {
  return formatPercentOf(cents, incomeCents).replace(' %', '');
}
