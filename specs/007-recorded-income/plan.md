# Implementation Plan: Recorded Income

**Branch**: `feat/007-recorded-income` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

## Summary

Income becomes a third kind of recorded entry, stored in the existing `expense` table with `bucket = 'income'`, so it reuses the same list, form, service and validation. The plan stops storing an income. Migration step 3 turns each month's income into one entry and removes the one-month override. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-router, expo-sqlite (already installed)

**Storage**: SQLite on the device. See [data-model.md](./data-model.md).

**Testing**: Jest with the Node SQLite test double.

**Target Platform**: Android

**Project Type**: Mobile app

**Performance Goals**: None beyond normal screen loads.

**Constraints**: Offline only; integer cents; migrations are transactional and keep all data.

**Scale/Scope**: 1 migration step; removes 1 table, 1 screen and 1 route.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Nothing leaves the device. |
| II. Keep It Simple | Pass. One record type; a table, a screen and a rule are removed. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Pass. |
| V. English in the Repository | Pass. |
| Migrations preserve data | Pass. Step 3 with its saved structure and upgrade tests. |
| Baseline specs updated | Pass. 001, 002 and 003 in the task list. |

No violations.

## Project Structure

### Documentation

```text
specs/007-recorded-income/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
└── contracts/writes.md
```

### Source Code

```text
src/db/migrations.ts, demo-data.ts
src/test-support/released-schemas.ts, app.tsx, damaged-data.ts
src/shared/buckets.ts, theme/theme.ts, ui/bucket-badge.tsx
src/features/expenses/  rules, repository, service, hooks, expense-list, expense-screen
src/features/plan/      rules, repository, service, plan-form, use-income-plan, plan-edit-screen
src/features/home/screens/home-screen.tsx, plan-screen.tsx (moved from plan)
Removed: src/app/month-income.tsx, src/features/plan/screens/month-income-screen.tsx
```

**Structure Decision**: Existing feature layout. My plan needs the month's income and the plan, so it moves to `home`, the only feature that combines others.
