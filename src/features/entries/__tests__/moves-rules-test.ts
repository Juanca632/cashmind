import {
  mergeByDate,
  moveTitle,
  moveTooMuch,
  movedIntoMain,
  pocketBalances,
  pocketsTotal,
  validateMove,
  type Entry,
  type Move,
  type Pocket,
} from '../rules';

const TODAY = new Date(2026, 10, 25, 12);

const emergency: Pocket = { id: 1, name: 'Emergency fund', startingCents: 100000, emoji: '', color: 'blue' };
const japan: Pocket = { id: 2, name: 'Japan trip', startingCents: 50000, emoji: '', color: 'pink' };

const move = (over: Partial<Move> = {}): Move => ({
  id: 1,
  date: '2026-11-10',
  amountCents: 30000,
  note: '',
  fromPocketId: 1,
  fromName: 'Emergency fund',
  fromEmoji: '',
  toPocketId: null,
  toName: null,
  toEmoji: null,
  ...over,
});
const toJapan = (over: Partial<Move> = {}) => move({ toPocketId: 2, toName: 'Japan trip', toEmoji: '', ...over });

const input = { date: '2026-11-10', amountCents: 30000, note: '', fromPocketId: 1, toPocketId: null as number | null };

describe('Take money out of a pocket: validateMove (Edge cases: Amount, FR-001)', () => {
  it('a move of 300,00 € today, to Main or to another pocket, is valid', () => {
    expect(validateMove(input, TODAY)).toEqual([]);
    expect(validateMove({ ...input, toPocketId: 2 }, TODAY)).toEqual([]);
    expect(validateMove({ ...input, date: '2026-11-25' }, TODAY)).toEqual([]);
  });

  it('Amount: 0 and negative amounts are "amount-not-positive"', () => {
    expect(validateMove({ ...input, amountCents: 0 }, TODAY)).toEqual(['amount-not-positive']);
    expect(validateMove({ ...input, amountCents: -5 }, TODAY)).toEqual(['amount-not-positive']);
  });

  it('Amount: above the app limit (900 000 000,00 €) is "amount-too-large", the limit itself is valid', () => {
    expect(validateMove({ ...input, amountCents: 90_000_000_000 }, TODAY)).toEqual([]);
    expect(validateMove({ ...input, amountCents: 90_000_000_001 }, TODAY)).toEqual(['amount-too-large']);
  });

  it('Date: a day after today, or text that is not a day, is "date-invalid"', () => {
    expect(validateMove({ ...input, date: '2026-11-26' }, TODAY)).toEqual(['date-invalid']);
    expect(validateMove({ ...input, date: '2026-02-30' }, TODAY)).toEqual(['date-invalid']);
    expect(validateMove({ ...input, date: 'yesterday' }, TODAY)).toEqual(['date-invalid']);
  });

  it('a past date of any age is valid (no minimum)', () => {
    expect(validateMove({ ...input, date: '2020-01-01' }, TODAY)).toEqual([]);
  });

  it('From and To being the same pocket is "move-same-pocket"', () => {
    expect(validateMove({ ...input, toPocketId: 1 }, TODAY)).toEqual(['move-same-pocket']);
  });

  it('several mistakes are all reported', () => {
    const errors = validateMove({ ...input, amountCents: 0, date: '2027-01-01', toPocketId: 1 }, TODAY);
    expect([...errors].sort()).toEqual(['amount-not-positive', 'date-invalid', 'move-same-pocket']);
  });
});

describe('Not enough in the pocket: moveTooMuch (FR-005)', () => {
  it('a move above the balance is too much; the balance itself and less are fine', () => {
    expect(moveTooMuch(70001, 70000)).toBe(true);
    expect(moveTooMuch(70000, 70000)).toBe(false);
    expect(moveTooMuch(1, 70000)).toBe(false);
  });

  it('a pocket at 0 or below cannot be moved from', () => {
    expect(moveTooMuch(1, 0)).toBe(true);
    expect(moveTooMuch(1, -5000)).toBe(true);
  });
});

