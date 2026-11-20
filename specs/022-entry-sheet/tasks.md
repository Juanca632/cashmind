# Tasks: Entry form redesign

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

Tests are written by the `test-writer` subagent from the spec (project rule), not by the implementation tasks.

## Phase 1: User Story 1 — keyboard closed (P1)

- [X] T001 [US1] src/features/entries/screens/entry-screen.tsx: no `autoFocus` on the amount
- [X] T002 [US1] src/features/entries/components/amount-field.tsx: the amount row is a `Pressable` focusing the input; `size="large"` (56)

## Phase 2: User Story 2 — less at once, in the app's style (P1)

- [X] T003 [P] [US2] src/features/entries/components/kind-segmented.tsx: segmented kind control (Expense, Income, Savings)
- [X] T004 [P] [US2] src/features/entries/components/category-choices.tsx: `layout="grid"`, four per line; default stays wrapping pills
- [X] T005 [P] [US2] src/features/entries/components/quick-add-row.tsx: "Often recorded" title, one sideways row of flat pills
- [X] T006 [US2] src/features/entries/screens/entry-screen.tsx: kind control, amount card, "Category" grid, suggestions, details card (Date row → calendar, Repeat switch, Note field), buttons; day arrows removed

## Phase 3: Polish

- [X] T007 [P] specs/001-expenses FR-001 and FR-003, specs/021-quick-add spec and contracts/ui.md updated
- [X] T008 Tests by the `test-writer` (integration and Maestro flows 02, 03, 06, add subflow)
- [X] T009 Lint, typecheck, Jest; `code-reviewer`; fix BLOCKER/MAJOR

## Dependencies

T001–T006 → T007 → T008 → T009.
