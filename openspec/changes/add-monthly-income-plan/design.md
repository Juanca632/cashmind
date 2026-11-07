# Design

## Context

Fresh Expo SDK 58 project (Expo Router, TypeScript, React Compiler) running in Expo Go on Android. No persistence, no tests and no app code yet; `src/app/` only holds the template's demo tabs. Requirements are in `specs/income-plan/spec.md`.

## Goals / Non-Goals

**Goals:**
- Exact money math in integer cents, covered by unit tests.
- Storage that keeps working in Expo Go (no development build yet) and can grow into expense tracking.
- Two screens and nothing more.

**Non-Goals:**
- State management libraries, form libraries, UI kits or a design system.
- A generic "bucket" model; the three buckets are fixed for now.

## Decisions

### 1. Money as integer cents
Income and targets are stored and computed as integer cents (`250000` = 2500,00 €). Input is parsed from text accepting `,` or `.` as decimal separator; display uses `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.
*Alternative:* floats — rejected, rounding errors on money.

### 2. Rounding rule: fixed expenses absorb the remainder
`savings = floor(income × savings% / 100)`, `leisure = floor(income × leisure% / 100)`, `fixed = income − savings − leisure`. Targets always add up to the income, and any leftover cent goes to fixed expenses, never inflating leisure or savings.
*Alternative:* largest-remainder method — fairer but more code for a one-cent difference.

### 3. Storage: `expo-sqlite` (new dependency)
Use `expo-sqlite` with two small tables: `plan` (single row: income_cents, fixed_pct, leisure_pct, savings_pct) and `month_income_override` (month `YYYY-MM` primary key, income_cents). Opened once through `SQLiteProvider` in the root layout, with a tiny `user_version`-based migration.
*Why:* it is an official Expo module, included in Expo Go, stores data only on the device, and the next change (expenses) needs real queries (sum by month and bucket).
*Alternatives:* `expo-sqlite/kv-store` or AsyncStorage — simpler today, but expenses would force a migration to SQL soon after. `expo-secure-store` — meant for small secrets, not records.

### 4. Code layout
- `src/domain/income-plan.ts` — pure functions: parse/format euros, validate plan, `targetsFor(income, percentages)`, `incomeForMonth(plan, overrides, month)`. No React, no storage. Unit tested.
- `src/data/income-plan-repo.ts` — read/write plan and overrides with SQLite.
- `src/app/index.tsx` — current month overview (or set-up prompt).
- `src/app/plan.tsx` — plan editor (income + three percentages + live preview).
- `src/app/month-income.tsx` — set/remove this month's income override.
- Navigation: a plain `Stack` in `src/app/_layout.tsx`; the template tabs are removed.

### 5. Tests: `jest-expo` + Jest 30 (new dev dependencies)
Unit tests only for `src/domain/` in this change (money math is where bugs would hurt). Screen tests are deferred; screens are checked on the phone.

## Risks / Trade-offs

- [SQLite is more setup than a key-value store for a single plan row] → kept to two tables and one migration; pays off with expenses.
- [Fixed expenses may differ by one cent from `income × pct`] → documented rule, covered by a test.
- [Percentage-only split can't express "exactly 400 € savings"] → accepted for MVP; fixed amounts can be a later change.
- [Month boundaries use the device's local time zone] → acceptable for a single-user, on-device app.
