/** Money conversion and formatting. All amounts are integer cents. */

export const CURRENCIES = ['EUR', 'USD', 'COP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_NAMES: Record<Currency, string> = {
  EUR: 'Euro',
  USD: 'US dollar',
  COP: 'Colombian peso',
};

/** How one currency shows, reads and edits amounts. Amounts are always integer hundredths. */
export type Money = {
  currency: Currency;
  format: (cents: number) => string;
  /** Like format, without the decimals of a whole amount: '3 000 €', '12,50 €'. */
  formatCompact: (cents: number) => string;
  /** Reads typed text into hundredths; null when it is not a valid non-negative amount. */
  parse: (text: string) => number | null;
  /** Hundredths as editable text, thousands separated, e.g. 123450 → '1 234,50'. */
  toInput: (cents: number) => string;
  /** Typed text rewritten with thousands separated, as the amount fields show it while typing. */
  groupInput: (text: string) => string;
  decimalMark: ',' | '.';
  symbol: string;
  /** True when the symbol goes before the amount ('$12'), false when after ('12 €'). */
  symbolFirst: boolean;
  placeholder: string;
  keyboard: 'decimal-pad' | 'number-pad';
  /** The smallest amount the currency shows, in hundredths: 100 for pesos (no cents), else 1. */
  unitCents: number;
};

const isWhole = (cents: number) => cents % 100 === 0;

function formatters(locale: string, currency: Currency) {
  const exact = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const whole = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return {
    format: (cents: number) => exact.format(cents / 100),
    formatCompact: (cents: number) => (isWhole(cents) ? whole.format(cents / 100) : exact.format(cents / 100)),
  };
}

/**
 * How a currency's amount is typed (specs/033-amount-grouping): its decimal mark, another mark also
 * read as the decimal mark when it ends the text with at most two digits after it, and the
 * separator put between thousands while typing.
 */
type InputStyle = { mark: ',' | '.'; alternate: ',' | '.' | null; group: string };

const EURO_INPUT: InputStyle = { mark: ',', alternate: '.', group: ' ' };
// In dollars "," only separates thousands: read as a decimal mark, deleting a digit of "12,345" would
// turn it into 12.34.
const DOLLAR_INPUT: InputStyle = { mark: '.', alternate: null, group: ',' };
const PESO_INPUT: InputStyle = { mark: ',', alternate: null, group: '.' };

/**
 * Splits typed text into its whole digits and its decimals (null when there is no decimal mark).
 * Spaces, symbols and thousands separators are ignored; null when anything else is in it.
 */
function readInput(text: string, style: InputStyle): { whole: string; fraction: string | null } | null {
  const compact = text.replace(/[\s\u00a0\u202f€$]/g, '');
  if (compact === '') return null;
  let at = compact.lastIndexOf(style.mark);
  if (at === -1 && style.alternate !== null) {
    const alternateAt = compact.lastIndexOf(style.alternate);
    if (alternateAt !== -1 && /^\d{0,2}$/.test(compact.slice(alternateAt + 1))) at = alternateAt;
  }
  const wholeText = at === -1 ? compact : compact.slice(0, at);
  const fraction = at === -1 ? null : compact.slice(at + 1);
  const separators = new Set([style.group.trim(), style.alternate].filter((mark) => mark));
  const whole = [...wholeText].filter((char) => !separators.has(char)).join('');
  if (!/^\d*$/.test(whole) || (fraction !== null && !/^\d*$/.test(fraction))) return null;
  if (whole === '' && fraction === null) return null;
  return { whole, fraction };
}

/** Reads typed text into hundredths: at most two decimals; null when it is not an amount. */
function parseWith(style: InputStyle) {
  return (text: string): number | null => {
    const read = readInput(text, style);
    if (!read || (read.fraction !== null && read.fraction.length > 2)) return null;
    return Number(read.whole === '' ? '0' : read.whole) * 100 + Number((read.fraction ?? '').padEnd(2, '0'));
  };
}

