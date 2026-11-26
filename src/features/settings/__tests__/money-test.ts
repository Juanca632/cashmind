import { AMOUNT_TOO_LARGE, CURRENCIES, CURRENCY_NAMES, isValidCents, moneyFor, splitFraction } from '@/shared/money';

const flat = (text: string) => text.replace(/[\s  ]/g, ' ');

describe('Keep my budget in my own currency: formats (FR-003)', () => {
  it('offers exactly Euro, US dollar and Colombian peso', () => {
    expect([...CURRENCIES]).toEqual(['EUR', 'USD', 'COP']);
    expect(CURRENCY_NAMES).toEqual({ EUR: 'Euro', USD: 'US dollar', COP: 'Colombian peso' });
  });

  it('Euro: 123456 hundredths is "1 234,56 €" and whole 300000 is "3 000 €" when compact', () => {
    const eur = moneyFor('EUR');
    expect(flat(eur.format(123456))).toBe('1 234,56 €');
    expect(flat(eur.format(300000))).toBe('3 000,00 €');
    expect(flat(eur.formatCompact(300000))).toBe('3 000 €');
    expect(flat(eur.formatCompact(123456))).toBe('1 234,56 €');
  });

  it('US dollar: "$1,234.56" and compact "$3,000"', () => {
    const usd = moneyFor('USD');
    expect(flat(usd.format(123456))).toBe('$1,234.56');
    expect(flat(usd.formatCompact(300000))).toBe('$3,000');
    expect(flat(usd.formatCompact(123456))).toBe('$1,234.56');
  });

  it('Colombian peso: whole amounts have no decimals, "$ 1.234.567"', () => {
    const cop = moneyFor('COP');
    expect(flat(cop.format(123456700))).toBe('$ 1.234.567');
    expect(flat(cop.format(300000))).toBe('$ 3.000');
    expect(flat(cop.formatCompact(300000))).toBe('$ 3.000');
    expect(flat(cop.format(5000))).toBe('$ 50');
  });

  it('Colombian peso: an amount with cents is cut towards zero, "$ 12" and "$ 1.234"', () => {
    const cop = moneyFor('COP');
    expect(flat(cop.format(123456))).toBe('$ 1.234');
    expect(flat(cop.format(1250))).toBe('$ 12');
    expect(flat(cop.formatCompact(1250))).toBe('$ 12');
    expect(flat(cop.format(1299))).toBe('$ 12');
  });

  it('Colombian peso: a negative amount with cents is cut towards zero, "- $ 100"', () => {
    const cop = moneyFor('COP');
    expect(flat(cop.format(-10050))).toMatch(/^[-−] ?\$ 100$/);
    expect(flat(cop.formatCompact(-10050))).toMatch(/^[-−] ?\$ 100$/);
  });

  it('Colombian peso: less than one peso shows as "$ 0"', () => {
    expect(flat(moneyFor('COP').format(99))).toBe('$ 0');
  });

  it('unitCents is 100 for pesos and 1 for Euro and US dollar', () => {
    expect(moneyFor('COP').unitCents).toBe(100);
    expect(moneyFor('EUR').unitCents).toBe(1);
    expect(moneyFor('USD').unitCents).toBe(1);
  });

  it('Zero is shown in each currency', () => {
    expect(flat(moneyFor('EUR').format(0))).toBe('0,00 €');
    expect(flat(moneyFor('USD').format(0))).toBe('$0.00');
    expect(flat(moneyFor('COP').format(0))).toBe('$ 0');
  });
});

describe('Type amounts in that currency: field settings (FR-004)', () => {
  it.each([
    ['EUR', '€', false, '0,00', 'decimal-pad'],
    ['USD', '$', true, '0.00', 'decimal-pad'],
    ['COP', '$', true, '0', 'number-pad'],
  ] as const)('%s: symbol %s (first: %s), placeholder %s, keyboard %s', (code, symbol, first, placeholder, keyboard) => {
    const money = moneyFor(code);
    expect(money.symbol).toBe(symbol);
    expect(money.symbolFirst).toBe(first);
    expect(money.placeholder).toBe(placeholder);
    expect(money.keyboard).toBe(keyboard);
  });
});

