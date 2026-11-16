# Tasks: Trends

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

Tests are written by the `test-writer` subagent from the spec (project rule), not by the implementation tasks.

## Phase 1: Foundational (blocks every story)

- [X] T001 [P] `lastMonths(month, count)` in src/shared/months.ts: month keys oldest first, ending at `month`, built on `previousMonth`
- [X] T002 [P] `getEntriesBetween(db, fromMonth, toMonth)` in src/features/entries/repository.ts (`substr(date, 1, 7) BETWEEN ? AND ?`, ordered by date then id, rows mapped with `toEntry`)
- [X] T003 `useEntriesBetween(from, to)` in src/features/entries/hooks/use-entries-between.ts through `useFocusedData` (reloads on focus), after T002
- [X] T004 [P] Tokens in src/shared/theme/theme.ts: `Size.trendBars` (bar area height), `Size.trendBarWidth`, `Size.goalMark` (goal mark height), `Opacity.fadedBar`, each with a one-line comment
- [X] T005 Routes: src/app/trends.tsx and src/app/trend-category.tsx re-exporting the home screens, and `Stack.Screen` entries in src/app/_layout.tsx (title "Trends"; the category screen sets its title from its params)

## Phase 2: User Story 1 — the last 6 months of one kind (P1) 🎯 MVP

**Independent test**: open Trends from home with known months and check pills, big number, sentence, bars and "Open <Month> ›".

- [X] T006 [US1] src/features/home/trends.ts: `TREND_PILLS` (Spent→expense, Saved→savings, Income→income), `monthTotals(entries, months, kind, category?)`, `monthsInUse(entries)`, `trendAverage(totals, inUse, currentMonth)` (earlier months in use, `Math.floor`, `null` when none or 0) and `averageSentence(cents, average, isCurrent, format, word)` ("X more than / X less than / About" + "your average" or "usual"; "About" when `|diff| × 20 ≤ average`; "So far, " prefix with lowercase continuation in the current month)
- [X] T007 [US1] `TrendBars` in src/features/home/components/trend-bars.tsx: six pressable columns of height `Size.trendBars`, scale = max of bars, average and optional goals; selected bar in `kindInk[kind]`, others at `Opacity.fadedBar`; dashed average line (`BORDER_WIDTH`, `textSecondary`) when the average is not null; short month name under each (`formatShortMonth`); each column `accessibilityRole="button"`, label "<Month>: <amount>", `accessibilityState.selected`; optional `goals` prop drawing a `Size.goalMark` mark per month with a goal
- [X] T008 [US1] `TrendsScreen` in src/features/home/screens/trends-screen.tsx: loads `useEntriesBetween` for `lastMonths(current, 6)` and `usePlanVersions`; state `kind` ('expense') and `selected` (current month); pills row (`Pill`), month name, big number, sentence (only with an average), `TrendBars`, `LinkButton` "Open <Month> ›" → `router.dismissTo({ pathname: '/', params: { month } })`; loading/error states as other screens (`DataError`); no red anywhere
- [X] T009 [US1] Home link in src/features/home/screens/home-screen.tsx: `LinkButton` "See trends ›" in the `SpendingPaceSection` title row → `router.push('/trends')` (shows only when the section shows)

## Phase 3: User Story 2 — the selected month by category (P1)

**Independent test**: select months and pills on Trends and check the category list and the empty line.

- [X] T010 [US2] `TrendCategoryList` in src/features/home/components/trend-category-list.tsx: `Card` titled "By category", one pressable row per `CategoryShare` (icon via `categoryIcon`, name, amount, a bar whose width is cents ÷ largest in `kindInk[kind]`), accessible label "<Category>: <amount>", `onPress(category)`
- [X] T011 [US2] In src/features/home/screens/trends-screen.tsx: under the bars, `categorySplit(entries of the selected month, kind)` in `TrendCategoryList`, or "Nothing recorded this month" when empty; updates with the selected month and pill

