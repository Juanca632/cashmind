# Implementation Plan: Move money

**Branch**: `feat/028-move-money` | **Date**: 2026-11-25 | **Spec**: [spec.md](./spec.md)

## Summary

Migration 11 adds a `move` table. Moves live in the `entries` feature next to pockets. Rules gain a `Move` type, its validation, moves in `pocketBalances`, and the money moved into Main per month. `monthSummary` takes that amount, so left to spend, the daily budget and the pace follow it. Lists show moves through one `ListItem` union merged by date. A new `/move` route holds the form.

## Technical Context

**Dependencies**: none new.

**Storage** (migration 11 adds the table; migration 12 rebuilds it with `created_at`, because devices had already run step 11 without it and SQLite cannot add a column whose default is the current time):
```sql
CREATE TABLE move (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  from_pocket_id INTEGER NOT NULL REFERENCES pocket(id),
  to_pocket_id INTEGER REFERENCES pocket(id),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (to_pocket_id IS NULL OR to_pocket_id <> from_pocket_id)
) STRICT;
```

**Testing**:
- **Unit tests**: `validateMove`, `pocketBalances` with moves, `movedIntoMain`, `mergeByDate`, `monthSummary` with money moved in.
- **Migration tests**: upgrade from schema 10, and from schema 11 with moves (step 12 keeps them all).
- **Integration tests**: Stories 1–3 from a pocket's space, Main's list and Activity, and pocket deletion.
- No Maestro change: the smoke flows do not use pockets.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy | Pass. |
| II. Simple | Pass. One action and one form. No repeats, no Main → pocket move (Save into does it). |
| IV. Money | Pass. Integer hundredths and the shared amount limit. |
| Migrations | Pass. Step 11 only adds a table, and step 12 rebuilds it keeping every move. Their structures go in `released-schemas.ts` with upgrade tests. |
| Architecture | Pass. `entries` owns moves. Writes go through `entries/service.ts`. `home` combines them. |
| Baseline | 001 FR-013 and 002 FR-004. |

## Design

### Rules (`entries/rules.ts`)

- **Types**:
  - `Move = { id; date; amountCents; note; fromPocketId; fromName; fromEmoji; toPocketId: number | null; toName: string | null; toEmoji: string | null }`;
  - `MoveInput = Pick<Move, 'date' | 'amountCents' | 'note' | 'fromPocketId' | 'toPocketId'>`.
- **`validateMove(input, today)`** returns `MoveError[]`: `amount-not-positive`, `amount-too-large`, `date-invalid` (not a day or after today) and `move-same-pocket`. `moveTooMuch(amountCents, balanceCents)` checks the limit.
- **`pocketBalances(pockets, entries, moves = [])`** also returns `movedOutCents` and `movedInCents`. Then `cents = starting + saved − spent − movedOut + movedIn`.
- **`movedIntoMain(moves, month)`** adds up the moves with `toPocketId === null` dated in the month.
- **`monthSummary(totals, percent, movedInCents = 0)`** (in `home/month-summary.ts`) gives `left = income + movedIn − spent − max(goal, saved)`. The pace's spendable amount becomes `income + movedIn − max(goal, saved)`.
- **`ListItem`** = `{ type: 'entry'; entry } | { type: 'move'; move; sign: 1 | -1 }`:
  - `mergeByDate(entries, lines)` merges them newest first: by day, then by when each was recorded (`createdAt`, which entries and moves both read), entries first on a tie;
  - `moveTitle(move, sign)` is the note, else "To <space>" or "From <pocket>".

### Repository

- `getMoves(db)` reads every move with both pockets' names and emojis, `LEFT JOIN` for To, ordered by `date DESC, id DESC`. `getMove(db, id)` reads one.
- `insertMove`, `updateMove` and `deleteMove`.
- `pocketInUse` also checks moves on either side.
- `toMove` checks the format: a positive amount, a day, and From differing from To.

### Service

- `addMove`, `editMove` and `deleteMove`:
  - they validate, and reject a From or To pocket that is gone;
  - they reject an amount above the From pocket's balance. That balance comes from the pockets, the pocket entries and the moves, without the edited move itself;
  - the message is `MOVE_TOO_MUCH` ("There is not that much in this pocket."). The form shows the exact sentence with the balance beforehand.
- `POCKET_IN_USE` becomes "A pocket with savings, spending or moves can't be deleted.".

### UI

- **Hook `useMoves()`**: every move, reloaded on focus.
- **`/move?from=<id>` or `/move?id=<id>`** (`entries/screens/move-screen.tsx`):
  - title "Move money";
  - "From" as `PocketChoices` without "New pocket" (new `allowNew` prop), and "To" as `PaidFromChoices` with the pockets other than From, in a radio group named "To";
  - the large `AmountField` in a card;
  - a date row, opening the Android calendar up to today with no minimum;
  - a note row;
  - "Move" / "Save changes", and "Delete move" through `useConfirm`;
  - the discard guard;
  - a hint "<pocket> holds only <balance>." under the amount when it is too much, which disables saving;
  - From changing to the current To sets To to Main.
- **`EntryList`** takes an optional `moves?: MoveLine[]` and `onPressMove`, and renders merged `ListItem`s. `MoveRow` shows:
  - a neutral badge with the `shuffle` icon on the savings tint;
  - the title from `moveTitle` and the day;
  - a signed amount, `+` in the income ink and `-` in the text colour.
- **Pocket space**:
  - a third `Button` "Move" (`shuffle`) pushes `/move?from=<id>`;
  - the balance uses moves;
  - the unfiltered list merges the pocket's moves (out = −1, in = +1).
- **Home (Main)**:
  - the summary takes `movedIntoMain`;
  - the unfiltered list merges the month's moves into Main (+1), and "See all" counts them;
  - the spaces sheet's balances and Main's figure use moves.
- **Activity**: the unfiltered list merges the month's moves into Main.
- **Pocket form**: the in-use text becomes "A pocket with savings, spending or moves can't be deleted. You can rename it.".
- **Demo data**: one move from the emergency pocket to Main this month.

## Complexity Tracking

None.
