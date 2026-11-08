/** Pure logic of the plan form: moving between what the user types and plan amounts. */
import { convertAmount, resolveAmount, type Amount } from '@/features/plan/rules';
import { centsToInput, formatEuros, formatPercentOf, parseEurosToCents, parsePercent } from '@/shared/money';

export type Unit = Amount['unit'];

/** `previous` is the text in the other unit before the last toggle, restored when toggling back unedited. */
export type FieldState = { unit: Unit; text: string; previous?: string };

export function amountToText(amount: Amount): string {
  return amount.unit === 'eur' ? centsToInput(amount.cents) : String(amount.pct);
}

export function parseField(field: FieldState): Amount | null {
  if (field.unit === 'eur') {
    const cents = parseEurosToCents(field.text);
    return cents === null ? null : { unit: 'eur', cents };
  }
  const pct = parsePercent(field.text);
  return pct === null ? null : { unit: 'pct', pct };
}

/** Switches a field's unit. Toggling back without editing restores exactly what was typed. */
export function toggleUnit(field: FieldState, unit: Unit, incomeCents: number | null): FieldState {
  if (unit === field.unit) return field;
  if (field.previous !== undefined) return { unit, text: field.previous, previous: field.text };
  const amount = parseField(field);
  // Without a valid value or income there is nothing to convert: keep the text as typed.
  const text = amount && incomeCents ? amountToText(convertAmount(amount, incomeCents)) : field.text;
  return { unit, text, previous: field.text };
}

/** Euro cents expressed in the given unit, for the automatic field. */
export function centsIn(unit: Unit, cents: number, incomeCents: number): Amount {
  const amount: Amount = { unit: 'eur', cents };
  return unit === 'eur' ? amount : convertAmount(amount, incomeCents);
}

/** The value in the other unit, shown under a field. */
export function otherUnitHint(amount: Amount | null, incomeCents: number | null): string | undefined {
  if (!amount || !incomeCents) return undefined;
  const cents = resolveAmount(amount, incomeCents);
  return amount.unit === 'eur' ? `${formatPercentOf(cents, incomeCents)} of your income` : `= ${formatEuros(cents)}`;
}
