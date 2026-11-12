# Tasks: Activity Screen

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [contracts/activity-route.md](./contracts/activity-route.md), [quickstart.md](./quickstart.md)

**Tests**: Required. Written by the test-writer subagent from the spec.

## Phase 1: Foundational

- [X] T001 [P] In src/features/entries/rules.ts add `HOME_LIST_SIZE = 5`, `entriesOfKind(entries, kind | null)` (null returns all, order kept) and `firstEntries(entries, size)` returning `{ shown, total }` (the first `size` entries and the list length)
- [X] T002 [P] In src/features/entries/components/entry-list.tsx extract the row into an exported `EntryRow` wrapped in `React.memo` (props: entry, today, onPress); `EntryList` keeps its Animated.View wrappers and fade/layout animations and renders `EntryRow` inside them; same look as today

## Phase 2: User Story 1 - Home stays short (P1)

- [X] T003 [US1] In src/features/home/screens/home-screen.tsx pass `firstEntries(entriesOfKind(monthEntries, selected), HOME_LIST_SIZE).shown` to `EntryList`; when `total > HOME_LIST_SIZE` show a `Button` variant "secondary" labelled `See all (N)`, accessibility label `See all N entries`, below the list card, which pushes `{ pathname: '/activity', params: { month, kind: selected ?? undefined } }`

## Phase 3: User Story 2 - See the whole month (P1)

- [X] T004 [US2] Add src/features/entries/screens/activity-screen.tsx: read `month` and `kind` params (invalid or future month → current month; kind not `income|savings|expense` → All, per contracts/activity-route.md); load with `useMonthEntries(month)`; `DataError` on error, empty `ThemedView` while loading; header via `<Stack.Screen options={{ title: \`Activity · ${formatMonth(month)}\` }} />`; a `FlatList` (keyExtractor = String(entry.id), `useCallback` renderItem rendering `EntryRow`, bottom safe-area padding) of the filtered entries; tapping a row pushes `/entry?id=<id>`; empty text "Nothing was recorded this month." for All
- [X] T005 [US2] Add route src/app/activity.tsx re-exporting the screen, and register `<Stack.Screen name="activity" options={{ title: 'Activity' }} />` in src/app/_layout.tsx

## Phase 4: User Story 3 - Filter by kind (P2)

- [X] T006 [US3] Add src/features/entries/components/kind-filter.tsx: a row of pills All, Income, Spent, Savings (labels from `KIND_LABELS`, "Spent" for expense), selected pill uses `accessibilityState.selected` and the kind's tint/ink colors from the theme (accent for All), min touch height, `hapticTick()` on change
- [X] T007 [US3] In activity-screen.tsx keep the filter in local state initialised from the `kind` param, render `KindFilter` above the list (as `ListHeaderComponent`), filter with `entriesOfKind`, and show home's per-kind empty texts ("No income this month.", "No savings this month.", "No expenses this month.")

## Phase 5: Polish

- [X] T008 [P] Update baseline specs/001-expenses/spec.md: FR-006 (home lists the 5 newest, "See all (N)" opens the Activity screen with the whole month), FR-009 (the tile filter applies to the short list and is the starting filter of the Activity screen, which has its own All/Income/Spent/Savings filter), User Story 6 and 8 scenarios
- [X] T009 test-writer subagent writes the tests from specs/014-activity-screen/spec.md: unit for `entriesOfKind` and `firstEntries`; integration journeys home → See all → Activity → filter → edit/delete → back, the link only above 5, past months, params fallback, unreadable data
- [X] T010 Run `npx expo lint`, `npx tsc --noEmit` and `npx jest --maxWorkers=4`
- [X] T011 E2E of quickstart.md by the e2e-tester subagent (2026-11-12: steps 1-6 and both themes pass; step 7 used a 58-entry month added by hand since demo months have about 8 entries; all rows reachable; open time about 1.7 s in Expo Go dev mode, so SC-003 is to be confirmed on the release APK)

## Dependencies

- T001 and T002 in parallel, before the stories.
- T003 needs T001; it can be built before T004/T005 but the link only works after T005.
- T004 needs T001 and T002; T005 needs T004; T007 needs T004 and T006.
- T008 can be done at any point; T009 after T007; T010 after T009; T011 last.

## Parallel Examples

- T001 + T002 (different files).
- T006 + T004 (different files), then T007.
- T008 alongside any implementation task.

## Implementation Strategy

MVP is US1 + US2 (T001–T005): home stays short and the whole month is reachable. US3 adds the filter. Each phase is checked on the emulator with the matching quickstart steps.
