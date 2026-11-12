# Implementation Plan: Activity Screen

**Branch**: `feat/014-activity-screen` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

## Summary

Home's Activity list shows the 5 newest entries of the filtered list and a "See all (N)" link when there are more. The link opens a new route `/activity?month=YYYY-MM&kind=…` that lists the whole month in a virtualized `FlatList` with All / Income / Spent / Savings filters. Rows are shared between home and the new screen. No new data, no new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-router, react-native-reanimated (already installed). No new ones.

**Storage**: Not affected. The Activity screen reads the month with the existing `useMonthEntries` hook.

**Testing**: Jest. Unit: the "first 5 / count" rule. Integration: home → See all → Activity → edit → back journeys on the test database.

**Target Platform**: Android

**Project Type**: Mobile app

**Performance Goals**: 300 entries open in under 1 s and scroll smoothly (SC-003).

**Constraints**: home looks as today apart from the shorter list and the link; same row look in both places.

**Scale/Scope**: 1 new route, 1 new screen, entry list split into a row and a list, home edits, 001 spec update.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Nothing leaves the device. |
| II. Keep It Simple | Pass. Core `FlatList`, a fixed number 5, no setting, no library. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Not affected. |
| V. English in the Repository | Pass. |
| Migrations preserve data | Not affected (no migration). |
| Baseline specs updated | Required: `001-expenses` FR-006, FR-009, US6, US8 (spec FR-007). |
| Architecture boundaries | Pass. The Activity screen lives in `entries` (it only needs entries); `home` links to the route by path and imports only from `entries`. |

Re-checked after design: still passes.

## Project Structure

```text
src/app/_layout.tsx                                 register "activity" screen
src/app/activity.tsx                                route → entries/screens/activity-screen
src/features/entries/rules.ts                       HOME_LIST_SIZE, entriesOfKind(), firstEntries()
src/features/entries/components/entry-list.tsx      export a memoized EntryRow; EntryList uses it
src/features/entries/components/kind-filter.tsx     All / Income / Spent / Savings pills (Activity only)
src/features/entries/screens/activity-screen.tsx    FlatList of the month, filter, header title
src/features/home/screens/home-screen.tsx           first 5 + "See all (N)" link
specs/001-expenses/spec.md                          FR-006, FR-009, US6, US8 updated
```

## Design Notes

- See [research.md](./research.md) for the list choice, params and refresh, [contracts/activity-route.md](./contracts/activity-route.md) for the route.
- "Spent" is the expense filter's label everywhere (as the home tile), "Income" and "Savings" use `KIND_LABELS`.
