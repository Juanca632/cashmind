# Tasks: Dark Mode

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: Required. Written by the test-writer subagent from the spec.

## Phase 1: Foundational

- [X] T001 Rework src/shared/theme/theme.ts into LIGHT and DARK token sets (research R2; light values equal to today's), keep `Hero`, `Radius`, `Spacing`, `FontFamily`, `MIN_TOUCH`; remove the fixed `Colors`, `Accent`, `KIND_COLORS`, `KIND_TINTS`, `SAVINGS_TRACK`, `CARD_SHADOW`, `ERROR_COLOR`
- [X] T002 src/shared/theme/use-theme.ts returns the set for `useColorScheme()`; app.json `userInterfaceStyle: "automatic"`

## Phase 2: User Story 1 - Follow the phone's theme (P1)

- [X] T003 [US1] src/app/_layout.tsx: `DarkTheme`/`DefaultTheme`, header and content background and `statusBarStyle` from the theme
- [X] T004 [P] [US1] Shared UI reads the theme: src/shared/ui/button.tsx, confirm-dialog.tsx, error-text.tsx, kind-badge.tsx
- [X] T005 [P] [US1] Screens read the theme: src/features/home/screens/home-screen.tsx, plan-screen.tsx; src/features/entries/screens/entry-screen.tsx, month-picker-screen.tsx; src/features/entries/components/entry-list.tsx

## Phase 3: Polish

- [X] T006 test-writer subagent writes the tests from the spec: contrast of every text/background pair in both token sets (FR-003), light values unchanged (FR-004), screens render with the dark set when the system is dark (FR-001, FR-002)
- [X] T007 Run lint, typecheck and tests
- [X] T008 E2E of quickstart.md by the e2e-tester subagent (in the release run)
