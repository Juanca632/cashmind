import {
  POCKET_EMOJI_MAX,
  POCKET_NAME_MAX,
  entryErrorMessage,
  entryTitle,
  isPocketColor,
  pocketBalances,
  pocketErrorMessage,
  pocketLabel,
  pocketsTotal,
  validatePocket,
  type Pocket,
} from '../rules';

describe('Create my pockets: validation (FR-001)', () => {
  it('a name and a starting amount of 0 or more are valid', () => {
    expect(validatePocket({ name: 'Japan trip', startingCents: 150000, emoji: '', color: 'blue' })).toEqual([]);
    expect(validatePocket({ name: 'Car', startingCents: 0, emoji: '', color: 'blue' })).toEqual([]);
  });

  it('Name required: empty or only spaces is "pocket-name", "Give the pocket a name."', () => {
    expect(validatePocket({ name: '', startingCents: 0, emoji: '', color: 'blue' })).toEqual(['pocket-name']);
    expect(validatePocket({ name: '   ', startingCents: 0, emoji: '', color: 'blue' })).toEqual(['pocket-name']);
    expect(pocketErrorMessage('pocket-name')).toBe('Give the pocket a name.');
  });

  it('the name is trimmed before it is measured: at most 40 characters', () => {
    expect(POCKET_NAME_MAX).toBe(40);
    expect(validatePocket({ name: 'a'.repeat(40), startingCents: 0, emoji: '', color: 'blue' })).toEqual([]);
    expect(validatePocket({ name: `  ${'a'.repeat(40)}  `, startingCents: 0, emoji: '', color: 'blue' })).toEqual([]);
    expect(validatePocket({ name: 'a'.repeat(41), startingCents: 0, emoji: '', color: 'blue' })).toEqual(['pocket-name']);
  });

  it('a starting amount above the app limit is refused with the same message as an entry', () => {
    expect(validatePocket({ name: 'Car', startingCents: 90_000_000_000, emoji: '', color: 'blue' })).toEqual([]);
    expect(validatePocket({ name: 'Car', startingCents: 90_000_000_001, emoji: '', color: 'blue' })).toEqual(['amount-too-large']);
    expect(pocketErrorMessage('amount-too-large')).toBe(entryErrorMessage('amount-too-large'));
  });

  it.each([-1, 12.5])('a starting amount of %p is refused', (startingCents) => {
    expect(validatePocket({ name: 'Car', startingCents, emoji: '', color: 'blue' })).not.toEqual([]);
  });
});

describe('Pocket balance (FR-002, SC-003)', () => {
  const japan: Pocket = { id: 1, name: 'Japan trip', startingCents: 150000, emoji: '', color: 'blue' };
  const car: Pocket = { id: 2, name: 'Car', startingCents: 0, emoji: '', color: 'blue' };
  const saving = (pocketId: number | null, amountCents: number, kind: 'savings' | 'expense' = 'savings') => ({ kind, pocketId, amountCents });

  it('is the starting amount plus every saving in the pocket: 1.500,00 + 200,00 = 1.700,00', () => {
    expect(pocketBalances([japan], [saving(1, 20000)])).toEqual([{ pocket: japan, cents: 170000, savedCents: 20000, spentCents: 0 }]);
  });

  it('with no savings it is the starting amount, and 0 when there is none', () => {
    expect(pocketBalances([japan, car], []).map((b) => b.cents)).toEqual([150000, 0]);
  });

  it('savings of other pockets and other kinds do not count; the order is the pockets order', () => {
    const balances = pocketBalances([car, japan], [saving(1, 100), saving(2, 7), saving(2, 3), saving(null, 5)]);
    expect(balances.map((b) => [b.pocket.name, b.cents])).toEqual([
      ['Car', 10],
      ['Japan trip', 150100],
    ]);
  });

  it('expenses paid from the pocket are subtracted: 1.700,00 - 35,00 = 1.665,00 (026 US1)', () => {
    const [b] = pocketBalances([japan], [saving(1, 20000), saving(1, 3500, 'expense')]);
    expect(b).toEqual({ pocket: japan, cents: 166500, savedCents: 20000, spentCents: 3500 });
  });

  it('an expense only lowers its own pocket; one paid from the month touches none', () => {
    const balances = pocketBalances([car, japan], [saving(1, 700, 'expense'), saving(null, 900, 'expense'), saving(2, 100)]);
    expect(balances.map((b) => [b.pocket.name, b.cents, b.spentCents])).toEqual([
      ['Car', 100, 0],
      ['Japan trip', 149300, 700],
    ]);
  });

  it('may go below zero: 100,00 - 150,00 = -50,00 (026 US2 scenario 4)', () => {
    const cars: Pocket = { id: 2, name: 'Car', startingCents: 0, emoji: '', color: 'blue' };
    const [b] = pocketBalances([cars], [saving(2, 10000), saving(2, 15000, 'expense')]);
    expect(b.cents).toBe(-5000);
  });

  it('the total adds negative balances too (026 US2 scenario 5)', () => {
    const balances = pocketBalances([japan, car], [saving(2, 5000, 'expense')]);
    expect(pocketsTotal(balances)).toBe(145000);
  });

  it('is exact to the cent', () => {
    expect(pocketBalances([car], [saving(2, 1), saving(2, 2), saving(2, 7)])[0].cents).toBe(10);
  });

  it('the total adds up every balance, and is 0 with no pockets', () => {
    expect(pocketsTotal(pocketBalances([japan, car], [saving(2, 5050)]))).toBe(155050);
    expect(pocketsTotal([])).toBe(0);
  });
});

