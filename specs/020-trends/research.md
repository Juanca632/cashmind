# Research: Trends

## Bars without a chart library

- **Decision**: plain `View`s with heights in proportion to a scale.
- **Rationale**: bars are rectangles; views are themable, accessible and pressable for free. The developer asked for no new libraries.
- **Alternatives**: `react-native-svg` (installed, used for the pace curve) — not needed for rectangles and harder to make each bar a button; a chart library — rejected (new dependency).

## Where the logic lives

- **Decision**: `src/features/home/trends.ts` and two `home` screens.
- **Rationale**: Trends needs entries and plan versions; only `home` may combine features (lint-enforced).
- **Alternatives**: a new `trends` feature — would have to import entries and plan, breaking the boundary rule.

## Loading six months

- **Decision**: one query for the date range, grouped in JavaScript.
- **Rationale**: six months of a personal budget are a few hundred rows at most; one read keeps the repository simple and reuses `toEntry` format checks.
- **Alternatives**: a `GROUP BY` SQL query per kind/category — more queries and a second row shape to check, for no visible gain.

## Going to a month on home

- **Decision**: `router.dismissTo({ pathname: '/', params: { month } })`, as the month picker does.
- **Rationale**: returns to the existing home in the stack instead of stacking a second home.

## Average and the 5 % band

- **Decision**: average of the earlier months in use, floored; "About" when `|diff| × 20 ≤ average`.
- **Rationale**: integer-only maths; leaves out the unfinished month and months before the user started (spec Assumptions).
