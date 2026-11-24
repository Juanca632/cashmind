# Implementation Plan: Settings and app lock

**Branch**: `feat/023-settings-app-lock` | **Date**: 2026-11-24 | **Spec**: [spec.md](./spec.md)

## Summary

A new `settings` feature owns a key/value `setting` table (migration 8), the lock rules, a thin wrapper over the phone's authentication (`expo-local-authentication`), the Settings screen and an `AppLock` gate. The root layout wraps the navigator in `AppLock`. While locked, it covers the app with a locked screen and hides the screens underneath from accessibility. The screens stay mounted, so unlocking returns to the same place with typed text kept. Home gets a gear `IconButton` that opens `/settings`.

## Technical Context

**Dependencies**: `expo-local-authentication` (new, developer approved, installed with `npx expo install`). It is in Expo Go and needs no config plugin on Android, because the library's manifest adds `USE_BIOMETRIC`. `expo-constants` (already installed) gives the app version.

**Storage**: migration 8 adds `setting (key TEXT PRIMARY KEY, value TEXT) STRICT`. Only the key `app_lock` (`'on'` | `'off'`) is used. A missing row means on. 024 (currency) will add its own key to the same table.

**Testing**:
- Unit tests for `shouldLockOnReturn` and the read check of the setting.
- The migration upgrade test from schema 7 with sample data.
- Integration tests on the real routes with the authentication module mocked:
  - locked on start, unlock, and cancel then retry;
  - too many attempts;
  - no phone lock;
  - Settings: switch off and on, with cancel, and remembered after restart;
  - gear opens Settings;
  - return after 30 s and after 61 s, with a mocked `AppState`.
- **Jest setup**: a global mock of `expo-local-authentication` in `src/test-support/jest-setup.ts` reports a phone with no lock by default, so the existing journeys run unchanged. The test-writer owns it.

**E2E**: the emulator has no screen lock, so the six existing flows are unaffected. The real prompt is checked by the `e2e-tester` by hand: set a PIN with `adb shell locksettings set-pin 1234`, check the locked screen, unlock with the PIN, check the 1-minute rule, then clear the PIN. No new Maestro flow: the system prompt is outside the app and a scripted PIN would be brittle.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Nothing leaves the phone. The phone's authentication only answers yes or no, and the app never sees biometric data. |
| II. Keep It Simple | Pass. One table, one setting, one fixed 1-minute rule, no app PIN. The key/value table is needed now and is reused by 024. |
| III. Android First | Pass. Android behavior only. |
| IV. Money Is Integer Cents | Not affected. |
| Migrations | Pass. Step 8 only creates a table. Its structure goes in `released-schemas.ts` with an upgrade test. |
| Architecture | Pass. A new `settings` feature that imports no other feature. Home only links to the route. The root layout (lint-exempt) mounts `AppLock`. Writes go through `settings/service.ts`. |
| Styles rule | Pass. `SwitchRow`, `IconButton`, `Button`, `Card`, `ThemedText` and `MessageScreen`-like layout with existing tokens. A new token only if lint asks. |
| Baseline specs | 003 mentions the gear button. |

Post-design re-check: unchanged.

## Design

### Database — `src/db/migrations.ts`

- Step 8: `CREATE TABLE setting (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL) STRICT;`
- `released-schemas.ts`: schema 8 = schema 7 + `setting`.

### `src/features/settings/`

- **`rules.ts`**:
  - `LOCK_AFTER_MS = 60_000`;
  - `shouldLockOnReturn(awayMs)` returns `awayMs > LOCK_AFTER_MS`;
  - `type LockSetting = boolean`.
- **`repository.ts`**:
  - `getAppLock(db)` returns `boolean`. A missing row means `true`; `'on'` and `'off'` map to the booleans; any other value throws `DataFormatError`.
  - `saveAppLock(db, on)` upserts.
- **`service.ts`**: `setAppLock(db, on)` returns a `WriteResult` through `attemptWrite`. Authentication is asked by the screen before calling it (FR-008), because the prompt is UI.
- **`device-auth.ts`**: the only importer of `expo-local-authentication`.
  - `hasDeviceLock()` is true when `getEnrolledLevelAsync()` is not `NONE`, so PIN, pattern or password alone counts.
  - `authenticate()` calls `authenticateAsync({ promptMessage: 'Unlock CashMind', cancelLabel: 'Cancel' })` with device fallback allowed. It returns `'ok' | 'cancelled' | 'lockout' | 'failed'`, and maps `lockout` and its variants to `'lockout'`.
- **`hooks/use-app-lock.ts`**: `useAppLockSetting()` loads `getAppLock` and `hasDeviceLock()` once, returns `Loadable<{ enabled, deviceLock }>` and lets the screen refresh after a change.
- **`components/app-lock.tsx`**: `AppLock({ children })`, mounted inside `SQLiteProvider` in `_layout.tsx`.
  - **State**: `checking`, then `locked` or `open`. While `checking`, it shows a plain background, so no data flashes.
  - **On mount**: it reads the setting (an unreadable setting counts as `true`) and `hasDeviceLock()`. It locks when both are true and prompts at once.
  - **`AppState`**: on `background` it stores `Date.now()`. On `active` it locks when `shouldLockOnReturn(now - leftAt)`, the setting is on and the phone has a lock. The setting and the device check are re-read on every return, so removing the phone lock stops the locking.
  - **While a prompt is open** (`isPrompting()`), `AppState` changes are ignored, because the PIN screen can pause the activity.
  - **Children** stay rendered under the cover in a `View` with `importantForAccessibility="no-hide-descendants"` while locked.
  - **The cover**: a full-screen view with the app name, an "Unlock" `Button` and, after a lockout, the message "Too many attempts. Try again in a moment.".
  - No context: the gate re-reads the setting and the phone's lock on every return. `device-auth.ts` keeps an `isPrompting()` flag that the gate checks, so the Settings prompt is ignored too.
- **`screens/settings-screen.tsx`**:
  - a "Security" section with `SwitchRow` "Lock with fingerprint";
  - when there is no phone lock: value false, disabled, and the hint "Set up a screen lock on your phone to use this.";
  - an "About" section with `Version ${Constants.expoConfig?.version}`.
  - **On toggle**: `authenticate()`; on `ok`, `setAppLock(db, next)`; on any other result, nothing changes. A failed write shows the service message with `ErrorText`.
- **Route**: `src/app/settings.tsx` re-exports the screen, and `_layout.tsx` gets `<Stack.Screen name="settings" options={{ title: 'Settings' }} />`.

### Home

- `home-screen.tsx` top row: an `IconButton` `settings` (Feather gear) with accessibility label "Settings", after My plan, shown in every month, which calls `router.push('/settings')`.

### Lint — `eslint.config.js`

- `featureZones('settings', [noFeatures('entries', 'plan', 'home')])`. The other features and `src/shared` also forbid `settings`.
- `saveAppLock` is added to `NO_WRITES_IN_HOOKS`.

### Baseline spec

- `specs/003-month-browsing`: home's top row has a gear button that opens Settings (see 023).

## Complexity Tracking

None.