describe('Titles of savings (Story 2, scenario 5)', () => {
  it('a saving with a note is titled with the note', () => {
    expect(entryTitle({ kind: 'savings', category: 'other', note: 'Bonus', pocketName: 'Japan trip' })).toBe('Bonus');
  });

  it('a saving with no note is titled with its pocket name', () => {
    expect(entryTitle({ kind: 'savings', category: 'other', note: '', pocketName: 'Japan trip' })).toBe('Japan trip');
  });

  it('a saving with neither reads "Savings"', () => {
    expect(entryTitle({ kind: 'savings', category: 'other', note: '', pocketName: null })).toBe('Savings');
  });

  it('other kinds are unchanged: Other reads its kind, a category reads its name', () => {
    expect(entryTitle({ kind: 'expense', category: 'other', note: '' })).toBe('Expense');
    expect(entryTitle({ kind: 'expense', category: 'groceries', note: '' })).toBe('Groceries');
    expect(entryTitle({ kind: 'income', category: 'salary', note: '' })).toBe('Salary');
  });
});

describe('Recognise each pocket: emoji and colour (027 Story 3, FR-004)', () => {
  const base = { name: 'Japan trip', startingCents: 0 };

  it('an empty emoji is valid, and so is one emoji or any text up to 8 characters', () => {
    expect(validatePocket({ ...base, emoji: '', color: 'blue' })).toEqual([]);
    expect(validatePocket({ ...base, emoji: '✈️', color: 'blue' })).toEqual([]);
    expect(validatePocket({ ...base, emoji: '12345678', color: 'blue' })).toEqual([]);
  });

  it('an emoji of more than 8 characters is refused with "Use one emoji."', () => {
    expect(validatePocket({ ...base, emoji: '123456789', color: 'blue' })).toEqual(['pocket-emoji']);
    expect(pocketErrorMessage('pocket-emoji')).toBe('Use one emoji.');
    expect(POCKET_EMOJI_MAX).toBe(8);
  });

  it('every colour of the palette is valid and any other is refused with "Pick a colour."', () => {
    for (const color of ['blue', 'indigo', 'purple', 'pink', 'orange', 'amber', 'green', 'slate'] as const) {
      expect(validatePocket({ ...base, emoji: '', color })).toEqual([]);
      expect(isPocketColor(color)).toBe(true);
    }
    expect(validatePocket({ ...base, emoji: '', color: 'red' as never })).toEqual(['pocket-color']);
    expect(pocketErrorMessage('pocket-color')).toBe('Pick a colour.');
    expect(isPocketColor('red')).toBe(false);
    expect(isPocketColor('')).toBe(false);
    expect(isPocketColor(undefined)).toBe(false);
  });

  it('pocketLabel is "<emoji> <name>", or just the name with no emoji', () => {
    expect(pocketLabel({ name: 'Japan trip', emoji: '✈️' })).toBe('✈️ Japan trip');
    expect(pocketLabel({ name: 'Japan trip', emoji: '' })).toBe('Japan trip');
  });
});
