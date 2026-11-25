import {
  POCKET_NAME_MAX,
  entryErrorMessage,
  entryTitle,
  pocketBalances,
  pocketErrorMessage,
  pocketsTotal,
  validatePocket,
  type Pocket,
} from '../rules';

describe('Create my pockets: validation (FR-001)', () => {
  it('a name and a starting amount of 0 or more are valid', () => {
    expect(validatePocket({ name: 'Japan trip', startingCents: 150000 })).toEqual([]);
    expect(validatePocket({ name: 'Car', startingCents: 0 })).toEqual([]);
  });

  it('Name required: empty or only spaces is "pocket-name", "Give the pocket a name."', () => {
    expect(validatePocket({ name: '', startingCents: 0 })).toEqual(['pocket-name']);
    expect(validatePocket({ name: '   ', startingCents: 0 })).toEqual(['pocket-name']);
    expect(pocketErrorMessage('pocket-name')).toBe('Give the pocket a name.');
  });

  it('the name is trimmed before it is measured: at most 40 characters', () => {
    expect(POCKET_NAME_MAX).toBe(40);
    expect(validatePocket({ name: 'a'.repeat(40), startingCents: 0 })).toEqual([]);
    expect(validatePocket({ name: `  ${'a'.repeat(40)}  `, startingCents: 0 })).toEqual([]);
    expect(validatePocket({ name: 'a'.repeat(41), startingCents: 0 })).toEqual(['pocket-name']);
  });

  it('a starting amount above the app limit is refused with the same message as an entry', () => {
    expect(validatePocket({ name: 'Car', startingCents: 90_000_000_000 })).toEqual([]);
    expect(validatePocket({ name: 'Car', startingCents: 90_000_000_001 })).toEqual(['amount-too-large']);
    expect(pocketErrorMessage('amount-too-large')).toBe(entryErrorMessage('amount-too-large'));
  });

  it.each([-1, 12.5])('a starting amount of %p is refused', (startingCents) => {
    expect(validatePocket({ name: 'Car', startingCents })).not.toEqual([]);
  });
});

describe('Pocket balance (FR-002, SC-003)', () => {
  const japan: Pocket = { id: 1, name: 'Japan trip', startingCents: 150000 };
  const car: Pocket = { id: 2, name: 'Car', startingCents: 0 };
  const saving = (pocketId: number | null, amountCents: number, kind: 'savings' | 'expense' = 'savings') => ({ kind, pocketId, amountCents });

  it('is the starting amount plus every saving in the pocket: 1.500,00 + 200,00 = 1.700,00', () => {
    expect(pocketBalances([japan], [saving(1, 20000)])).toEqual([{ pocket: japan, cents: 170000 }]);
  });

  it('with no savings it is the starting amount, and 0 when there is none', () => {
    expect(pocketBalances([japan, car], []).map((b) => b.cents)).toEqual([150000, 0]);
  });

  it('savings of other pockets and other kinds do not count; the order is the pockets order', () => {
    const balances = pocketBalances([car, japan], [saving(1, 100), saving(2, 7), saving(2, 3), saving(2, 999, 'expense'), saving(null, 5)]);
    expect(balances.map((b) => [b.pocket.name, b.cents])).toEqual([
      ['Car', 10],
      ['Japan trip', 150100],
    ]);
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
