# Implementation Plan: Spending Pace

**Branch**: `feat/019-spending-pace` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

## Summary

A pure `spendingPace()` in `src/features/home/month-summary.ts` turns the month's entries and its spendable amount into a step curve of cumulative expenses per day and a straight pace line from the repeating expenses to the spendable amount. A `SpendingPaceChart` component draws both with `react-native-svg`; home shows it under a new "Overview" title for the tiles and a "Spending pace" title, with one comparison sentence in the current month.

## Technical Context

**Dependencies**: `react-native-svg` (SDK 58 recommends 15.16.0, included in Expo Go), installed with `npx expo install react-native-svg`; approved by the developer on 2026-11-15. No config plugin needed.

**Storage**: none; derived from the entries home already loads (`recurringId` from 018 marks the fixed costs).

**Testing**: unit tests for `spendingPace` (steps, line, rounding, flat line, past month, first day); integration for the section, sentence and titles on home. The svg renders in Jest through the library's own components; tests assert the sentence and the accessible description, not pixels.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Local drawing only. |
| II. Keep It Simple | Pass. One pure function, one component; svg only for the curve and line (the library was approved). |
| IV. Money Is Integer Cents | Pass. Cumulative sums and `Math.floor` on cents. |
| Architecture | Pass. Logic in `home` (which combines entries and plan); the chart is a `home` component. |
| Styles rule | Pass. New tokens `Size.chart` (height) and existing `BORDER_WIDTH` for the stroke; text through `ThemedText`. |
| Baseline specs | 002 FR-004. |

## Design

- `spendingPace({ entries, spendableCents, month, today })` → `{ daysInMonth, lastDay, steps: { day, cents }[], startCents, endCents, spentCents, paceTodayCents | null }`:
  - `startCents` = sum of the month's expenses with `recurringId !== null`; `endCents` = `max(startCents, spendableCents)` where spendable = income − max(goal, saved).
  - `lastDay` = today's day in the current month, else `daysInMonth`.
  - `steps`: for each day 1…lastDay, cumulative expenses with date ≤ that day.
  - `pace(d)` = `startCents + floor((endCents − startCents) × d / daysInMonth)`; `paceTodayCents` only in the current month.
- `paceSentence(spent, pace)`: "X over your pace" / "X under your pace" / "Right on your pace" (`formatEuros`).
- `SpendingPaceChart`: measures its width (`onLayout`), scales x by day (0…N) and y by `max(endCents, spent)`; draws the dashed line (`Line`) and the step curve (`Path`, `H`/`V` segments) in `kindInk.expense`, a dot at the last point; labels under/beside it as `ThemedText` captions (line start and end amounts; days 1, middle, N). The whole chart is one accessible element with the FR-004 description.
- Home: "Overview" title above the tiles and "Spending pace" section between the tiles and Activity, both only with income, same title style as Activity.

## Complexity Tracking

None.
