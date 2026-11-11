# Implementation Plan: Data Backup

**Branch**: `feat/010-data-backup` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

## Summary

Android Auto Backup already copies the app's database to the user's Google account: Expo enables `allowBackup` by default and `expo-sqlite` keeps the database in a backed-up folder. This feature makes that explicit in `app.json`, guards it with a config test, amends the constitution's Privacy First principle to allow this one exception, and adds the backup → uninstall → reinstall journey to the E2E checks run before a release. No app code changes, no new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-sqlite (already installed). No new ones.

**Storage**: SQLite on the device, unchanged. See [data-model.md](./data-model.md).

**Testing**: Jest (one config test); E2E on the emulator with an EAS-built APK and Android's local backup transport.

**Target Platform**: Android

**Project Type**: Mobile app

**Performance Goals**: None.

**Constraints**: No backend; backup timing is decided by Android.

**Scale/Scope**: 1 config line, 1 test, constitution and docs updates, 1 E2E journey.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass after amendment. Android's encrypted backup to the user's own Google account is the one exception, approved by the developer on 2026-11-11 (spec FR-005). Constitution goes to 1.3.0 and `AGENTS.md` is updated to match. |
| II. Keep It Simple | Pass. Uses what Android already does; no backup agent, no rules file, no UI. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Not affected. |
| V. English in the Repository | Pass. |
| Migrations preserve data | Pass. No migration; restored older databases go through the existing upgrade (research R4). |
| Baseline specs updated | Not affected: no behavior in 001–003 changes. |

Post-design re-check: unchanged.

## Project Structure

### Documentation

```text
specs/010-data-backup/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
└── checklists/requirements.md
```

No contracts: the feature adds no interface, screen or write.

### Source Code

```text
app.json                              android.allowBackup: true (explicit)
.specify/memory/constitution.md       Privacy First amendment, version 1.3.0
AGENTS.md                             privacy rule updated to match
.claude/agents/e2e-tester.md          backup journey added to the release checks
src/**/__tests__ or tests/            config test (written by test-writer)
```

**Structure Decision**: No new source folders; the change is configuration, governance and tests.
