# Tasks: Recorded Income

**Input**: Design documents from `specs/007-recorded-income/`

**Tests**: Included, as the constitution requires.

## Phase 1: Foundational

- [X] T001 Add migration step 3 in `src/db/migrations.ts` and version 3 in `src/test-support/released-schemas.ts`
- [X] T002 Add `income` as an entry kind in `src/shared/buckets.ts`, `src/shared/theme/theme.ts` and `src/shared/ui/bucket-badge.tsx`
- [X] T003 Remove income from the plan in `src/features/plan/rules.ts`, `repository.ts`, `service.ts`, `hooks/use-income-plan.ts`
- [X] T004 Accept income entries and read the latest earlier income in `src/features/expenses/rules.ts`, `repository.ts`, `hooks/`
- [X] T005 Adapt `src/test-support/app.tsx`, `damaged-data.ts` and `src/db/demo-data.ts`

## Phase 2: User Stories 1, 2 and 4 - Record income and one rule (P1)

- [X] T006 [US1] Add income to the form in `src/features/expenses/screens/expense-screen.tsx` and to the list in `components/expense-list.tsx`
- [X] T007 [US1] Add Earn and compute the month from entries in `src/features/home/screens/home-screen.tsx`
- [X] T008 [US2] Show "Add this month's income" and repeat in `src/features/home/screens/home-screen.tsx`

## Phase 3: User Story 3 - Simulator (P1)

- [X] T009 [US3] Make the income a trial value in `src/features/plan/screens/plan-edit-screen.tsx` and `plan-form.ts`
- [X] T010 [US3] Remove `src/app/month-income.tsx` and `month-income-screen.tsx`

## Phase 4: User Story 5 - See the plan (P2)

- [X] T011 [US5] Move My plan to `src/features/home/screens/plan-screen.tsx` and use this month's income

## Phase 5: User Story 6 - Existing data (P1)

- [X] T012 [US6] Add upgrade tests to `src/db/__tests__/migrate-test.ts` and update `constraints-test.ts`

## Phase 6: Polish

- [X] T013 Update tests in `src/__tests__/` and `src/features/*/__tests__/`, with the scenarios of this spec in `src/__tests__/recorded-income-test.tsx`
- [X] T014 [P] Update baseline specs `specs/001-expenses/spec.md`, `002-income-plan/spec.md`, `003-month-browsing/spec.md`
- [X] T015 Run tests, typecheck and lint
- [X] T016 Run the `code-reviewer` subagent with `007-recorded-income`
