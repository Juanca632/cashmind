# Tasks: Database Foundation

**Tests**: Requested. The `test-writer` agent writes the black-box tests from `spec.md`.

## Phase 1: Foundational

- [x] T001 Add the runner and its errors in `src/db/migrate.ts`
- [x] T002 Add the migration list with the strict v1 structure in `src/db/migrations.ts` and use it from `src/db/database.ts`

## Phase 2: User Story 1 - Updates never lose data (P1)

- [x] T003 [US1] Add the released structure of v1 in `src/test-support/released-schemas.ts`
- [x] T004 [US1] Tests for the runner and upgrades from released structures (test-writer)

## Phase 3: User Story 2 - A failed update is explained (P1)

- [x] T005 [US2] Add the boundary in `src/db/database-boundary.tsx` and the screen in `src/shared/ui/database-error.tsx`
- [x] T006 [US2] Wrap `SQLiteProvider` in `src/app/_layout.tsx`
- [x] T007 [US2] Make `SQLiteProvider` in `src/test-support/fake-sqlite.tsx` report initialization errors like the real one
- [x] T008 [US2] Tests for the failure and newer-database messages (test-writer)

## Phase 4: User Story 3 - The database rejects invalid data (P2)

- [x] T009 [US3] Tests for the database rules, and update the damaged-data tests to the strict structure (test-writer)

## Phase 5: Polish

- [x] T010 Add the migration rules to `AGENTS.md` and the update scenarios to `specs/002-income-plan/spec.md`
- [x] T011 Run converge and the `code-reviewer` agent, and fix BLOCKER and MAJOR findings
- [x] T012 Update the Notion docs and diagrams with the `docs-keeper` agent
