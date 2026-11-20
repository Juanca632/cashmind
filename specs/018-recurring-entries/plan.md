# Implementation Plan: Recurring Entries

**Branch**: `feat/018-recurring-entries` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

## Summary

A new `recurring` table holds the repeating items; `entry` gains a nullable `recurring_id`. A service `recordRecurringEntries(db, today)` records, in one transaction, every active item whose `last_month` is before the current month, dated the 1st, and moves `last_month` to the current month. Home runs it before showing the current month, and again when the month changes while the app is open (`useToday` already refreshes on foreground). The entry form gets a "Repeat every month" switch (current month only); My plan gets an "Every month" section; a new `/recurring` route edits or stops an item. Rows of linked entries show a repeat icon.

## Technical Context

**Language/Version**: TypeScript, Expo SDK 58, React Native, Expo Router.

**Storage**: `expo-sqlite`, migration step 7 (new table + nullable column, no data change). Atomic writes with `db.withTransactionAsync` (as `migrate.ts` and `demo-data.ts` already do; supported by the test fake). See [research.md](./research.md).

**Dependencies**: none new. `Switch` from React Native core; icon `repeat` from the Feather set already used. Works in Expo Go.

**Testing**: unit for the item rules and the month fill (`recordRecurringEntries` on the test database with a fixed clock); integration journeys for marking, the new month, editing/stopping from My plan; migration upgrade test from schema 6. Written by the `test-writer`. Maestro: one smoke flow for marking an entry and seeing it in My plan (the month rollover is covered by Jest with fake time; a device cannot move its clock in the smoke suite).

**Constraints**: integer cents; no fill of skipped months; past months never written.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Local table only. |
| II. Keep It Simple | Pass. One table, one column, one service; no scheduler, the fill runs when home opens. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Pass. `amount_cents INTEGER > 0`; "Fixed costs" sums cents. |
| Migrations keep user data | Pass. Step 7 only adds; released step 6 untouched; schema 7 added to `released-schemas.ts` with an upgrade test. |
| Baseline specs updated | 001 (switch, icon, recorded on the 1st), 002 FR-005 (Every month section). |
| Architecture | Pass. Items live in the `entries` feature (rules, repository, service, hooks, screen). My plan (in `home`) combines `entries` and `plan`, as allowed. Writes only through `entries/service.ts`. |
| Styles rule | Pass. New shared `SwitchRow` in `src/shared/ui`, tokens only. |

Re-checked after design: no change.

## Design

- **Rules** (`entries/rules.ts`): `RecurringItem = { id, kind, category, amountCents, note, active, lastMonth }`; `validateRecurring({ kind, category, amountCents })` reuses the entry amount and category checks; `fixedCostsCents(items)` = sum of active expense items.
- **Repository** (`entries/repository.ts`): entries read and write `recurring_id`; `getRecurringItems` (active, ordered by kind then id), `getRecurringItem(id)`, `insertRecurring`, `updateRecurring`, `stopRecurring`, `getItemsToRecord(month)`, `markRecorded(id, month)` (conditional `UPDATE … WHERE last_month < ?`, returns changes). Every read is format-checked (`readOneOf`, `isCategoryOf`, `readPositiveInteger`, `readText`, `readMonth`, active 0/1).
- **Service** (`entries/service.ts`):
  - `addEntry(db, input, today, { repeat })`: with `repeat`, in one transaction insert the item (`last_month` = current month) and the entry linked to it. Refused unless the entry is in the current month.
  - `editEntry(db, id, input, today, { repeat })`: switch turned on → create an item from the edited entry and link it; turned off on an entry of an active item → stop that item. Fields change only the entry.
  - `recordRecurringEntries(db, today)`: in one transaction, for each active item with `last_month < month`: `markRecorded`, and only if it changed a row insert the entry `{month}-01` linked to the item. Returns how many were recorded. Running twice records nothing the second time.
  - `editRecurring(db, id, { category, amountCents, note })`, `stopRecurring(db, id)`.
- **Home**: an effect keyed on the current month calls `recordRecurringEntries`; until it settles for that month, home shows its loading view; afterwards it bumps `refresh`. A ref stops a second call for the same month (React dev double effects).
- **Entry form**: `SwitchRow` "Repeat every month" under the note when the form's month is the current month; initial value = linked to an active item; part of the unsaved-changes check. Route param `repeat=1` turns it on (Add from My plan).
- **My plan**: below "Save plan", a section "Every month" (heading, rows with category icon, label = note or category name, signed amount via `formatEuros`, "+" for income), "Fixed costs: X a month", "Nothing repeats yet." when empty, and an `Add` link button → `/entry?repeat=1`. Tapping a row → `/recurring?id=`.
- **`/recurring` screen** (`entries/screens/recurring-screen.tsx`): title "Every month", the kind as a badge (not editable), amount, the kind's categories, note, "Save changes", and "Stop repeating" (destructive, asks "Stop repeating?" / "Past entries stay." via the shared confirm dialog); unsaved-changes guard as the entry form. Applies from next month (the current month is already recorded).
- **Lists**: `EntryRow` shows a small `repeat` icon (`IconSize` token) next to the date when `recurringId !== null`, and the row's accessibility label ends with ", recorded by a repeat" (true whether the item is active or stopped).
- **Demo data**: the demo Rent becomes a repeating item so `npm run demo` shows the section.

## Project Structure

```text
src/db/migrations.ts                       # step 7
src/test-support/released-schemas.ts       # schema 7
src/features/entries/{rules,repository,service}.ts
src/features/entries/hooks/use-recurring-items.ts, use-recurring-item.ts
src/features/entries/screens/recurring-screen.tsx, entry-screen.tsx
src/features/entries/components/entry-list.tsx
src/features/home/screens/{home-screen,plan-screen}.tsx
src/shared/ui/switch-row.tsx
src/app/recurring.tsx, src/app/_layout.tsx  # route + title
src/db/demo-data.ts
specs/001-expenses/spec.md, specs/002-income-plan/spec.md
.maestro/06-recurring.yaml                 # by the test-writer
```

## Complexity Tracking

None.
