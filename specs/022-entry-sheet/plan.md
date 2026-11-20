# Implementation Plan: Entry form redesign

**Branch**: `feat/022-entry-sheet` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

The entry route stays a normal stack page. Its content is regrouped in the app's own style: a segmented kind control, the amount large and alone in a kind-tinted `Card`, a titled category grid, the titled "Often recorded" suggestions row, and one `Card` of detail rows (Date, Repeat switch, Note field), then the buttons. The amount no longer autofocuses. The bottom sheet tried first is recorded in [bottom-sheet-attempt.md](./bottom-sheet-attempt.md).

## Technical Context

**Dependencies**: none new.

**Storage**: none.

**Testing**: integration tests updated for the new controls (kind radios, category grid, Date row, Repeat switch, Note field, no day arrows, no autofocus); Maestro flows that use the form updated by the `test-writer` and run on the release candidate.

## Constitution Check

| Principle | Result |
| --- | --- |
| II. Keep It Simple | Pass. No library; two small components in `entries`. |
| Architecture | Pass. Changes in `entries` only (screen, components). |
| Styles rule | Pass. Tokens and shared components only; `KindSegmented` and the grid use `Layout`, `Size`, `Radius`, `Opacity`, `IconSize`. |
| Baseline specs | 001 FR-001; 021 spec and contract. |

## Design

- **`KindSegmented`** (`entries/components/kind-segmented.tsx`): a `radiogroup` track on `backgroundElement` with three equal `radio` segments (Expense, Income, Savings); the selected one filled with `kindFill[kind]` and `onAccent` text; 48 dp touch height through `hitSlop`.
- **Amount**: `AmountField size="large"` (56, as My plan's percentage) inside `Card size="large"` tinted `kindTint[kind]`; the whole amount row focuses the input; `autoFocus` removed from the entry form.
- **Categories**: `CategoryChoices layout="grid"`: four per line, `Size.badge` circles (`kindFill` when selected, `kindTint` otherwise), names in `caption` that shrink to fit; `/recurring` keeps the wrapping pills.
- **Suggestions**: `QuickAddRow` with the "Often recorded" title (`smallBold`, `textSecondary`) and one sideways `ScrollView` of flat, neutral `Pill`s.
- **Details card**: a `Card` with a Date `Pressable` row (calendar icon, "Date", value, chevron) → `pickDate()`; a "Repeat every month" row with the native `Switch` (current month only); a Note `TextInput` row; hairline dividers.
- **Removed**: the kind tiles, the date row with one-day arrows, the `SwitchRow` and `TextField` on this form.

## Complexity Tracking

None.
