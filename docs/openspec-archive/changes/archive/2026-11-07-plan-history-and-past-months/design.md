# Design

## Context

Today `plan` is a single-row SQLite table (schema version 2) and `month_income_override` is keyed by `YYYY-MM`. The home screen always shows the current month. Navigation is an Expo Router `Stack`.

## Goals / Non-Goals

**Goals:**
- Resolve the plan of any month with one pure function.
- Keep the migration lossless.
- One new screen.

**Non-Goals:**
- Swipe gestures between months, a list of plan versions, deleting versions.

## Decisions

### 1. Plan versions keyed by effective month
New table `plan_version(effective_month TEXT PRIMARY KEY, income_cents, fixed_cents, savings_pct)`. Saving the plan upserts the row for the current month. The plan of month `m` is the version with the greatest `effective_month <= m` (string comparison works for `YYYY-MM`). Domain: `planForMonth(versions, month): IncomePlan | null`, versions loaded once (they are few).
*Alternative:* `valid_from` / `valid_to` ranges — more to keep consistent, no benefit.

### 2. Migration v2 → v3
In one transaction: create `plan_version`, insert the existing plan with `effective_month` = the earliest of the current month and the oldest override month (so no month that already had data loses its plan), drop `plan`. The month is computed in JS (device local time) and passed as a parameter.

### 3. Selected month lives in the home route
Home reads an optional `month` search param (`/?month=2026-09`); without it, it shows the current month. The picker is a new route `src/app/month-picker.tsx` that navigates back to home with `router.dismissTo({ pathname: '/', params: { month } })` (check the SDK 58 Expo Router docs for the exact API). Keeping the month in the URL avoids global state.
*Alternative:* React context for the selected month — extra provider for one value.

### 4. Read-only rule in one place
`isPastMonth(month, currentMonth)` in the domain decides it. Home hides "Edit plan" and "Change this month's income" for past months and shows "Back to current month". The editor and the override screen keep acting only on the current month, so there is no path to write a past month.

### 5. Picker bounds
Year range: from the year of the first plan version (or the current year when there is none) to the current year. Months after the current month are disabled.

## Risks / Trade-offs

- [Month boundaries use the device's time zone; travelling across a month change could shift which month a save applies to] → acceptable for a single-user app.
- [If the user sets up the app for the first time late in a month, earlier months show "no plan"] → expected behaviour, matches the spec.
