# Tasks: Rename Entries

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md)

**Tests**: Written by the test-writer subagent (unit, integration); E2E by e2e-tester.

## Phase 1: Foundational

- [x] T001 Add migration step 5 in src/db/migrations.ts: rebuild `expense` as `entry` with `kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income'))` instead of `bucket`, copying every row (id, date, kind, amount_cents, note, created_at); add schema 5 to src/test-support/released-schemas.ts
- [x] T002 Rename src/shared/buckets.ts to src/shared/kinds.ts and src/shared/ui/bucket-badge.tsx to kind-badge.tsx with the names in data-model.md; rename BUCKET_COLORS/BUCKET_TINTS in src/shared/theme/theme.ts

## Phase 2: User Story 1 - Same behavior (P1)

- [x] T003 [US1] Move src/features/expenses to src/features/entries and rename its files, types, functions and hooks as in data-model.md; SQL uses `entry` and `kind`
- [x] T004 [US1] Rename the route src/app/expense.tsx to src/app/entry.tsx and update src/app/_layout.tsx and every push to `/expense`
- [x] T005 [US1] Update src/features/home, src/features/plan, src/db/demo-data.ts and eslint.config.js to the new names

## Phase 3: User Story 2 - Data kept (P1)

- [x] T006 [US2] test-writer: upgrade test from schema 4 to 5 and rename every test and helper (src/test-support/app.tsx, damaged-data.ts) to the new names

## Phase 4: Polish

- [x] T007 [P] Update names in specs 001-003 and 008, AGENTS.md and .claude/agents/*.md that mention the table, route or files (none did; docs/diagrams/generate.py is updated by docs-keeper)
- [x] T008 Lint, typecheck, tests; code-reviewer; E2E with e2e-tester; docs-keeper

## Dependencies

T001-T002 first, then T003-T005, then T006, then T007-T008.
