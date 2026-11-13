# Implementation Plan: Entry Form and Daily Budget

**Branch**: `feat/017-entry-and-daily-budget` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

## Summary

A pure `dailyAllowance(left, today, month)` in `home/month-summary.ts` feeds a line under "Left to spend". The entry form opens Android's date picker (`DateTimePickerAndroid.open` from `@react-native-community/datetimepicker`) when the date is tapped, shows a note example per kind and drops the kind description. No data changes.

## Technical Context

**Dependencies**: `@react-native-community/datetimepicker` 9.2.1 (installed with `npx expo install`, config plugin added to app.json; approved by the developer). Native module: in Expo Go; the APK needs a new build.

**Testing**: unit for `dailyAllowance`; integration for the daily line and the form (the library ships `jest/` helpers `mockAndroidDialogDateChange` / `mockAndroidDialogDismissal`).

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Local picker, nothing leaves the device. |
| II. Keep It Simple | Pass. The imperative Android API, no picker component or wrapper. Library approved. |
| IV. Money Is Integer Cents | Pass. `Math.floor(left / days)` on cents. |
| Baseline specs updated | 002 FR-004, 001 FR-001. |
| Architecture | Pass. Rule in `home`, form in `entries`. |
| Styles rule | Pass. Text types and tokens only. |

## Design

- `dailyAllowance(leftCents, today, month)`: `null` unless `month === monthKey(today)` and `leftCents > 0`; `daysLeft = lastDayOfMonth - today.getDate() + 1`; `{ cents: Math.floor(leftCents / daysLeft), daysLeft }`.
- Home: `LeftToSpend` gets the allowance and renders `≈ X / day · N days left` or `Today: X` (`formatEuros`), in `Hero.label`, `small` type, below the figure, part of the card's accessibility label.
- Form: the date text becomes a pressable (role button, label "Date: <day>. Pick a day") that calls `DateTimePickerAndroid.open({ value, mode: 'date', minimumDate, maximumDate, onValueChange })`; `value`/limits built as local dates from the day keys. `NOTE_EXAMPLES` per kind in `src/shared/kinds.ts`; `KIND_DESCRIPTIONS` removed if unused.
