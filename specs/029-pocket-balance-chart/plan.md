# Implementation Plan: Pocket balance chart

**Branch**: `feat/029-pocket-balance-chart` | **Date**: 2026-11-25 | **Spec**: [spec.md](./spec.md)

## Summary

A pure function builds the pocket's day-by-day balance for the current month from its entries and moves. A `BalanceChart` component in `home` draws it with `react-native-svg`, in the same way as `SpendingPaceChart`. `PocketSpace` shows it in a "This month" card below the tiles. No storage change.

## Technical Context

**Dependencies**: none new (`react-native-svg` is already used).

**Testing**:
- **Unit tests**: `pocketMonth` (start, steps, today's value, the change and its sentence).
- **Integration tests**: the section and its accessible label on a pocket's space.

## Constitution Check

| Principle | Result |
| --- | --- |
| II. Simple | Pass. One chart, current month only, no interaction. |
| IV. Money | Pass. Integer cents. |
| Architecture | Pass. `home` combines entries and moves; the rule is pure and tested. |

## Design

- **Rule** (`src/features/home/pocket-month.ts`):
  - `pocketMonth(pocket, entries, moves, today)` returns `{ daysInMonth, startCents, steps: { day, cents }[], endCents }`;
  - `entries` are the pocket's own (savings +, expenses −), and `moves` are all moves (out of the pocket −, into it +);
  - `startCents` is the starting amount plus everything dated before the month;
  - `steps` has one point at the end of each day from the 1st to today;
  - `endCents` is today's value.
  - `balanceSentence(change, format)` gives "Up X this month", "Down X this month" or "No change this month".
- **`BalanceChart`** (`src/features/home/components/balance-chart.tsx`):
  - the same layout as `SpendingPaceChart`: `Size.chart` high, `EDGE` margins, a fill gradient and a dot;
  - the line in `theme.kindInk.savings`;
  - a dashed flat line at `startCents`;
  - the range is the min and max of every value drawn;
  - dates under it.
- **`PocketSpace`**: a "This month" section after the round actions, with a `Card` holding the sentence (`smallBold`) and the chart.
