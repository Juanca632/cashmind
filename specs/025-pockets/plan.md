# Implementation Plan: Pockets

**Branch**: `feat/025-pockets` | **Date**: 2026-11-24 | **Spec**: [spec.md](./spec.md)

## Summary

Migration 9 adds a `pocket` table and a `pocket_id` column to `entry` and `recurring`, and moves existing savings into pockets named after their category. Pockets live in the `entries` feature, because they are part of what an entry is. Entries and monthly items read their pocket's name through a `LEFT JOIN`, so titles need no extra lookups. New savings store category `'other'` and a `pocket_id`. The 025 "funds" screens become "My pockets" and "Pocket", plus a pocket form.

## Technical Context

**Dependencies**: none new.

**Storage** (migration 9):
```sql
CREATE TABLE pocket (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
  starting_cents INTEGER NOT NULL DEFAULT 0 CHECK (starting_cents >= 0)
) STRICT;
ALTER TABLE entry ADD COLUMN pocket_id INTEGER REFERENCES pocket(id);
ALTER TABLE recurring ADD COLUMN pocket_id INTEGER REFERENCES pocket(id);
```
Then, for each savings category in order (`emergency_fund`, `investments`, `travel`, `goal`, `other`) used by a savings `entry` or `recurring` row:
- insert a pocket with the category's English label (written into the step, never imported, because a released step must not change when the code does);
- set `pocket_id` on that category's savings rows.

**Testing**:
- **Unit tests**: `pocketBalances`, `entryTitle` with pockets, and the pocket validation.
- **Migration test**: upgrade from schema 8 with savings in several categories and a monthly saving.
- **Integration tests**: Stories 1–3 from home and the entry form.
- The test-writer moves existing tests off savings categories.
- No Maestro change: the add-entry flow uses expenses.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy | Pass. |
| II. Simple | Pass. Name and starting amount only; no icons, goals or transfers. |
| IV. Money | Pass. Integer hundredths, and the limit from `isValidCents`. |
| Migrations | Pass. Step 9 only adds things, keeps every value, and creates pockets from the data. Its structure goes in `released-schemas.ts` with an upgrade test. |
| Architecture | Pass. `entries` owns pockets. Home only links. Writes go through `entries/service.ts`. |
| Baseline | 001 FR-010 and FR-013. |

## Design

### Rules (`entries/rules.ts`)

- **Types**:
  - `Entry` gets `pocketId: number | null` and `pocketName: string | null` (read only);
  - `EntryInput` is `Omit<Entry, 'id' | 'recurringId' | 'pocketName'>`;
  - `RecurringItem` gets the same two fields, and `RecurringInput` adds `pocketId`;
  - `type Pocket = { id; name; startingCents }`;
  - `PocketInput = { name; startingCents }`.
- **Validation**:
  - `validateEntry` and `validateRecurring` add `'pocket-missing'` ("Pick a pocket.") for savings without a pocket;
  - for other kinds, `pocketId` must be null (`'pocket-not-allowed'`, which the forms never send);
  - `validatePocket(input)` returns `'pocket-name'` ("Give the pocket a name.") or `'amount-too-large'`, with `POCKET_NAME_MAX = 40`.
- **`entryTitle`**: for savings, the note, else the pocket name, else "Savings".
- **`pocketBalances(pockets, savings)`** returns `{ pocket, cents }[]` in pocket order, where `cents = startingCents + Σ savings`. `pocketsTotal` adds them up.
- **`fundBalances` and `fundsTotal` are removed.**

### Repository

- `toEntry` and `toRecurring` read `pocket_id` and `pocket_name` (`LEFT JOIN pocket p ON p.id = entry.pocket_id`).
  - **Format check**: a saving must have a pocket, and other kinds must not.
- `insertEntry`, `updateEntry`, `insertRecurring` and `updateRecurring` write `pocket_id`.
- **Pockets**:
  - `getPockets(db)` orders by `id`;
  - `getPocket(db, id)`;
  - `insertPocket`, `updatePocket` and `deletePocket`;
  - `pocketInUse(db, id)` checks for an entry or recurring row with that pocket.
- `getSavingsEntries` stays.

### Service (`entries/service.ts`)

- `addEntry`, `editEntry` and `editRecurring` also reject a savings `pocketId` that does not exist.
- The recurring item created from an entry copies its `pocketId`, and `recordRecurringEntries` passes the item's `pocketId`.
- `addPocket(db, input)` returns `WriteResult & { id? }`, so the form can pick the new pocket.
- `editPocket(db, id, input)`.
- `deletePocket(db, id)` is rejected with "A pocket with savings can't be deleted." when the pocket is in use.

### UI

- **Entry form**:
  - when the kind is savings, a `PocketChoices` component (radio `Pill`s per pocket plus a "New pocket" pill that pushes `/pocket-edit`) replaces `CategoryChoices`;
  - the pockets come from `usePockets()`, reloaded on focus, so a new pocket shows on return;
  - for savings the category is always `'other'`; for other kinds `pocketId` is `null`.
- **Monthly entry form**: the same `PocketChoices` for savings items.
- **Lists**: `entryTitle` covers titles. The icon for a saving is the savings kind icon.
- **`/pockets` (My pockets)**: rebuilt from funds-screen, with total, rows, "New pocket" button and empty text.
- **`/pocket?id=`**: rebuilt from fund-screen, with balance, "Started with …", an "Edit" `LinkButton` in the header row, and the list.
- **`/pocket-edit?id=` (new or edit)**:
  - a `TextField` for the name and an `AmountField` (regular) for the starting amount;
  - a save `Button`, the discard guard, and a delete `Button` (destructive) behind `useConfirm` when the pocket is not in use;
  - otherwise the "can't be deleted" text.
- **Home**:
  - the link label becomes "See pockets ›", accessibility "See my pockets", and it pushes `/pockets`;
  - `CategorySplit` is not shown for savings.
- **Trends**: no `TrendCategoryList` for savings.
- **Demo data**: create pockets "Emergency fund", "Summer trip" and "Investments", and give savings their `pocket_id`.

## Complexity Tracking

None.
