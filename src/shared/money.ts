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
  /** Hundredths as editable text, e.g. 1250 → '12,50'. */
  toInput: (cents: number) => string;
  decimalMark: ',' | '.';
  symbol: string;
  /** True when the symbol goes before the amount ('$12'), false when after ('12 €'). */
  symbolFirst: boolean;
  placeholder: string;
  keyboard: 'decimal-pad' | 'number-pad';
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

/** Accepts "2500", "2500,5", "2 500,50" or "2500.50": one "," or "." as the decimal mark, at most 2 decimals. */
function parseDecimal(text: string): number | null {
  const normalized = text.replace(/[\s\u00a0\u202f€$]/g, '').replace(',', '.');
  return hundredths(/^(\d+)(?:\.(\d{0,2}))?$/.exec(normalized));
}

/** Pesos: whole numbers with or without "." between thousands; "," only for decimals. */
function parsePesos(text: string): number | null {
  const normalized = text.replace(/[\s\u00a0\u202f$.]/g, '');
  return hundredths(/^(\d+)(?:,(\d{0,2}))?$/.exec(normalized));
}

function hundredths(match: RegExpExecArray | null): number | null {
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

const withDecimals = (cents: number, mark: string) =>
  `${Math.trunc(cents / 100)}${mark}${String(cents % 100).padStart(2, '0')}`;

const euro = formatters('fr-FR', 'EUR');
const dollar = formatters('en-US', 'USD');
const peso = formatters('es-CO', 'COP');

const MONEY: Record<Currency, Money> = {
  EUR: {
    currency: 'EUR',
    ...euro,
    parse: parseDecimal,
    toInput: (cents) => withDecimals(cents, ','),
    decimalMark: ',',
    symbol: '€',
    symbolFirst: false,
    placeholder: '0,00',
    keyboard: 'decimal-pad',
  },
  USD: {
    currency: 'USD',
    ...dollar,
    parse: parseDecimal,
    toInput: (cents) => withDecimals(cents, '.'),
    decimalMark: '.',
    symbol: '$',
    symbolFirst: true,
    placeholder: '0.00',
    keyboard: 'decimal-pad',
  },
  COP: {
    currency: 'COP',
    // Pesos have no decimals; an amount with cents (recorded before a switch) keeps them.
    format: peso.formatCompact,
    formatCompact: peso.formatCompact,
    parse: parsePesos,
    toInput: (cents) => (isWhole(cents) ? String(cents / 100) : withDecimals(cents, ',')),
    decimalMark: ',',
    symbol: '$',
    symbolFirst: true,
    placeholder: '0',
    keyboard: 'number-pad',
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
