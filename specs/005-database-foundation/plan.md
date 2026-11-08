# Implementation Plan: Database Foundation

**Branch**: `feat/005-database-foundation` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

## Summary

Replace the single conditional migration function with an ordered list and a small runner. Make the v1 structure strict, show a message when an update fails, and test upgrades from saved structures. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-sqlite (bundles SQLite 3.53, STRICT needs 3.37)

**Storage**: SQLite on the device. Tables and columns unchanged; constraints added.

**Testing**: Jest with the Node SQLite test double, which runs the real SQL.

**Target Platform**: Android

**Project Type**: Mobile app

**Constraints**: Offline only; integer cents; `SQLiteProvider` throws initialization errors during render.

**Scale/Scope**: 3 tables, 1 migration step today.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Error messages contain no data. |
| II. Keep It Simple | Pass. No libraries or copy mechanism. Validated by the developer. |
| IV. Money Is Integer Cents | Pass. Now also enforced by the database. |
| Migrations versioned, in a transaction, preserving data | Pass. Strengthened by this feature. |

## Project Structure

```text
src/db/
├── database.ts            # Name and entry point
├── migrate.ts             # Runner and its two errors
├── migrations.ts          # Ordered list of steps
└── database-boundary.tsx  # Shows the message for update errors only
src/test-support/released-schemas.ts   # Structure of each released version
```

**Structure Decision**: Everything stays in `src/db`. `src/app/_layout.tsx` is the only route that uses it.

## Complexity Tracking

No violations.