describe('Type amounts in that currency: reading what is typed', () => {
  it.each(['EUR', 'USD'] as const)('Euro and dollar decimals: %s reads "12,50" and "12.50" as 1250', (code) => {
    expect(moneyFor(code).parse('12,50')).toBe(1250);
    expect(moneyFor(code).parse('12.50')).toBe(1250);
    expect(moneyFor(code).parse('12,5')).toBe(1250);
    expect(moneyFor(code).parse('45000')).toBe(4500000);
  });

  it.each(['EUR', 'USD'] as const)('%s rejects text that is not an amount', (code) => {
    for (const text of ['', '   ', '-10', 'abc', '10,123', '1,2,3']) expect(moneyFor(code).parse(text)).toBeNull();
  });

  it('Pesos: "45000" and "45.000" are both $ 45.000 (4 500 000 hundredths)', () => {
    const cop = moneyFor('COP');
    expect(cop.parse('45000')).toBe(4500000);
    expect(cop.parse('45.000')).toBe(4500000);
    expect(cop.parse('1.234.567')).toBe(123456700);
    expect(cop.parse('0')).toBe(0);
  });

  it('Pesos: an amount with cents keeps them, "12,50" is 1250', () => {
    expect(moneyFor('COP').parse('12,50')).toBe(1250);
  });

  it('Pesos reject text that is not an amount', () => {
    for (const text of ['', '   ', '-10', 'abc', '1,2,3', '10,123']) expect(moneyFor('COP').parse(text)).toBeNull();
  });
});

describe('Type amounts in that currency: editing text (US2 scenario 3)', () => {
  it('Euro 1250 is "12,50" and 4500000 is "45000,00"', () => {
    expect(moneyFor('EUR').toInput(1250)).toBe('12,50');
    expect(moneyFor('EUR').toInput(4500000)).toBe('45000,00');
  });

  it('US dollar 1250 is "12.50" and 4500000 is "45000.00"', () => {
    expect(moneyFor('USD').toInput(1250)).toBe('12.50');
    expect(moneyFor('USD').toInput(4500000)).toBe('45000.00');
  });

  it('Colombian peso 1250 is "12,50" and 4500000 is "45000"', () => {
    expect(moneyFor('COP').toInput(1250)).toBe('12,50');
    expect(moneyFor('COP').toInput(4500000)).toBe('45000');
  });

  it.each(CURRENCIES)('%s: what is shown for editing reads back to the same amount', (code) => {
    for (const cents of [1, 1250, 4500000, 123456]) expect(moneyFor(code).parse(moneyFor(code).toInput(cents))).toBe(cents);
  });
});

describe('Type amounts in that currency: limit (FR-006)', () => {
  it('900 000 000 units (90 000 000 000 hundredths) is valid and one hundredth more is not', () => {
    expect(isValidCents(90_000_000_000)).toBe(true);
    expect(isValidCents(90_000_000_001)).toBe(false);
    expect(isValidCents(0)).toBe(true);
    expect(isValidCents(-1)).toBe(false);
    expect(isValidCents(12.5)).toBe(false);
  });

  it('the message is "This amount is too large."', () => {
    expect(AMOUNT_TOO_LARGE).toBe('This amount is too large.');
  });

  it.each(CURRENCIES)('%s can read the largest amount typed', (code) => {
    const money = moneyFor(code);
    expect(money.parse(money.toInput(90_000_000_000))).toBe(90_000_000_000);
  });
});

describe('Splitting the decimals off a shown amount', () => {
  it('splits at the decimal mark of the currency', () => {
    expect(splitFraction(moneyFor('EUR'), '1 234,56 €')).toEqual(['1 234', ',56 €']);
    expect(splitFraction(moneyFor('USD'), '$1,234.56')).toEqual(['$1,234', '.56']);
    expect(splitFraction(moneyFor('COP'), '$ 1.234,56')).toEqual(['$ 1.234', ',56']);
  });

  it('has no fraction when there is no decimal mark', () => {
    expect(splitFraction(moneyFor('COP'), '$ 45.000')).toEqual(['$ 45.000', null]);
    expect(splitFraction(moneyFor('EUR'), '3 000 €')).toEqual(['3 000 €', null]);
  });
});
