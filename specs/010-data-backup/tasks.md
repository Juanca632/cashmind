# Tasks: Data Backup

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Required by the constitution. One config test (written by the test-writer subagent) and the E2E journey in quickstart.md.

## Phase 1: User Story 1 - Data comes back after reinstalling (P1)

**Independent test**: quickstart.md steps 1–6 on the emulator with an EAS-built APK.

- [X] T001 [US1] Set `"allowBackup": true` explicitly under `expo.android` in app.json (research R1); no backup rules, no backup agent
- [X] T002 [P] [US1] Amend Principle I (Privacy First) in .specify/memory/constitution.md: data stays on the device except Android's own encrypted backup to the user's Google account; still no backend, no logging, no other network use. Bump version to 1.3.0, Last Amended 2026-11-11
- [X] T003 [P] [US1] Update the privacy rule in AGENTS.md to match the amended constitution
- [X] T004 [P] [US1] Add the backup journey to the release checks in .claude/agents/e2e-tester.md: under `all`, when an APK is given, also run specs/010-data-backup/quickstart.md (local backup transport, uninstall, reinstall)

## Phase 2: Polish

- [X] T005 test-writer subagent writes the config test from the spec (FR-001): app.json keeps `expo.android.allowBackup` set to `true`
- [X] T006 Run lint, typecheck and tests (`npx expo lint`, `npx tsc --noEmit`, `npx jest --maxWorkers=4`)
- [ ] T007 E2E of quickstart.md by the e2e-tester subagent, with the APK built for the v1.0.0 release (needs an EAS build; done during the release feature)

## Dependencies

T001 first. T002–T004 are independent files and can run in parallel. T005 after T001. T007 needs an APK, so it runs when the release APK exists.

## Strategy

T001–T006 complete the change in the repo; T007 proves it on the real app before v1.0.0 ships.
