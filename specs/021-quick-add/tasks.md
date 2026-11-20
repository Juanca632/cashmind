# Tasks: Quick add

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui.md](./contracts/ui.md), [quickstart.md](./quickstart.md)

Tests are written by the `test-writer` subagent from the spec (project rule), not by the implementation tasks.

## Phase 1: Foundational (blocks every story)

- [X] T001 Move `entryTitle(entry)` from src/features/entries/components/entry-list.tsx to src/features/entries/rules.ts (note, else `CATEGORY_LABELS[category]`, else `KIND_LABELS[kind]` for Other), exported, and import it back in entry-list.tsx; behavior unchanged

## Phase 2: User Story 2 — which suggestions show (P1)

**Independent test**: unit-test `quickAddSuggestions` with known entries and a known today.

- [X] T002 [US2] In src/features/entries/rules.ts: `QUICK_ADD_DAYS = 60`, `QUICK_ADD_MIN = 2`, `QUICK_ADD_MAX = 4`, type `QuickAddSuggestion = { category, amountCents, note, count, lastDate }`, and `quickAddSuggestions(entries, today)`: keep `kind === 'expense'`, `recurringId === null`, `addDays(dayKey(today), -(QUICK_ADD_DAYS - 1)) <= date <= dayKey(today)`; group by category + amountCents + exact note; keep `count >= QUICK_ADD_MIN`; sort by count desc, then lastDate desc; take `QUICK_ADD_MAX`
- [X] T003 [US2] In src/features/entries/rules.ts: `quickAddRange(today)` → `{ from: monthKey(month of today − 59 days), to: monthKey(today) }`

## Phase 3: User Story 1 — fill a new expense from a suggestion (P1) 🎯 MVP

**Independent test**: open Add with known recent expenses, tap a suggestion, check the fields, save and find the entry on home.

- [X] T004 [US1] `QuickAddRow` in src/features/entries/components/quick-add-row.tsx: props `suggestions`, `onPick(suggestion)`; renders nothing when empty; title "Recent" (`ThemedText` `small`, `textSecondary`); a wrapping row (`flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: Layout.itemGap`) of `Pill`s with icon `categoryIcon('expense', category)`, `colors` ink `theme.kindInk.expense`, label `"<title> · <formatEuros(amountCents)>"`, accessibility label `"Fill with <title>, <CATEGORY_LABELS[category]>, <amount>"`; title from `entryTitle`
- [X] T005 [US1] In src/features/entries/screens/entry-screen.tsx: `EntryScreen` calls `useEntriesBetween(range.from, range.to)` with `quickAddRange(today)`; waits while it loads; on error or when editing passes `[]`; otherwise passes `quickAddSuggestions(data, today)` to `EntryForm` as `suggestions`
- [X] T006 [US1] In src/features/entries/screens/entry-screen.tsx: `EntryForm` renders `QuickAddRow` between `AmountField` and the kind row while `kind === 'expense'`; `onPick` sets `amountText` to `centsToInput(amountCents)`, `category` and `note`, and calls `hapticTick()`; kind, date and repeat untouched

## Phase 4: Polish

- [X] T007 [P] src/db/demo-data.ts: add "Coffee" 250 cents `eating_out` expenses on three days last month and two days this month (replacing this month's 1500-cent "Coffee"), so the demo shows a suggestion
- [X] T008 [P] specs/001-expenses/spec.md FR-001: add "When adding an expense, the form suggests the expenses recorded most often lately (see 021)." and note 021 in its Input line
- [X] T009 Tests by the `test-writer` subagent for 021-quick-add (unit: `quickAddSuggestions`; integration: Stories 1–2)
- [X] T010 `npx expo lint`, `npx tsc --noEmit`, `npx jest --maxWorkers=2` pass; `code-reviewer` on 021-quick-add; fix BLOCKER/MAJOR

## Dependencies

T001 → T002 → T003 → T004 → T005 → T006. T007 and T008 any time. T009 after T006 (tests target the spec, run against the code). T010 last.

Story 2 comes before Story 1 in order because the form needs the suggestions to show anything; each is still checked on its own (Story 2 by unit tests, Story 1 on the form).

## Parallel

- T007 and T008 alongside T002–T006.

## Strategy

MVP = T001–T006: suggestions show and fill the form. T007–T010 finish the feature.