## Phase 4: User Story 3 — one category's history (P2)

**Independent test**: tap a category, check its bars, "Usually X / month" and sentence, go back and find Trends unchanged.

- [X] T012 [US3] `TrendCategoryScreen` in src/features/home/screens/trend-category-screen.tsx: params `kind`, `category`, `month` (invalid → `DataError` or back to the kind's list); title = category label; `TrendBars` of `monthTotals(..., kind, category)` with `month` selected and local selection on tap; "Usually X / month" from `trendAverage` (hidden when null); `averageSentence(..., 'usual')`
- [X] T013 [US3] In src/features/home/screens/trends-screen.tsx: tapping a category row → `router.push({ pathname: '/trend-category', params: { kind, category, month: selected } })`; Trends keeps its pill and month on return

## Phase 5: User Story 4 — savings goals across months (P2)

**Independent test**: on the Saved pill, check goal marks and "Goal reached in X of the last Y months".

- [X] T014 [US4] In src/features/home/trends.ts: `savingsGoals(entries, months, planVersions)` → `{ month, goal: number | null, reached }[]` using `savingsGoal` and `savingsPercentFor` (goal null when income is 0 or goal is 0; reached when saved ≥ goal), and `goalCount(goals)` → `{ reached, of }`
- [X] T015 [US4] In src/features/home/screens/trends-screen.tsx: on the Saved pill only, pass goals to `TrendBars` and show "Goal reached in X of the last Y months" when `of > 0`

## Phase 6: Polish

- [X] T016 Baseline spec: specs/002-income-plan/spec.md FR-004 mentions the "See trends ›" link (see 020)
- [X] T017 test-writer writes the unit and integration tests from specs/020-trends/spec.md
- [X] T018 Run `npx expo lint`, `npx tsc --noEmit` and `npx jest --maxWorkers=2`
- [X] T019 Check on the phone with `npm run demo` following quickstart.md, light and dark mode
- [X] T020 code-reviewer reviews 020-trends; fix BLOCKER/MAJOR findings

## Phase 7: Design review round

- [X] T021 Spec: US1-4, US1-10, US1-11, US2-4, US2-5, US4-1, FR-003, FR-005, FR-007, FR-009, SC-003 in specs/020-trends/spec.md
- [X] T022 Tokens in src/shared/theme/theme.ts: `Radius.bar` 4, `Opacity.fadedBar` 0.45, `Size.goalMark` 6, `Size.goalMarkWidth`, `Size.trendBarMin`, `Size.keySample`
- [X] T023 src/features/home/components/trend-bars.tsx: dashed average over the bars, key, outlined wide goal marks, baseline, unfinished current month with "so far", height transitions, labels with average and goal state
- [X] T024 src/features/home/components/trend-category-list.tsx: title outside the card, empty line inside it, "vs usual" line per row, one-line amounts, minimum fill width
- [X] T025 src/features/home/screens/trends-screen.tsx and trend-category-screen.tsx: per-category usual, live region, one-line figure, radiogroup; default "Category" title in src/app/_layout.tsx
- [X] T026 test-writer updates the tests for the revised spec
- [X] T027 Run lint, typecheck and tests (`--maxWorkers=2`)
- [X] T028 code-reviewer reviews 020-trends again

## Dependencies

- Phase 1 blocks all stories (T003 after T002; T005 needs the screen files from T008/T012 to exist, so create stub screens with it or do it with T008).
- US1 (T006–T009) is the MVP. US2 and US4 extend `trends-screen.tsx` after US1; US3 needs US2's rows (T013 after T010–T011).
- Polish after all stories.

## Parallel opportunities

- T001, T002, T004 touch different files.
- T007 (component) and T006 (pure logic) can be written in parallel; T010 and T014 too.

## Implementation strategy

Ship US1 first and check it on the phone (bars, sentence, link from home); then US2 (categories), US4 (goals) and US3 (detail). Tests come from the test-writer once all stories are in, then lint/typecheck/tests, phone check and review.
