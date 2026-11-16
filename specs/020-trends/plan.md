# Implementation Plan: Trends

**Branch**: `feat/020-trends` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

## Summary

One query loads the entries of the six months shown; pure functions in `src/features/home/trends.ts` turn them, with the plan versions, into month totals, the average, the sentence, the category list and the savings goals. Two screens in `home` (Trends and a category's detail) draw them with plain views: a `TrendBars` component for the six bars and a `TrendCategoryList` for the horizontal bars. Home's "Spending pace" title gets a "See trends ›" link.

## Technical Context

**Dependencies**: none new. Bars are `View`s; Expo Router `router.push` / `router.dismissTo` (already used by the month picker) for navigation.

**Storage**: none; read-only. One new read, `getEntriesBetween(db, fromMonth, toMonth)`, in the entries repository (format-checked like every read).

**Testing**: unit tests for `trends.ts` (totals, months in use, average, 5 % band, sentence wording, goals and count, `lastMonths`); integration tests rendering home → Trends → category detail → back → "Open <Month>" on the test database. A Maestro flow is not needed: nothing native (no picker, keyboard or dialog) is involved; the existing home flow keeps covering home.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Local reads only. |
| II. Keep It Simple | Pass. No library, no table, no cache; one query per screen focus. |
| IV. Money Is Integer Cents | Pass. Sums in cents; average with `Math.floor`; the 5 % band compares `|diff| × 20 ≤ average` in integers. |
| Architecture | Pass. Trends combines entries and plan, so it lives in `home`; the new read and hook live in `entries`; month helpers in `src/shared/months.ts`. |
| Styles rule | Pass. New tokens only (`Size.trendBars`, `Size.trendBarWidth`, `Size.goalMark`, `Size.categoryBar`, `Radius.bar`, `Opacity.fadedBar`); text through `ThemedText`; links through `LinkButton`, pills through `Pill`, cards through `Card`. |
| Baseline specs | 002 FR-004 gets the link. |

Post-design re-check: unchanged.

## Design

### Data

- `src/shared/months.ts`: `lastMonths(month, count)` → month keys oldest first, ending at `month` (built on `previousMonth`).
- `src/features/entries/repository.ts`: `getEntriesBetween(db, from, to)` — `WHERE substr(date, 1, 7) BETWEEN ? AND ?`, mapped with `toEntry`.
- `src/features/entries/hooks/use-entries-between.ts`: `useEntriesBetween(from, to)` through `useFocusedData`, so returning from an entry reloads.

### Pure logic — `src/features/home/trends.ts`

- `monthTotals(entries, months, kind, category?)` → `{ month, cents }[]` in `months` order.
- `monthsInUse(entries)` → set of month keys with any entry.
- `trendAverage(totals, inUse, currentMonth)` → cents or `null`: the months before `currentMonth` that are in use, `floor(sum / count)`; `null` when none or 0 (FR-003).
- `averageSentence(cents, average, isCurrent, format, word)` with `word` `'your average' | 'usual'`: "X more than …", "X less than …", "About …" when `|cents − average| × 20 ≤ average`; prefixed "So far, " in the current month with the first letter lowered (FR-004, FR-006). "About usual" / "X more than usual".
- `savingsGoals(entries, months, planVersions)` → per month `{ month, goal: number | null, reached: boolean }` with `goal = savingsGoal(income, savingsPercentFor(versions, month))`, `null` when income is 0 or goal is 0 (FR-007, same rule as `monthSummary`).
- `goalCount(goals)` → `{ reached, of }`.
- The category list reuses `categorySplit` from entries on the selected month's entries.
- `TREND_PILLS`: `[{ kind: 'expense', label: 'Spent' }, { kind: 'savings', label: 'Saved' }, { kind: 'income', label: 'Income' }]`.

### UI

- `src/app/trends.tsx` → `home/screens/trends-screen.tsx`; `src/app/trend-category.tsx` (params `kind`, `category`, `month`) → `home/screens/trend-category-screen.tsx`. Titles "Trends" and the category name in `_layout.tsx` / `Stack.Screen options`.
- **TrendsScreen**: state `kind` (`'expense'`) and `selected` (current month). Pills row; month name and big number (`ThemedText` title type); sentence; `TrendBars`; on Saved the count line; "By category" `TrendCategoryList` or "Nothing recorded this month"; `LinkButton` "Open <Month> ›" → `router.dismissTo({ pathname: '/', params: { month } })`. State survives going to the detail and back because the stack keeps the screen mounted.
- **TrendBars** (`home/components/trend-bars.tsx`): a row of six `Pressable` columns of height `Size.trendBars`; each bar's height = cents ÷ scale, scale = max(bars, average, goals); highlighted bar in `kindInk[kind]`, others with `Opacity.fadedBar`; the average as an absolutely positioned faint solid `View` line (`BORDER_WIDTH`, secondary text color at `Opacity.fadedBar`; Android does not draw one-sided dashed borders); goal marks as short lines (`Size.goalMark`); short month name under each. Each column has `accessibilityRole="button"`, label "<Month>: <amount>", `accessibilityState.selected`.
- **TrendCategoryList** (`home/components/trend-category-list.tsx`): `Card` with rows: icon, name, amount, and a bar whose width is `cents / largest` as a percentage; each row is pressable → detail.
- **TrendCategoryScreen**: same bars for one category (no pills, no goals), "Usually X / month" and the sentence with "usual"; bars still select the month locally.
- **Home**: `SpendingPaceSection` title row gets `LinkButton` "See trends ›" → `router.push('/trends')`.

### Demo data

- `src/db/demo-data.ts` gets six varied months (a holiday month, a bonus month, freelance income, four monthly entries, the goal reached in four of six months) so Trends can be checked with `npm run demo`; days are clamped to each month's length.

### Design review round (2026-11-16)

Three reviews (UI audit, data-viz check, comparison with Revolut, Monzo, Copilot, Emma, N26) led to:

- Average line dashed (`react-native-svg`, as the pace chart) and drawn over the bars, named in a key ("Avg X"); goal marks 38 wide with a `backgroundElement` outline, named "Goal" in the key; `Opacity.fadedBar` 0.45 (≥ 3:1 on the card); a faint baseline; `Radius.bar` 4 and `Size.trendBarMin` 8.
- Current month drawn unfinished (dashed outline, `kindTint` fill) with "so far" under its name.
- Bar heights and goal marks animate with Reanimated CSS transitions (instant with reduced motion).
- Each category row shows its month against its own usual (`trendAverage` per category + `averageSentence(..., 'usual')`).
- "By category" titled outside its card like home's sections; amounts on one line (`adjustsFontSizeToFit`); live region on the figure; pills as a radiogroup; bar labels with the average and goal state; default header "Category".

## Complexity Tracking

None.