describe('Pocket balance with moves (FR-003, Story 2 scenario 1)', () => {
  it('Moved out: 1 000,00 - 300,00 = 700,00, and the move into Main adds nothing elsewhere', () => {
    const [b] = pocketBalances([emergency], [], [move()]);
    expect(b).toMatchObject({ cents: 70000, movedOutCents: 30000, movedInCents: 0, savedCents: 0, spentCents: 0 });
  });

  it('To another pocket: 1 000,00 and 500,00 become 700,00 and 800,00', () => {
    const balances = pocketBalances([emergency, japan], [], [toJapan()]);
    expect(balances.map((b) => b.cents)).toEqual([70000, 80000]);
    expect(balances[0]).toMatchObject({ movedOutCents: 30000, movedInCents: 0 });
    expect(balances[1]).toMatchObject({ movedOutCents: 0, movedInCents: 30000 });
  });

  it('starting + saved - spent - moved out + moved in', () => {
    const entry = (kind: 'savings' | 'expense', amountCents: number): Entry => ({
      id: 1, date: '2026-11-02', kind, amountCents, note: '', category: 'other', recurringId: null, pocketId: 1, pocketName: null, pocketEmoji: null,
    });
    const moves = [move({ id: 1, amountCents: 1000 }), move({ id: 2, amountCents: 200, fromPocketId: 2, toPocketId: 1, toName: 'Emergency fund' })];
    const [b] = pocketBalances([emergency], [entry('savings', 5000), entry('expense', 700)], moves);
    expect(b.cents).toBe(100000 + 5000 - 700 - 1000 + 200);
  });

  it('moves of other pockets do not count, and no moves leaves the balance as before', () => {
    expect(pocketBalances([japan], [], [move()])[0]).toMatchObject({ cents: 50000, movedOutCents: 0, movedInCents: 0 });
    expect(pocketBalances([japan], [])[0].cents).toBe(50000);
  });

  it('SC-002: the pockets total falls by what moved into Main and stays the same between pockets', () => {
    const before = pocketsTotal(pocketBalances([emergency, japan], [], []));
    expect(pocketsTotal(pocketBalances([emergency, japan], [], [toJapan()]))).toBe(before);
    expect(pocketsTotal(pocketBalances([emergency, japan], [], [move()]))).toBe(before - 30000);
  });
});

describe('More left to spend: movedIntoMain (FR-004, Story 1 scenario 6)', () => {
  it('adds up the moves into Main dated in the month', () => {
    const moves = [
      move({ id: 1, date: '2026-11-01', amountCents: 300 }),
      move({ id: 2, date: '2026-11-30', amountCents: 20 }),
      move({ id: 3, date: '2026-10-31', amountCents: 5000 }),
      move({ id: 4, date: '2026-12-01', amountCents: 5000 }),
    ];
    expect(movedIntoMain(moves, '2026-11')).toBe(320);
  });

  it('moves between pockets are not counted', () => {
    expect(movedIntoMain([toJapan({ amountCents: 9999 }), move({ id: 2, amountCents: 100 })], '2026-11')).toBe(100);
  });

  it('no moves is 0', () => {
    expect(movedIntoMain([], '2026-11')).toBe(0);
  });
});

