# Implementation Plan: App Architecture Foundation

**Branch**: `feat/004-app-architecture` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-app-architecture/spec.md`

## Summary

Reorganize the app by feature and add one validation point for every write. Each feature gets a service that validates with its pure rules and then calls its repository. Repositories check the format of everything they read. Screens become thin and lint rules keep the boundaries in place. No visible change other than failure messages, and no database change.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, Expo Router, expo-sqlite. No new dependencies.

**Storage**: SQLite on the device. Schema unchanged (version 5).

**Testing**: Jest with jest-expo and React Native Testing Library. Screen tests run the real SQL against a Node SQLite test double.

**Target Platform**: Android

**Project Type**: Mobile app

**Performance Goals**: No perceptible change. Format checks are constant time per row.

**Constraints**: Offline only, integer cents, behavior preserved except FR-007 and FR-010.

**Scale/Scope**: About 2,000 lines, 5 screens, 3 tables, 6 writes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. No network or logging added. |
| II. Keep It Simple | Pass. No libraries, classes or read pass-through layers. Validated by the developer. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Pass. Euro text conversion moves to integer arithmetic in one module. |
| V. English in the Repository | Pass. |
| Technical constraints | Pass. `src/app` stays routes only; schema and migrations unchanged. |
| Baseline specs | Specs 001 and 002 gain the failure and damaged-data scenarios in this change. |

Re-check after design: no violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-app-architecture/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/write-operations.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/                     # Routes only, re-exporting feature screens
├── features/
│   ├── expenses/            # rules, repository, service, hooks/, components/, screens/
│   ├── plan/                # rules, plan-form, repository, service, hooks/, components/, screens/
│   └── home/                # screens/ (the only feature that combines others)
├── db/                      # Database name and migrations
├── shared/                  # money, months, days, buckets, write-result, read-checks,
│                            # hooks/, ui/, theme/
├── test-support/            # Test helpers
└── __tests__/               # Screen tests
```

**Structure Decision**: Feature folders with a small shared module set, as validated in the Notion proposal. Files keep their kebab-case naming and `@/` imports.

## Complexity Tracking

No constitution violations.
