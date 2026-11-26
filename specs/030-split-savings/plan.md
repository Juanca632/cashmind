# Implementation Plan: Split savings

**Branch**: `feat/030-split-savings` | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

## Summary

A pure rule in `home` works out what is still to split, how last month split its savings and the pre-filled shares. Main's home shows a `SavingsCard` under the space selector. A new `split` route opens `SplitScreen` (in `home`, as it combines the plan and the pockets), which records the savings through a new `addSavings` in the entries service, all in one transaction. Repeating savings are filtered out where items are read and refused where they are created. No storage change.

## Technical Context

**Dependencies**: none new.

**Testing**:
- **Unit tests**: the split rules (to split, the previous split, the shares and their rounding, pockets with a saving this month); `addSavings` validation; repeat refused for savings.
- **Integration tests**: the card's states on home; the journey home → Split → Save → home; less than and more than the goal (dialog); leaving with changes; New pocket and back; the entry form has no repeat switch for savings; existing repeating savings are neither recorded nor listed in My plan.

## Constitution Check

| Principle | Result |
| --- | --- |
| II. Simple | Pass. One card, one screen, no new storage; savings stay normal entries. |
| IV. Money | Pass. Integer cents; shares rounded down, the remainder to the first share. |
| Architecture | Pass. Writes go through the entries service; `home` combines plan and entries; the rules are pure. |
| Database | Pass. No migration; existing repeating savings are left unchanged in storage. |

## Design

- **Rules** (`src/features/home/split-savings.ts`, pure):
  - `toSplit(goal, saved)`: `max(goal − saved, 0)`.
  - `savedByPocket(entries, month)`: the month's savings per pocket id.
  - `previousSplit(pocketEntries, month)`: `savedByPocket` of the most recent month before `month` that has savings, or an empty map.
  - `shareOut(amount, previous, pocketIds)`: for each pocket in order, `floor(amount × its previous ÷ total previous)`; the remainder goes to the first pocket with a share; pockets with none get 0; an empty map gives all 0.
- **Service** (`addSavings(db, savings: { pocketId, amountCents }[], today)` in `src/features/entries/service.ts`):
  - keeps amounts above 0; needs at least one;
  - validates each as a saving dated today with no note (`validateEntry`), and checks each pocket still exists;
  - inserts them all in one transaction, so nothing is recorded if one fails.
- **No repeating savings**:
  - `getActiveRecurringItems` and `getRecurringItemsToRecord` skip `kind = 'savings'`;
  - `addEntry`/`editEntry` reject `repeat: true` for a saving;
  - the entry form shows the switch only when the kind is not savings.
- **`SavingsCard`** (`src/features/home/components/savings-card.tsx`):
  - a `Card` with "Savings for <Month>" (smallBold, textSecondary) and the figure;
  - either "<X> to split" with a `Pill` "Split", or "✓ <saved> split into N pockets".
  - `HomeMonth` shows it after `SpaceSelector` when the month is the current one, has income and has a goal above 0.
- **`SplitScreen`** (`src/features/home/screens/split-screen.tsx`, route `src/app/split.tsx`, title "Split savings"):
  - loads the plan, this month's entries, the moves, the pockets and every pocket entry;
  - pre-fills the text of each pocket's field once, at mount; a pocket that shows up later (New pocket) starts empty;
  - one row per pocket: emoji, name, "<X> this month" when the pocket already has savings, and an amount input with the label "<name> amount";
  - the live counter, then Save;
  - a sum above what is to split asks through `useConfirm`; leaving uses `useDiscardGuard` against the pre-filled form; `useSubmit` goes back on success.
  - "New pocket" is a `LinkButton` to `/pocket-edit`.
- **Baselines**: 001 FR-001/FR-011/FR-013 and 002 FR-004/FR-005, as listed in FR-006 of the spec.