describe('Moves in the lists: mergeByDate and moveTitle (FR-006)', () => {
  const entry = (id: number, date: string, note: string): Entry => ({
    id, date, kind: 'expense', amountCents: 100, note, category: 'other', recurringId: null, pocketId: null, pocketName: null, pocketEmoji: null,
  });

  it('merges entries and moves newest first, as typed items', () => {
    const items = mergeByDate(
      [entry(2, '2026-11-12', 'B'), entry(1, '2026-11-05', 'A')],
      [{ move: move({ id: 1, date: '2026-11-10' }), sign: 1 }],
    );
    expect(items.map((i) => (i.type === 'entry' ? i.entry.note : `move ${i.move.id} ${i.sign}`))).toEqual(['B', 'move 1 1', 'A']);
  });

  it('on the same day entries come first, each list keeping its own order', () => {
    const items = mergeByDate(
      [entry(3, '2026-11-10', 'first'), entry(2, '2026-11-10', 'second')],
      [{ move: move({ id: 9, date: '2026-11-10' }), sign: -1 }, { move: move({ id: 8, date: '2026-11-10' }), sign: -1 }],
    );
    expect(items.map((i) => (i.type === 'entry' ? i.entry.note : `move ${i.move.id}`))).toEqual(['first', 'second', 'move 9', 'move 8']);
  });

  it('with no moves the entries stay as they were; with no entries only the moves are left', () => {
    expect(mergeByDate([entry(1, '2026-11-05', 'A')], []).map((i) => i.type)).toEqual(['entry']);
    expect(mergeByDate([], [{ move: move(), sign: 1 }]).map((i) => i.type)).toEqual(['move']);
  });

  it('title: "To Main" and "To <pocket>" for money going out', () => {
    expect(moveTitle(move(), -1)).toBe('To Main');
    expect(moveTitle(toJapan(), -1)).toBe('To Japan trip');
  });

  it('title: "From <pocket>" for money coming in', () => {
    expect(moveTitle(move(), 1)).toBe('From Emergency fund');
    expect(moveTitle(toJapan(), 1)).toBe('From Emergency fund');
  });

  it('Note: a note replaces the title on both sides', () => {
    expect(moveTitle(move({ note: 'Car repair' }), 1)).toBe('Car repair');
    expect(moveTitle(toJapan({ note: 'Flights' }), -1)).toBe('Flights');
  });
});

describe('Lists keep time order: mergeByDate with createdAt (FR-006)', () => {
  const entry = (id: number, date: string, createdAt: string, note = `E${id}`): Entry => ({
    id, date, kind: 'expense', amountCents: 100, note, category: 'other', recurringId: null, pocketId: null, pocketName: null, pocketEmoji: null, createdAt,
  });
  const line = (id: number, date: string, createdAt: string) => ({ move: move({ id, date, createdAt }), sign: 1 as const });
  const names = (items: ReturnType<typeof mergeByDate>) => items.map((i) => (i.type === 'entry' ? i.entry.note : `M${i.move.id}`));

  it('a move made after an expense of the same day lists above it', () => {
    const items = mergeByDate([entry(1, '2026-11-25', '2026-11-25 09:00:00')], [line(1, '2026-11-25', '2026-11-25 10:00:00')]);
    expect(names(items)).toEqual(['M1', 'E1']);
  });

  it('an expense recorded after a move of the same day lists above the move', () => {
    const items = mergeByDate([entry(1, '2026-11-25', '2026-11-25 11:00:00')], [line(1, '2026-11-25', '2026-11-25 10:00:00')]);
    expect(names(items)).toEqual(['E1', 'M1']);
  });

  it('interleaves several of each within a day by when they were recorded, newest first', () => {
    const items = mergeByDate(
      [entry(3, '2026-11-25', '2026-11-25 12:00:00'), entry(2, '2026-11-25', '2026-11-25 08:00:00')],
      [line(2, '2026-11-25', '2026-11-25 10:00:00'), line(1, '2026-11-25', '2026-11-25 07:00:00')],
    );
    expect(names(items)).toEqual(['E3', 'M2', 'E2', 'M1']);
  });

  it('the day still comes first: a later-recorded item of an older day lists below a newer day', () => {
    const items = mergeByDate([entry(1, '2026-11-24', '2026-11-25 18:00:00')], [line(1, '2026-11-25', '2026-11-25 08:00:00')]);
    expect(names(items)).toEqual(['M1', 'E1']);
  });

  it('the same moment: entries first', () => {
    const items = mergeByDate([entry(1, '2026-11-25', '2026-11-25 10:00:00')], [line(1, '2026-11-25', '2026-11-25 10:00:00')]);
    expect(names(items)).toEqual(['E1', 'M1']);
  });

  it('without createdAt entries come first on a day, as before', () => {
    const noTime = { ...entry(1, '2026-11-25', ''), createdAt: undefined };
    const items = mergeByDate([noTime], [{ move: move({ id: 1, date: '2026-11-25' }), sign: 1 }]);
    expect(names(items)).toEqual(['E1', 'M1']);
  });
});
