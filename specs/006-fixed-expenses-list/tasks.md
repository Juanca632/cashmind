# Tasks: Fixed Expenses List

**Input**: Design documents from `specs/006-fixed-expenses-list/`

**Tests**: Included. The constitution requires tests for domain logic and an upgrade test for every database change.

## Phase 1: Foundational (blocks every story)

- [X] T001 Add migration step 2 in `src/db/migrations.ts`: create STRICT `fixed_item` (`id` autoincrement primary key, `effective_month` `YYYY-MM`, `name` "1 to 40 characters", `amount_cents` "Above 0"), insert one item named `Fixed expenses` per `plan_version` whose euro amount is above 0 (`fixed_value`, or `income_cents * fixed_value / 100` for a percentage), and rebuild `plan_version` without `fixed_unit` and `fixed_value`
- [X] T002 Add the version 2 structure to `src/test-support/released-schemas.ts` without editing version 1
- [X] T003 [P] Update `src/db/__tests__/constraints-test.ts` for the new structure and add `fixed_item` constraint checks
- [X] T004 Change `IncomePlan` to `fixedItems: FixedItem[]` in `src/features/plan/rules.ts`, add the list total, and validate items with `item-invalid` (name 1 to 40 characters after trimming, amount above 0 and valid) and the total with `fixed-over-income` including the excess
- [X] T005 Apply the single monthly rule in `targetsFor` in `src/features/plan/rules.ts`: the kept part is its share of that month's income, capped at what is left, and the other part takes the rest
- [X] T006 Read `fixed_item` with format checks and save version and items in one transaction in `src/features/plan/repository.ts`
- [X] T007 Adapt plan seeding (`standardPlan`, `startApp`) in `src/test-support/app.tsx` and the damaged-data helpers in `src/test-support/damaged-data.ts`
- [X] T008 [P] Update `src/features/plan/__tests__/rules-test.ts` and `src/features/plan/__tests__/service-test.ts` for items, validation, percentages and the single monthly rule

## Phase 2: User Story 1 - List what I must pay every month (P1)

**Independent test**: Add, change and remove items, save, and the fixed total on the home screen is their sum.

- [X] T009 [US1] Create the list editor (name, euro amount, remove, add, total, item errors) in `src/features/plan/components/fixed-items-editor.tsx`
- [X] T010 [US1] Replace the fixed field with the editor as the first section of `src/features/plan/screens/plan-screen.tsx`, and build `plan.fixedItems` from it
- [X] T011 [US1] Add the acceptance scenarios of User Story 1 to `src/__tests__/fixed-expenses-test.tsx`

## Phase 3: User Story 2 - Split only what is left (P1)

**Independent test**: Enter a list and an income, see what is left, split it by percentage.

- [X] T012 [US2] Show income after the list and then what is left in `src/features/plan/screens/plan-screen.tsx`
- [X] T013 [US2] Make savings and wants whole percentages only in `src/features/plan/screens/plan-screen.tsx` and `src/features/plan/components/amount-field.tsx`, showing euros next to each and opening euro plans at the nearest percentage
- [X] T014 [US2] Show suggestions only for savings (20 % of the income, never above what is left) and wants (the rest) in `src/features/plan/screens/plan-screen.tsx` and `src/shared/buckets.ts`
- [X] T015 [US2] Add the acceptance scenarios of User Story 2 to `src/__tests__/fixed-expenses-test.tsx`

## Phase 4: User Story 3 - Fixed expenses do not follow the income (P1)

**Independent test**: Change the income and the fixed total stays; change the list later and past months stay.

- [X] T016 [US3] Add the acceptance scenarios of User Story 3 to `src/__tests__/fixed-expenses-test.tsx`

## Phase 5: User Story 5 - Existing data is kept (P1)

**Independent test**: Upgrade version 1 data and every month keeps its fixed total.

- [X] T017 [US5] Add upgrade tests with sample data (euro amount, percentage, several versions, zero amount, recorded fixed expense) to `src/db/__tests__/migrate-test.ts`

## Phase 6: User Story 4 - Fixed expenses count by themselves (P2)

**Independent test**: With a list and no expenses, Fixed is fully counted and tapping it shows the list; add expense offers two choices.

- [X] T018 [US4] Rename the part to Fixed in `src/shared/buckets.ts`, and stop showing progress on the fixed row in `src/shared/ui/bucket-rows.tsx`, showing the item count instead
- [X] T019 [US4] Create the read-only list in `src/features/plan/components/fixed-items-list.tsx` and show it when Fixed is selected in `src/features/home/screens/home-screen.tsx`
- [X] T020 [US4] Reject new expenses in the fixed part and keep it only for already fixed expenses in `src/features/expenses/rules.ts` and `src/features/expenses/service.ts`
- [X] T021 [US4] Offer only Wants and Savings, plus Fixed when editing an already fixed expense, in `src/features/expenses/screens/expense-screen.tsx`
- [X] T022 [US4] Add the acceptance scenarios of User Story 4 to `src/__tests__/fixed-expenses-test.tsx` and update `src/features/expenses/__tests__/service-test.ts`

## Phase 7: Polish

- [X] T023 Update the existing app tests in `src/__tests__/` for the new labels, percent-only fields and the single monthly rule
- [X] T024 [P] Update baseline `specs/001-expenses/spec.md` (FR-001, FR-005, FR-009 and affected scenarios)
- [X] T025 [P] Update baseline `specs/002-income-plan/spec.md` (FR-001 to FR-012, FR-016, FR-017 and affected scenarios)
- [X] T026 Run `npx jest`, `npx tsc --noEmit` and `npx expo lint`
- [X] T027 Run the `code-reviewer` subagent with `006-fixed-expenses-list`, fix BLOCKER and MAJOR findings and report the rest

## Phase 8: User Story 6 - See the plan apart from changing it (P2)

- [X] T028 [US6] Move the form to `src/features/plan/screens/plan-edit-screen.tsx` with route `src/app/plan-edit.tsx`, organized in sections with `src/shared/ui/section-card.tsx`
- [X] T029 [US6] Create the read-only plan in `src/features/plan/screens/plan-screen.tsx` and link it from `src/features/home/screens/home-screen.tsx`
- [X] T030 [US6] Add the acceptance scenarios of User Story 6 to `src/__tests__/fixed-expenses-test.tsx`
- [X] T031 [US6] Add the shared confirmation dialog in `src/shared/ui/confirm-dialog.tsx` and use it for deletes, removals and unsaved changes
- [X] T032 [US6] Focus the home screen on what is left to spend in `src/features/home/screens/home-screen.tsx`
- [X] T033 Run the `code-reviewer` subagent again before the commit

## Dependencies

- Phase 1 blocks everything. T001 precedes T002, T003 and T017. T004 precedes T005 to T008.
- User Stories 1, 2 and 3 share the plan screen: do them in order.
- User Story 5 needs only Phase 1. User Story 4 needs Phase 1 and User Story 1.
- Phase 7 comes last.

## Parallel Examples

- T003 and T008 touch separate test files.
- T024 and T025 touch separate specs.

## Implementation Strategy

Phase 1 and User Story 1 give the list as the base of the plan. The remaining stories follow in order, all shipped together because they share one database step.
