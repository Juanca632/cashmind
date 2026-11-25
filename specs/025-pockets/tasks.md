# Tasks: Pockets

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

Tests are written by the `test-writer` subagent from the spec (project rule), not by the implementation tasks.

## Phase 1: Foundational

- [X] T001 src/db/migrations.ts step 9 (pocket table, `pocket_id` on entry and recurring, pockets from used savings categories, links) and src/test-support/released-schemas.ts schema 9
- [X] T002 src/features/entries/rules.ts: `pocketId`/`pocketName` on `Entry` and `RecurringItem`, inputs, `Pocket`, `PocketInput`, `validatePocket`, pocket errors in `validateEntry`/`validateRecurring`, `entryTitle` for savings, `pocketBalances`/`pocketsTotal` (remove `fundBalances`/`fundsTotal`)
- [X] T003 src/features/entries/repository.ts: pocket joins and format checks in `toEntry`/`toRecurring`, `pocket_id` in writes, pocket CRUD and `pocketInUse`
- [X] T004 src/features/entries/service.ts: pocket existence checks, `pocketId` through repeats, `addPocket`/`editPocket`/`deletePocket`; eslint.config.js `NO_WRITES_IN_HOOKS` gets `insertPocket`, `updatePocket`, `deletePocket`
- [X] T005 src/db/demo-data.ts: pockets for the demo savings

## Phase 2: Stories 1 and 3 — pockets (P1/P2)

- [X] T006 hooks: src/features/entries/hooks/use-pockets.ts (`usePockets`), use-pocket.ts (`usePocket(id)` with in-use flag)
- [X] T007 src/features/entries/screens/pockets-screen.tsx (replaces funds-screen) and route src/app/pockets.tsx
- [X] T008 src/features/entries/screens/pocket-screen.tsx (replaces fund-screen) and route src/app/pocket.tsx
- [X] T009 src/features/entries/screens/pocket-edit-screen.tsx and route src/app/pocket-edit.tsx; _layout titles
- [X] T010 home link "See pockets ›"; no savings split on home; no savings category list in Trends

## Phase 3: Story 2 — saving into a pocket (P1)

- [X] T011 src/features/entries/components/pocket-choices.tsx and the entry form (savings → pockets, category 'other')
- [X] T012 the monthly entry form for savings items

## Phase 4: Polish

- [X] T013 specs/001-expenses FR-010 and FR-013
- [X] T014 Tests by the `test-writer` subagent for 025-pockets
- [X] T015 lint, tsc, jest; `code-reviewer`; fix BLOCKER/MAJOR