/**
 * Rewrites typed text the way the currency shows amounts: thousands separated, the decimal mark
 * the currency's own, at most two decimals, no leading zeros. Text that is not an amount stays as
 * typed, so the field can say why.
 */
function groupWith(style: InputStyle) {
  return (text: string): string => {
    const read = readInput(text, style);
    if (!read) return text.trim() === '' ? '' : text;
    const digits = read.whole.replace(/^0+(?=\d)/, '') || (read.fraction === null ? '' : '0');
    const whole = digits.replace(/\B(?=(\d{3})+(?!\d))/g, style.group);
    return read.fraction === null ? whole : `${whole}${style.mark}${read.fraction.slice(0, 2)}`;
  };
}

const withDecimals = (cents: number, mark: string) =>
  `${Math.trunc(cents / 100)}${mark}${String(cents % 100).padStart(2, '0')}`;

/** Hundredths cut to whole pesos, towards zero, so -100,50 shows as -100. */
const wholePesos = (cents: number) => Math.trunc(cents / 100) * 100;

const euro = formatters('fr-FR', 'EUR');
const dollar = formatters('en-US', 'USD');
const peso = formatters('es-CO', 'COP');

const MONEY: Record<Currency, Money> = {
  EUR: {
    currency: 'EUR',
    ...euro,
    parse: parseWith(EURO_INPUT),
    toInput: (cents) => groupWith(EURO_INPUT)(withDecimals(cents, ',')),
    groupInput: groupWith(EURO_INPUT),
    decimalMark: ',',
    symbol: '€',
    symbolFirst: false,
    placeholder: '0,00',
    keyboard: 'decimal-pad',
    unitCents: 1,
  },
  USD: {
    currency: 'USD',
    ...dollar,
    parse: parseWith(DOLLAR_INPUT),
    toInput: (cents) => groupWith(DOLLAR_INPUT)(withDecimals(cents, '.')),
    groupInput: groupWith(DOLLAR_INPUT),
    decimalMark: '.',
    symbol: '$',
    symbolFirst: true,
    placeholder: '0.00',
    keyboard: 'decimal-pad',
    unitCents: 1,
  },
  COP: {
    currency: 'COP',
    // Pesos have no decimals: every figure shows whole pesos, cut towards zero (specs/032-whole-pesos).
    format: (cents) => peso.formatCompact(wholePesos(cents)),
    formatCompact: (cents) => peso.formatCompact(wholePesos(cents)),
    parse: parseWith(PESO_INPUT),
    toInput: (cents) => groupWith(PESO_INPUT)(isWhole(cents) ? String(cents / 100) : withDecimals(cents, ',')),
    groupInput: groupWith(PESO_INPUT),
    decimalMark: ',',
    symbol: '$',
    symbolFirst: true,
    placeholder: '0',
    keyboard: 'number-pad',
    unitCents: 100,
  },
};

export function moneyFor(currency: Currency): Money {
  return MONEY[currency];
}

/** Splits a formatted amount at its decimal mark: '1 234,56 €' → ['1 234', ',56 €']; no fraction → null. */
export function splitFraction(money: Money, text: string): [string, string | null] {
  const at = text.lastIndexOf(money.decimalMark);
  return at === -1 ? [text, null] : [text.slice(0, at), text.slice(at)];
}

/**
 * Largest amount the app accepts, in any currency: 900 000 000. Keeps every value and sum within
 * exact integer arithmetic, so what is saved can always be read back.
 */
const MAX_CENTS = 90_000_000_000;

export const AMOUNT_TOO_LARGE = 'This amount is too large.';

export function isValidCents(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS;
}

/** Parses a whole percentage 0–100 ("30", "30 %"); null otherwise. */
export function parsePercent(text: string): number | null {
  const normalized = text.replace(/[\s%]/g, '');
  if (!/^\d{1,3}$/.test(normalized)) return null;
  const pct = Number(normalized);
  return pct <= 100 ? pct : null;
}
