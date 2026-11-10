# Implementation Plan: Rename Entries

**Branch**: `feat/009-rename-entries` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

## Summary

A mechanical rename with no behavior change. Migration step 5 rebuilds the `expense` table as `entry`, with the column `bucket` renamed to `kind`. In the code, `src/features/expenses` becomes `src/features/entries` and `shared/buckets` becomes `shared/kinds`. Types, functions, hooks, components and the `/expense` route are renamed as in [data-model.md](./data-model.md). No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-router, expo-sqlite (already installed)

**Storage**: SQLite on the device; step 5 renames the table and its column.

**Testing**: Jest (renames in tests done by test-writer); E2E by e2e-tester.

**Target Platform**: Android

**Project Type**: Mobile app

**Constraints**: Visible texts and behavior unchanged; every row kept.

**Scale/Scope**: about 30 files, 1 migration step, 1 route.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. |
| II. Keep It Simple | Pass. Names match the model; nothing added. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Pass. Amounts copied unchanged. |
| V. English in the Repository | Pass. |
| Migrations | Pass. Step 5 is versioned, transactional and keeps every row. |
| Baseline specs updated | Pass. Only names that the specs mention (route, table) change. |

## Project Structure

```text
src/features/expenses/ -> src/features/entries/
  components/expense-list.tsx -> entry-list.tsx
  screens/expense-screen.tsx -> entry-screen.tsx
  hooks/use-expense.ts -> use-entry.ts, use-month-expenses.ts -> use-month-entries.ts
src/shared/buckets.ts -> src/shared/kinds.ts
src/shared/ui/bucket-badge.tsx -> kind-badge.tsx
src/app/expense.tsx -> src/app/entry.tsx
src/db/migrations.ts (step 5), demo-data.ts
src/test-support/released-schemas.ts (schema 5), app.tsx, damaged-data.ts
eslint.config.js (feature zones and names)
```

**Structure Decision**: Existing layout, renamed.
