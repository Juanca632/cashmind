# Implementation Plan: Categories

**Branch**: `feat/015-categories` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

## Summary

Each entry gets a `category` from a fixed list per kind. Migration step 6 adds the column with default `'other'` and a check that the category belongs to the entry's kind, so existing entries become Other and nothing else changes. The form offers the kind's categories; home shows the selected kind split by category; list rows show the category icon and name. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-router, expo-sqlite, Feather icons (already installed). No new ones.

**Storage**: SQLite step 6: `ALTER TABLE entry ADD COLUMN category TEXT NOT NULL DEFAULT 'other' CHECK (...)`. Released structure added to `src/test-support/released-schemas.ts` with an upgrade test (test-writer).

**Testing**: Jest. Unit: category lists, validation, the split. Integration: form → save → reopen, the split on home, rows, upgrade of sample data from every released version.

**Target Platform**: Android

**Project Type**: Mobile app

**Constraints**: recording without choosing a category takes no extra step (SC-003); every existing entry kept (SC-001).

**Scale/Scope**: 1 migration step, 1 categories module, entries rules/repository/form/list changes, 1 split component, home edit, demo data, 001 spec update.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Nothing leaves the device. |
| II. Keep It Simple | Pass. Fixed lists in code, one column, no categories table, no settings. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Pass. Split sums cents; only the displayed percentage is rounded. |
| V. English in the Repository | Pass. |
| Migrations preserve data | Pass. Adds a column with a default; no row is changed or deleted. Developer approved the data model change on 2026-11-13. |
| Baseline specs updated | Required: `001-expenses` FR-001, FR-006, FR-009, FR-010 (spec FR-007). |
| Architecture boundaries | Pass. Categories live in `entries`; home imports the split component and rules from `entries` only. |

Re-checked after design: still passes.

## Project Structure

```text
src/db/migrations.ts                                  step 6: category column
src/features/entries/categories.ts                    keys, lists per kind, labels, isCategoryOf()
src/features/entries/components/category-icons.ts     categoryIcon(kind, category)
src/features/entries/rules.ts                         Entry.category, 'category-invalid', categorySplit()
src/features/entries/repository.ts                    read/write category, format check against kind
src/features/entries/screens/entry-screen.tsx         category picker, reset to Other on kind change
src/features/entries/components/entry-list.tsx        row icon and text from the category
src/features/entries/components/category-split.tsx    the split card
src/shared/ui/kind-badge.tsx                          optional icon override
src/features/home/screens/home-screen.tsx             split above the list when a tile is selected; repeat income in Other
src/db/demo-data.ts                                   demo entries with categories
specs/001-expenses/spec.md                            FR-001, FR-006, FR-009, FR-010 and stories
```

## Design Notes

See [research.md](./research.md), [data-model.md](./data-model.md) and [contracts/categories-ui.md](./contracts/categories-ui.md).
