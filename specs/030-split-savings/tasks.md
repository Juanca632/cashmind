# Tasks: Split savings

## Phase 1: Foundational

- [X] T001 Rules `toSplit`, `savedByPocket`, `previousSplit`, `shareOut` in src/features/home/split-savings.ts
- [X] T002 `addSavings` (all or nothing, one transaction) in src/features/entries/service.ts

## Phase 2: User Story 1 - See what is still to save (P1)

- [X] T003 [US1] `SavingsCard` in src/features/home/components/savings-card.tsx
- [X] T004 [US1] Show the card under the space selector in the current month with income and a goal in src/features/home/screens/home-screen.tsx

## Phase 3: User Story 2 - Split it across pockets (P1)

- [X] T005 [US2] `SplitScreen` (pre-fill, counter, Save, over-goal dialog, discard guard, New pocket) in src/features/home/screens/split-screen.tsx
- [X] T006 [US2] Route src/app/split.tsx and its title "Split savings" in src/app/_layout.tsx

## Phase 4: User Story 3 - No more repeating savings (P2)

- [X] T007 [P] [US3] Skip savings in `getActiveRecurringItems` and `getRecurringItemsToRecord` in src/features/entries/repository.ts
- [X] T008 [P] [US3] Refuse `repeat` for savings in `addEntry`/`editEntry` in src/features/entries/service.ts
- [X] T009 [P] [US3] Hide "Repeat every month" for savings in src/features/entries/screens/entry-screen.tsx

## Phase 5: Polish

- [X] T010 Update baselines specs/001-expenses/spec.md (FR-001, FR-011, FR-013) and specs/002-income-plan/spec.md (FR-004, FR-005)
- [X] T011 Tests by the `test-writer` subagent for 030-split-savings
- [X] T012 lint, tsc, jest (`--maxWorkers=2`); `code-reviewer`; fix BLOCKER/MAJOR

## Dependencies

T001–T002 before US1/US2; T003→T004; T005→T006; US3 is independent. T011 after T010; T012 last.
