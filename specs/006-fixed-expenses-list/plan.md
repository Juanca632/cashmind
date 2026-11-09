# Implementation Plan: Fixed Expenses List

**Branch**: `feat/006-fixed-expenses-list` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

## Summary

The plan's fixed expenses become a list of named euro items, stored per plan version. Their sum replaces the fixed amount everywhere, so the monthly calculations keep their shape. One new migration step moves existing data. The plan screen reads list, income, split; savings and wants become percentages of the total income only; the home screen shows the list and new expenses are only wants or savings. No new dependencies.

Guiding constraint from the developer: the app must be easy, with one predictable rule rather than conditional cases. One point is open for review in [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-router, expo-sqlite (all already installed)

**Storage**: SQLite on the device. New table `fixed_item`; `plan_version` loses its fixed columns. See [data-model.md](./data-model.md).

**Testing**: Jest with the Node SQLite test double, which runs the real SQL.

**Target Platform**: Android

**Project Type**: Mobile app

**Performance Goals**: None beyond normal screen loads; a list has a handful of items.

**Constraints**: Offline only; integer cents; migrations run in a transaction and keep all data.

**Scale/Scope**: 1 migration step, 1 new table, about 12 source files.

## Constitution Check

| Principle | Before design | After design |
| --- | --- | --- |
| I. Privacy First | Pass. Stays on the device. | Pass. Format errors name the field only. |
| II. Keep It Simple | Pass. No libraries or layers. | Pass. The list has one rule and lives in the existing plan screen. |
| III. Android First | Pass. | Pass. |
| IV. Money Is Integer Cents | Pass. | Pass. Item amounts are integer cents, checked by the database. |
| V. English in the Repository | Pass. | Pass. |
| Migrations versioned, transactional, preserving data | Pass. | Pass. New step 2, with its structure saved and an upgrade test. |
| Baseline specs updated in the same change | Pass. | Pass. 001 and 002 are in the task list. |

No violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-fixed-expenses-list/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/plan-writes.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```text
src/db/migrations.ts                               # step 2
src/test-support/released-schemas.ts               # structure of version 2
src/test-support/app.tsx                           # plans seeded with items
src/db/__tests__/migrate-test.ts                   # upgrade with sample data
src/features/plan/
├── rules.ts                                       # items, total, validation
├── repository.ts                                  # read and save items with the version
├── service.ts                                     # unchanged flow, new validation
├── components/fixed-items-editor.tsx              # new
├── components/fixed-items-list.tsx                # new, read-only list
└── screens/plan-screen.tsx                        # list, income, what is left, split
src/features/expenses/
├── rules.ts                                       # new expenses are wants or savings
├── service.ts
└── screens/expense-screen.tsx                     # two choices
src/features/home/screens/home-screen.tsx          # Fixed card shows the list
src/shared/buckets.ts                              # Fixed label, suggestions
src/shared/ui/bucket-rows.tsx                      # Fixed row has no progress
specs/001-expenses/spec.md, specs/002-income-plan/spec.md
```

**Structure Decision**: The existing feature layout. The list belongs to the `plan` feature; only `home` combines it with expenses.
