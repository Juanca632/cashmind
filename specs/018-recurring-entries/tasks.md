# Tasks: Recurring Entries

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/ui.md](./contracts/ui.md)

## Phase 1: Foundational (blocks every story)

- [X] T001 Migration step 7 in src/db/migrations.ts: `CREATE TABLE recurring` exactly as data-model.md (`amount_cents INTEGER NOT NULL CHECK (amount_cents > 0)`, `active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))`, `last_month` GLOB month, category CHECK per kind) and `ALTER TABLE entry ADD COLUMN recurring_id INTEGER REFERENCES recurring(id)`; add schema 7 to src/test-support/released-schemas.ts
- [X] T002 Rules in src/features/entries/rules.ts: `Entry.recurringId: number | null`, `RecurringItem`, `validateRecurring` (amount > 0 and within the entry limit, category of the item's kind, note ≤ 80), `fixedCostsCents(items)` (active expenses only), `RECURRING_MISSING = 'This monthly entry no longer exists.'`
- [X] T003 Repository in src/features/entries/repository.ts: read/write `recurring_id` on entries; `getRecurringItems`, `getRecurringItem`, `insertRecurring`, `updateRecurring`, `stopRecurring`, `getItemsToRecord(month)`, `markRecorded(id, month)` (conditional update returning changes); format-check every read; add the write names to `NO_WRITES_IN_HOOKS` in eslint.config.js

## Phase 2: User Story 1 - Mark an entry as monthly (P1)

- [X] T004 [US1] Service in src/features/entries/service.ts: `addEntry`/`editEntry` take `{ repeat }`; mark creates the item (`last_month` = current month) and links the entry in one `withTransactionAsync`; switch off on an entry of an active item stops it; refuse `repeat` outside the current month
- [X] T005 [P] [US1] Shared `SwitchRow` in src/shared/ui/switch-row.tsx (React Native `Switch`, role `switch`, themed colors, tokens only)
- [X] T006 [US1] Entry form in src/features/entries/screens/entry-screen.tsx: "Repeat every month" switch when the form's month is the current month, initial = linked to an active item, `repeat=1` route param, part of the unsaved-changes check
- [X] T007 [P] [US1] Repeat icon (Feather `repeat`, `IconSize` token) and ", repeats every month" in the row label in src/features/entries/components/entry-list.tsx

## Phase 3: User Story 2 - New month starts filled in (P1)

- [X] T008 [US2] `recordRecurringEntries(db, today)` in src/features/entries/service.ts: one transaction; for each active item with `last_month < month`, `markRecorded` and only then insert the entry dated `{month}-01`; returns the count
- [X] T009 [US2] Home in src/features/home/screens/home-screen.tsx: effect keyed on the current month calls it (ref guard), loading view until it settles for that month, then bump `refresh`

## Phase 4: User Story 3 - Review what repeats (P1)

- [X] T010 [P] [US3] Hooks src/features/entries/hooks/use-recurring-items.ts and use-recurring-item.ts (`useFocusedData`)
- [X] T011 [US3] `editRecurring` and `stopRecurring` in src/features/entries/service.ts (validated, `WriteResult`)
- [X] T012 [US3] Item screen src/features/entries/screens/recurring-screen.tsx + route src/app/recurring.tsx + title in src/app/_layout.tsx, texts from contracts/ui.md, stop confirm via the shared dialog, unsaved-changes guard
- [X] T013 [US3] "Every month" section in src/features/home/screens/plan-screen.tsx: rows, "Fixed costs: X a month", "Nothing repeats yet.", Add → `/entry?repeat=1`, row → `/recurring?id=`

## Phase 5: Polish

- [X] T014 [P] Demo Rent becomes a repeating item in src/db/demo-data.ts
- [X] T015 [P] Baseline specs: specs/001-expenses/spec.md (switch, icon, recorded on the 1st) and specs/002-income-plan/spec.md FR-005 (Every month section)
- [X] T016 test-writer writes the Jest tests (unit, integration, migration 6→7) and one Maestro smoke flow from specs/018-recurring-entries/spec.md and contracts/ui.md
- [X] T017 Run lint, typecheck and tests (`--maxWorkers=2`)
- [X] T018 code-reviewer reviews 018-recurring-entries

## Dependencies

T001 → T002 → T003 → US1 (T004–T007) → US2 (T008–T009) and US3 (T010–T013) → Polish. T005 and T007 can run in parallel with T004/T006; T014 and T015 in parallel with each other.

## Implementation Strategy

All three stories are P1 and together are the smallest useful feature (marking without filling or reviewing is not usable), so they ship together. Verify each phase with `npx tsc --noEmit` and `npx expo lint`; behavior is verified by the test-writer's tests and the quickstart.
