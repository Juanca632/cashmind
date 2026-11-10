# Tasks: Simple Plan

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/writes.md](./contracts/writes.md)

**Tests**: Required by the constitution (unit, integration, E2E).

## Phase 1: Foundational (blocks every story)

- [x] T001 Add migration step 4 in src/db/migrations.ts: rebuild `expense` with `CHECK (bucket IN ('expense', 'savings', 'income'))`, mapping `fixed` and `leisure` to `expense`; rebuild `plan_version` as `effective_month` + `savings_pct INTEGER NOT NULL CHECK (savings_pct BETWEEN 0 AND 100)`, taking `kept_value` when `kept_bucket = 'savings' AND kept_unit = 'pct'`, otherwise 20; drop `fixed_item` (T002, the schema 4 entry and its upgrade test, moved into T014)
- [x] T003 Simplify src/shared/buckets.ts to `EntryBucket = 'income' | 'savings' | 'expense'` with labels and descriptions; update colors and tints in src/shared/theme/theme.ts and icons in src/shared/ui/bucket-badge.tsx
- [x] T004 Plan domain in src/features/plan/rules.ts: `DEFAULT_SAVINGS_PERCENT = 20`, `PlanVersion = { effectiveMonth, savingsPercent }`, `savingsPercentFor(versions, month)`, `savingsGoal(income, percent)` rounded down, `isValidPercent`; repository, service (`savePlan(db, savingsPercent, today)`) and hooks/use-plan-versions.ts
- [x] T005 Expenses: drop `canUseBucket` and the fixed restriction in src/features/expenses/rules.ts and service.ts; `totalsByBucket` for the three kinds; add `getFirstEntryMonth` in repository.ts and hooks/use-first-entry-month.ts

## Phase 2: User Story 1 + 5 - Month at a glance (P1)

**Independent test**: record income, saving and expense; read home.

- [x] T006 [US1] Add `monthSummary(totals, percent)` in src/features/home/month-summary.ts (`left = income − spent − max(goal, saved)`)
- [x] T007 [US1] Rework src/features/home/screens/home-screen.tsx: card shows left to spend, or asks for income with repeat; tiles Income, Spent, Savings (saved of goal); no setup screen, no "no plan" state

## Phase 3: User Story 2 - Record three kinds (P1)

- [x] T008 [US2] Expense form offers Income, Savings and Expense in src/features/expenses/screens/expense-screen.tsx; list colors in components/expense-list.tsx
- [x] T009 [US2] Tiles filter Activity by kind, with "Show all", in home-screen.tsx

## Phase 4: User Story 3 + 4 - One percentage (P1/P2)

- [x] T010 [US3] Rewrite src/features/home/screens/plan-screen.tsx: one percentage field, this month's goal while typing, Save, discard guard
- [x] T011 [US3] Remove plan-edit and fixed-expenses routes and screens, fixed-items-editor, amount-field, plan-form, use-income-plan, plan-bar, plan-donut, shortfall-warning; update src/app/_layout.tsx
- [x] T012 [US4] Move the month picker to src/features/expenses/screens/month-picker-screen.tsx using the first entry month; past months hide My plan

## Phase 5: Polish

- [x] T013 [P] Update demo data in src/db/demo-data.ts
- [x] T014 test-writer subagent writes every test of this change from the specs: unit (plan rules and service, expenses rules and service, home month summary), migration step 4 (with schema 4 in released-schemas.ts), integration journeys in src/__tests__, and test support (src/test-support/app.tsx, damaged-data.ts)
- [x] T015 [P] Update baseline specs specs/001-expenses, specs/002-income-plan, specs/003-month-browsing
- [x] T016 Run lint, typecheck and tests; E2E of quickstart.md on the emulator

## Dependencies

Phase 1 blocks everything. US1 and US2 share home-screen.tsx, so they go in order. Phase 5 last. T013 and T015 can run in parallel with other work.

## Strategy

Phase 1 + US1 is the MVP: home shows the month with one percentage.
