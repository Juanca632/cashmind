# Tasks: App Architecture Foundation

**Input**: Design documents from `specs/004-app-architecture/`

**Tests**: Requested. The `test-writer` agent writes the black-box tests for User Stories 1 to 3 from `spec.md`, after implementation.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Create the folders `src/features/{expenses,plan,home}`, `src/db` and `src/shared` by moving code in the next phase

## Phase 2: Foundational (restructure with no behavior change)

- [x] T002 Move `src/data/database.ts` to `src/db/database.ts`
- [x] T003 Split shared logic into `src/shared/money.ts`, `src/shared/months.ts`, `src/shared/days.ts` and `src/shared/buckets.ts`
- [x] T004 Move domain rules to `src/features/expenses/rules.ts` and `src/features/plan/rules.ts`
- [x] T005 Move repositories to `src/features/expenses/repository.ts` and `src/features/plan/repository.ts`
- [x] T006 Move UI to `src/shared/ui/`, theme to `src/shared/theme/`, and feature components to each feature's `components/`
- [x] T007 Move hooks to each feature's `hooks/`
- [x] T008 Move screen bodies to `src/features/*/screens/` and make `src/app/*.tsx` re-export them
- [x] T009 Move the rules tests to each feature's `__tests__/` and update `src/test-support/app.tsx` and `src/__tests__/*` imports
- [x] T010 Verify the 109 tests, typecheck and lint pass before changing behavior

**Checkpoint**: Same behavior, new structure.

## Phase 3: User Story 1 - Invalid data is never saved (P1)

**Independent Test**: Call each write with invalid input and confirm stored data did not change.

- [x] T011 [US1] Add the write result type and helpers in `src/shared/write-result.ts`
- [x] T012 [US1] Add error messages to `src/features/expenses/rules.ts` and `src/features/plan/rules.ts`, and `validateMonthIncome` to the plan rules
- [x] T013 [US1] Implement add, edit and delete in `src/features/expenses/service.ts` per `contracts/write-operations.md`
- [x] T014 [US1] Implement save plan, set and remove month income in `src/features/plan/service.ts`
- [x] T015 [US1] Tests for every rejected and accepted write (test-writer)

## Phase 4: User Story 2 - A failed change is always explained (P1)

**Independent Test**: Make storage fail on each screen and confirm a message and an open form.

- [x] T016 [US2] Add `useSubmit` in `src/shared/hooks/use-submit.ts`
- [x] T017 [US2] Use services and `useSubmit` in `src/features/expenses/screens/expense-screen.tsx`
- [x] T018 [US2] Use services and `useSubmit` in `src/features/plan/screens/plan-screen.tsx` and `month-income-screen.tsx`
- [x] T019 [US2] Tests for failed saves on every screen (test-writer)

## Phase 5: User Story 3 - Damaged data is detected (P2)

**Independent Test**: Store a malformed row and confirm the message appears and the row is unchanged.

- [x] T020 [US3] Add format checks in `src/shared/read-checks.ts`, covering "Integer", "Real day, YYYY-MM-DD", "Valid YYYY-MM" and known values from `data-model.md`
- [x] T021 [US3] Apply the checks in both repositories, with row fields typed `unknown`
- [x] T022 [US3] Add `useFocusedData` in `src/shared/hooks/use-focused-data.ts` and the `DataError` component in `src/shared/ui/data-error.tsx`
- [x] T023 [US3] Return loadable states from all feature hooks and add `useExpense` in `src/features/expenses/hooks/use-expense.ts`
- [x] T024 [US3] Show `DataError` on the home, plan, month income, month picker and expense screens
- [x] T025 [US3] Tests for damaged data and for old valid data (test-writer)

## Phase 6: User Story 4 - The structure protects itself (P3)

**Independent Test**: Add a forbidden import and confirm lint fails.

- [x] T026 [US4] Move form logic out of screens to `src/features/plan/plan-form.ts`, and money text conversion to `src/shared/money.ts`
- [x] T027 [US4] Add import boundaries per zone in `eslint.config.js`
- [x] T028 [US4] Verify each forbidden import in `contracts/write-operations.md` makes lint fail

## Phase 7: Polish

- [x] T029 Add the failure and damaged-data scenarios to `specs/001-expenses/spec.md` and `specs/002-income-plan/spec.md`
- [x] T030 Run `/speckit-converge`, then the `code-reviewer` agent, and fix BLOCKER and MAJOR findings
- [x] T031 Update the Notion docs and diagrams with the `docs-keeper` agent

## Dependencies & Execution Order

Phase 2 blocks everything. US1 comes before US2, because screens call the services. US3 depends only on Phase 2. US4 goes last, so the lint rules see the final structure.

## Implementation Strategy

Restructure first and prove nothing changed, then add behavior one story at a time.
