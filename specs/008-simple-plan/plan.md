# Implementation Plan: Simple Plan

**Branch**: `feat/008-simple-plan` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

## Summary

The plan becomes one savings percentage per plan version (20 % when none is saved). Entries become income, savings or expense; `fixed` and `leisure` merge into `expense`. Home shows income, savings against the goal, spent and left to spend, computed by one pure function in `home`. The fixed expenses list, the plan editor with its trial income, the leisure part, the shortfall warning, the ring and the bar are removed. Migration step 4 converts the data. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-router, expo-sqlite (already installed)

**Storage**: SQLite on the device. See [data-model.md](./data-model.md).

**Testing**: Jest with the Node SQLite test double; E2E on the Android emulator.

**Target Platform**: Android

**Project Type**: Mobile app

**Performance Goals**: None beyond normal screen loads.

**Constraints**: Offline only; integer cents; migrations are transactional.

**Scale/Scope**: 1 migration step; removes 1 table, 2 routes and about 10 files.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Nothing leaves the device. |
| II. Keep It Simple | Pass. One number for the plan, three entry kinds, one rule. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Pass. The goal is rounded down to the cent with integer maths. |
| V. English in the Repository | Pass. |
| Migrations preserve data | Pass (constitution 1.2.0, pre-v1.0.0 rule). Step 4 keeps every entry and amount; it drops the fixed expenses list and leisure-based plans by design, agreed with the developer before v1.0.0 (see research.md R3). |
| Baseline specs updated | Pass. 001, 002 and 003 in the task list. |

## Project Structure

### Documentation

```text
specs/008-simple-plan/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
└── contracts/writes.md
```

### Source Code

```text
src/db/migrations.ts, demo-data.ts
src/test-support/released-schemas.ts, app.tsx, damaged-data.ts
src/shared/buckets.ts, theme/theme.ts, ui/bucket-badge.tsx
src/features/expenses/  rules, repository, service, hooks (+ use-first-entry-month),
                        expense-list, expense-screen, month-picker-screen (moved from plan)
src/features/plan/      rules, repository, service, hooks/use-plan-versions
src/features/home/      month-summary.ts (new), screens/home-screen.tsx, screens/plan-screen.tsx
src/app/                remove plan-edit.tsx and fixed-expenses.tsx; month-picker.tsx points to expenses
Removed: plan-edit-screen, fixed-expenses-screen, fixed-items-editor, amount-field, plan-form,
         use-income-plan, shared/ui plan-bar, plan-donut, shortfall-warning
```

**Structure Decision**: Existing feature layout. The month summary needs entries and the plan, so it lives in `home`. The month picker only needs the first entry month, so it moves to `expenses`. The plan screen stays in `home` because it shows this month's income.
