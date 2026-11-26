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
  it('Euro decimals: reads "12,50" and "12.50" as 1250', () => {
    expect(moneyFor('EUR').parse('12,50')).toBe(1250);
    expect(moneyFor('EUR').parse('12.50')).toBe(1250);
    expect(moneyFor('EUR').parse('12,5')).toBe(1250);
    expect(moneyFor('EUR').parse('45000')).toBe(4500000);
  });

  it('US dollar: "." is the decimal mark and "," only separates thousands (FR-002)', () => {
    const usd = moneyFor('USD');
    expect(usd.parse('12.50')).toBe(1250);
    expect(usd.parse('12.5')).toBe(1250);
    expect(usd.parse('45000')).toBe(4500000);
    expect(usd.parse('1,234.50')).toBe(123450);
    expect(usd.parse('12,345')).toBe(1234500);
    expect(usd.parse('1,500,000')).toBe(150000000);
  });

  it('Euro reads grouped and ungrouped text alike', () => {
    const eur = moneyFor('EUR');
    expect(eur.parse('1 234,50')).toBe(123450);
    expect(eur.parse('1234,50')).toBe(123450);
    expect(eur.parse('1 500 000')).toBe(150000000);
  });

  it.each(['EUR', 'USD'] as const)('%s rejects text that is not an amount', (code) => {
    for (const text of ['', '   ', '-10', 'abc', '10.123.4x']) expect(moneyFor(code).parse(text)).toBeNull();
  });

  it('Euro rejects three decimals with the comma', () => {
    expect(moneyFor('EUR').parse('10,123')).toBeNull();
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
  it('Euro 1250 is "12,50" and 4500000 is "45 000,00"', () => {
    expect(moneyFor('EUR').toInput(1250)).toBe('12,50');
    expect(moneyFor('EUR').toInput(4500000)).toBe('45 000,00');
    expect(moneyFor('EUR').toInput(123450)).toBe('1 234,50');
  });

  it('US dollar 1250 is "12.50" and 4500000 is "45,000.00"', () => {
    expect(moneyFor('USD').toInput(1250)).toBe('12.50');
    expect(moneyFor('USD').toInput(4500000)).toBe('45,000.00');
    expect(moneyFor('USD').toInput(123450)).toBe('1,234.50');
  });

  it('Colombian peso 1250 is "12,50" and 4500000 is "45.000"', () => {
    expect(moneyFor('COP').toInput(1250)).toBe('12,50');
    expect(moneyFor('COP').toInput(4500000)).toBe('45.000');
    expect(moneyFor('COP').toInput(123456700)).toBe('1.234.567');
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

describe('Read a big amount while typing it: groupInput (033)', () => {
  const eur = moneyFor('EUR').groupInput;
  const usd = moneyFor('USD').groupInput;
  const cop = moneyFor('COP').groupInput;
  const flatten = (text: string) => text.replace(/[\u00a0\u202f]/g, ' ');

  it('Pesos: 1500000 shows "1.500.000"', () => {
    expect(cop('1500000')).toBe('1.500.000');
  });

  it('Euro: 1500000,5 shows "1 500 000,5" with a plain space', () => {
    expect(eur('1500000,5')).toBe('1 500 000,5');
    expect(eur('1500000,5')).toContain(' ');
  });

  it('Euro: "." as the decimal mark shows ","', () => {
    expect(eur('12.5')).toBe('12,5');
    expect(eur('1234.50')).toBe('1 234,50');
  });

  it('Dollar: 1500000.5 shows "1,500,000.5"', () => {
    expect(usd('1500000.5')).toBe('1,500,000.5');
  });

  it('As you type: each digit regroups, and deleting regroups too', () => {
    expect(eur('1234')).toBe('1 234');
    expect(eur('1 2345')).toBe('12 345');
    expect(eur('12 34')).toBe('1 234');
    expect(usd('1,2345')).toBe('12,345');
    expect(cop('1.2345')).toBe('12.345');
  });

  it('Two decimals: a third decimal is not added', () => {
    expect(eur('12,345')).toBe('12,34');
    expect(usd('12.345')).toBe('12.34');
    expect(cop('12,345')).toBe('12,34');
  });

  it('Leading zeros: "007" shows "7" and ",5" shows "0,5"', () => {
    expect(eur('007')).toBe('7');
    expect(eur(',5')).toBe('0,5');
    expect(usd('.5')).toBe('0.5');
    expect(usd('007')).toBe('7');
    expect(cop('007')).toBe('7');
  });

  it('Dollar comma: "," is never the decimal mark, deleting a digit of "12,345" gives "1,234"', () => {
    expect(usd('12,345')).toBe('12,345');
    expect(usd('12,34')).toBe('1,234');
  });

  it('Not an amount: text stays as typed', () => {
    expect(eur('abc')).toBe('abc');
    expect(usd('1x')).toBe('1x');
  });

  it('empty text stays empty', () => {
    expect(eur('')).toBe('');
  });

  it('Saved value: grouped text reads as the typed amount in every currency', () => {
    expect(moneyFor('EUR').parse(eur('1500000,5'))).toBe(150000050);
    expect(moneyFor('USD').parse(usd('1500000.5'))).toBe(150000050);
    expect(moneyFor('COP').parse(cop('1500000'))).toBe(150000000);
    expect(flatten(moneyFor('EUR').toInput(150000050))).toBe('1 500 000,50');
  });

  it('Limit: 900 000 000,00 still groups and reads', () => {
    expect(eur('900000000,00')).toBe('900 000 000,00');
    expect(moneyFor('EUR').parse('900 000 000,00')).toBe(90000000000);
  });
});
