# Tasks: Categories

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/categories-ui.md](./contracts/categories-ui.md), [quickstart.md](./quickstart.md)

**Tests**: Required. Written by the test-writer subagent from the spec.

## Phase 1: Foundational

- [X] T001 [P] In src/db/migrations.ts add step 6: `ALTER TABLE entry ADD COLUMN category TEXT NOT NULL DEFAULT 'other' CHECK (...)` with the per-kind lists of data-model.md, and a comment that existing entries become Other and nothing else changes
- [X] T002 [P] Add src/features/entries/categories.ts: `EntryCategory` type, `CATEGORIES: Record<EntryKind, readonly EntryCategory[]>` in data-model.md order, `ALL_CATEGORIES`, `CATEGORY_LABELS`, `DEFAULT_CATEGORY`, `isCategoryOf(kind, category)`; icons in src/features/entries/components/category-icons.ts (`categoryIcon(kind, category)`, research.md R2; Other → the kind's icon)
- [X] T003 In src/features/entries/rules.ts add `category: EntryCategory` to `Entry`, the `'category-invalid'` error ("Pick a category for this kind.") in `validateEntry`/`entryErrorMessage`, and `categorySplit(entries, kind)` → `{ category, cents, percent }[]` sorted by cents desc then list order, `percent = Math.round(cents * 100 / total)`
- [X] T004 In src/features/entries/repository.ts read `category` (`readOneOf(ALL_CATEGORIES)`, `DataFormatError` when not `isCategoryOf(kind, category)`) and write it in insert/update

## Phase 2: User Story 1 - Choose a category (P1)

- [X] T005 [US1] In src/features/entries/screens/entry-screen.tsx add the category options per contracts/categories-ui.md (radio pills with icon and label, wrapping), state initialised from the entry or `'other'`, reset to `'other'` on kind change, included in the discard-guard form state and in the saved input

## Phase 3: User Story 2 - Split by category (P1)

- [X] T006 [US2] Add src/features/entries/components/category-split.tsx: card titled "By category" with one line per share (icon in kind color, label, `formatEuros(cents)`, `N %`), accessibility label `<Label>: <amount>, <N> %`
- [X] T007 [US2] In src/features/home/screens/home-screen.tsx render `CategorySplit` above the list when a tile is selected and `categorySplit` is not empty; record repeated income with `category: 'other'`

## Phase 4: User Story 3 - Category in the lists (P2)

- [X] T008 [US3] In src/shared/ui/kind-badge.tsx accept an optional `icon`; in src/features/entries/components/entry-list.tsx pass the category icon and show note → category label → kind label (Other)

## Phase 5: User Story 4 - Existing entries kept (P1)

- [X] T009 [US4] In src/db/demo-data.ts give demo entries fitting categories (bills Housing/Subscriptions, groceries, salary, savings goals)

## Phase 6: Polish

- [X] T010 [P] Update baseline specs/001-expenses/spec.md: FR-001 (category in the form), FR-006 (row icon and text), FR-009 (split when a tile is selected), FR-010 (categories per kind; older entries are Other), and the matching user stories
- [X] T011 test-writer subagent writes the tests from specs/015-categories/spec.md, including `RELEASED_SCHEMAS[6]` in src/test-support/released-schemas.ts and upgrade tests with sample data from every released version
- [X] T012 Run `npx expo lint`, `npx tsc --noEmit` and `npx jest --maxWorkers=4`
- [X] T013 code-reviewer subagent reviews 015-categories; fix BLOCKER/MAJOR findings
- [ ] T014 E2E of quickstart.md by the e2e-tester subagent (before any APK)

## Dependencies

- T001, T002 in parallel; T003 needs T002; T004 needs T003.
- T005–T009 need T004; T007 needs T006; T008 independent of T005–T007.
- T010 any time; T011 after T009; T012 after T011; T013 after T012; T014 last.

## Implementation Strategy

MVP is US1 + US4 (T001–T005, T009): categories are recorded and existing data is safe. US2 adds the split, US3 the rows.
