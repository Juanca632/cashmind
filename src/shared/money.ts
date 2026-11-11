/** Money conversion and formatting. All amounts are integer cents. */

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

const percentFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function formatEuros(cents: number): string {
  return euroFormatter.format(cents / 100);
}

const wholeEuroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** Like formatEuros, without the decimals of a whole amount: '3 000 €', '12,50 €'. */
export function formatEurosCompact(cents: number): string {
  return cents % 100 === 0 ? wholeEuroFormatter.format(cents / 100) : formatEuros(cents);
}

/**
 * Largest amount the app accepts: 900 000,00 €. Keeps every value and calculation within exact
 * integer arithmetic, so what is saved can always be read back.
 */
const MAX_CENTS = 90_000_000;

export const AMOUNT_TOO_LARGE = `Amounts cannot be above ${formatEuros(MAX_CENTS)}.`;

export function isValidCents(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS;
}

/** Share of `totalCents` as a display string like "37 %" or "37,5 %". */
export function formatPercentOf(cents: number, totalCents: number): string {
  const pct = totalCents > 0 ? (cents / totalCents) * 100 : 0;
  return `${percentFormatter.format(pct)} %`;
}

/**
 * Parses user input like "2500", "2500,5", "2 500,50" or "2500.50" into cents.
 * Returns null when the text is not a valid non-negative amount with at most 2 decimals.
 */
export function parseEurosToCents(text: string): number | null {
  const normalized = text.replace(/[\s\u00a0\u202f€]/g, '').replace(',', '.');
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(normalized);
  if (!match) return null;
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  return euros * 100 + cents;
}

/** Cents as editable text, e.g. 1250 → '12,50'. */
export function centsToInput(cents: number): string {
  return `${Math.trunc(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}

/** Parses a whole percentage 0–100 ("30", "30 %"); null otherwise. */
export function parsePercent(text: string): number | null {
  const normalized = text.replace(/[\s%]/g, '');
  if (!/^\d{1,3}$/.test(normalized)) return null;
  const pct = Number(normalized);
  return pct <= 100 ? pct : null;
}
