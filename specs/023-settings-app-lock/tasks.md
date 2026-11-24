# Tasks: Settings and app lock

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui.md](./contracts/ui.md), [quickstart.md](./quickstart.md)

Tests are written by the `test-writer` subagent from the spec (project rule), not by the implementation tasks.

## Phase 1: Setup

- [X] T001 Install the phone authentication module with `npx expo install expo-local-authentication` (package.json, package-lock.json); no config plugin in app.json (Android needs none)
- [X] T002 [P] eslint.config.js: add `...featureZones('settings', [noFeatures('entries', 'plan', 'home')])`, add `'settings'` to the `noFeatures` lists of `src/shared`, `entries` and `plan`, add `'saveAppLock'` to `NO_WRITES_IN_HOOKS.importNames`

## Phase 2: Foundational (blocks every story)

- [X] T003 src/db/migrations.ts: step 8 with a comment pointing to specs/023-settings-app-lock: `CREATE TABLE setting (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL) STRICT;`; nothing else changes
- [X] T004 src/test-support/released-schemas.ts: schema `8` = schema 7 plus the `setting` table exactly as in T003
- [X] T005 src/features/settings/rules.ts: `LOCK_AFTER_MS = 60_000`, `shouldLockOnReturn(awayMs: number): boolean` → `awayMs > LOCK_AFTER_MS`
- [X] T006 src/features/settings/repository.ts: `getAppLock(db)` reads key `app_lock` ("Missing means on"; `'on'` → true, `'off'` → false, anything else throws `DataFormatError('setting.app_lock')`); `saveAppLock(db, on)` upserts `'on'`/`'off'` with `INSERT … ON CONFLICT(key) DO UPDATE`
- [X] T007 src/features/settings/service.ts: `setAppLock(db, on)` → `WriteResult` through `attemptWrite('The setting could not be saved. Please try again.', …)`
- [X] T008 src/features/settings/device-auth.ts (the only importer of `expo-local-authentication`): `hasDeviceLock()` → `getEnrolledLevelAsync() !== SecurityLevel.NONE` (false on any error); `authenticate()` → `authenticateAsync({ promptMessage: 'Unlock CashMind', cancelLabel: 'Cancel' })` mapped to `'ok' | 'cancelled' | 'lockout' | 'failed'` (`user_cancel`, `system_cancel`, `app_cancel` → cancelled; `lockout` → lockout; anything else or a throw → failed)

## Phase 3: User Story 1 — only I can open my finances (P1) 🎯 MVP

**Independent test**: with a phone lock (mocked in Jest, PIN on the emulator), the app opens on the locked screen, unlocks, and follows the 1-minute rule.

- [X] T009 [US1] src/features/settings/components/app-lock.tsx: `AppLock({ children })` with state `checking | locked | open` and `lockout` message flag; on mount reads `getAppLock(db)` (error → true) and `hasDeviceLock()`, locks and prompts when both true, else opens; `checking` shows only the themed background
- [X] T010 [US1] same file: `AppState` listener — on `background` store `Date.now()`; on `active`, re-read setting and device lock, and lock + prompt when `shouldLockOnReturn(now - leftAt)` and both true; ignore changes while a prompt is open (ref flag)
- [X] T011 [US1] same file: render children always, inside a `View` (flex 1) with `importantForAccessibility="no-hide-descendants"` while not `open`; on top, when not `open`, an absolute full-screen cover (`StyleSheet.absoluteFill`, `theme.background`) with "CashMind" (`ThemedText` title type), a `Button` "Unlock" that prompts again, and when the last result was lockout the text "Too many attempts. Try again in a moment."; while locked, the Android back button exits the app (`BackHandler.exitApp()`)
- [X] T012 [US1] src/features/settings/device-auth.ts: `isPrompting()` flag set while `authenticate()` runs, used by the gate to ignore `AppState` changes during any prompt (also the Settings one). No context is needed: the gate re-reads the setting on every return
- [X] T013 [US1] src/app/_layout.tsx: wrap `<ThemeProvider>…</ThemeProvider>` content in `<AppLock>` inside `SQLiteProvider`

## Phase 4: User Story 2 — Settings screen and the switch (P1)

**Independent test**: gear → Settings, switch off with the prompt, restart, no lock; switch on again; cancel leaves it unchanged.

- [X] T014 [US2] src/features/settings/hooks/use-app-lock-setting.ts: `useAppLockSetting()` → `Loadable<{ enabled: boolean; deviceLock: boolean }>` via `useFocusedData`, plus a `reload()`
- [X] T015 [US2] src/features/settings/screens/settings-screen.tsx: `ScreenScroll` with section "Security" (`ThemedText` label) and `SwitchRow` "Lock with fingerprint"; section "About" with `Version ${Constants.expoConfig?.version ?? ''}`; on change: `authenticate()`, on `'ok'` `setAppLock(db, next)`, then `reload()` and `refreshLock()`; a failed write shows `ErrorText`; loading and read errors use the existing patterns
- [X] T016 [US2] src/app/settings.tsx re-exports the screen; src/app/_layout.tsx adds `<Stack.Screen name="settings" options={{ title: 'Settings' }} />`
- [X] T017 [US2] src/features/home/screens/home-screen.tsx: in the top row, after My plan, an `IconButton` `icon="settings"` `accessibilityLabel="Settings"` pushing `/settings`, shown in every month

## Phase 5: User Story 3 — a phone with no screen lock (P2)

**Independent test**: with no phone lock, the app opens normally and the switch is disabled with the hint.

- [X] T018 [US3] src/features/settings/screens/settings-screen.tsx: when `deviceLock` is false, the `SwitchRow` shows `value={false}`, `disabled`, and under it `ThemedText` caption `textSecondary` "Set up a screen lock on your phone to use this."; the stored value is not touched (the gate already opens when there is no lock, T009–T010)

## Phase 6: Polish

- [X] T019 [P] specs/003-month-browsing/spec.md: mention home's gear button that opens Settings (see 023) and note 023 in its Input line
- [X] T020 [P] .maestro/README.md: note that flows assume the emulator has no screen lock (the app lock stays off), and the quickstart's manual PIN check
- [X] T021 Tests by the `test-writer` subagent for 023-settings-app-lock (unit: `shouldLockOnReturn`, `getAppLock` read check; migration 7 → 8 upgrade with sample data; global `expo-local-authentication` mock in src/test-support/jest-setup.ts defaulting to no phone lock; integration: Stories 1–3)
- [X] T022 `npx expo lint`, `npx tsc --noEmit`, `npx jest --maxWorkers=2` pass; `code-reviewer` on 023-settings-app-lock; fix BLOCKER/MAJOR
- [X] T023 Quickstart on the emulator with a PIN (verifies the PIN fallback from research.md before release)

## Dependencies

T001 → T008. T003 → T004 → T006 → T007. T005–T008 → T009 → T010 → T011 → T012 → T013. T012 → T009. T014 → T015 → T016 → T017 → T018. T002, T019, T020 any time. T021 after T018. T022 after T021. T023 last.

## Parallel

- T002, T019 and T020 alongside anything.
- T005 alongside T003–T004.

## Strategy

MVP = T001–T013: the app locks and unlocks (on by default). T014–T018 let the user change it and cover phones without a lock. T019–T023 finish the feature.
