import { entriesOfKind, firstEntries, HOME_LIST_SIZE, isEntryKind } from '../rules';

const list = [
  { id: 1, kind: 'expense' },
  { id: 2, kind: 'income' },
  { id: 3, kind: 'expense' },
  { id: 4, kind: 'savings' },
  { id: 5, kind: 'expense' },
] as const;

describe('Home stays short', () => {
  it('Five newest: home lists 5 entries', () => {
    expect(HOME_LIST_SIZE).toBe(5);
  });

  it('Few entries: 5 or fewer are all shown, and the total is their count', () => {
    expect(firstEntries(list, HOME_LIST_SIZE)).toEqual({ shown: [...list], total: 5 });
    expect(firstEntries([], HOME_LIST_SIZE)).toEqual({ shown: [], total: 0 });
  });

  it('Five newest: with 12 entries the first 5 in the same order are shown and the total is 12', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }));
    const result = firstEntries(twelve, HOME_LIST_SIZE);
    expect(result.shown.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);
    expect(result.total).toBe(12);
  });

  it('firstEntries does not change its input', () => {
    const input = [{ id: 1 }, { id: 2 }, { id: 3 }];
    firstEntries(input, 2);
    expect(input).toHaveLength(3);
  });
});

describe('Filter by kind on the Activity screen', () => {
  it('Switch filter: only the entries of that kind, in the same order', () => {
    expect(entriesOfKind(list, 'expense').map((e) => e.id)).toEqual([1, 3, 5]);
    expect(entriesOfKind(list, 'income').map((e) => e.id)).toEqual([2]);
    expect(entriesOfKind(list, 'savings').map((e) => e.id)).toEqual([4]);
  });

  it('All keeps every entry, in a new array', () => {
    const all = entriesOfKind(list, null);
    expect(all).toEqual([...list]);
    expect(all).not.toBe(list);
  });

  it('Empty filter: a kind with no entries gives an empty list', () => {
    expect(entriesOfKind([{ id: 1, kind: 'income' }], 'savings')).toEqual([]);
  });

  it('Params fallback: only income, savings and expense are kinds', () => {
    for (const kind of ['income', 'savings', 'expense']) expect(isEntryKind(kind)).toBe(true);
    for (const bad of ['fixed', 'leisure', 'Income', '', undefined, null, 3, ['expense'], {}]) {
      expect(isEntryKind(bad)).toBe(false);
    }
  });
});
