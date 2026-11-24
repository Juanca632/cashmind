# Feature Specification: Settings and app lock

**Feature Branch**: `feat/023-settings-app-lock`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Add a Settings screen, opened from a gear icon on the home screen. It holds a "Lock with fingerprint" switch (Security section) and shows the app version (About section). App lock: ON by default. When on, the app asks the user to unlock with the phone's own authentication (fingerprint, face, or the phone's PIN/pattern/password as fallback) when the app opens from scratch and when it comes back to the foreground after more than 1 minute in the background; returning within 1 minute does not ask. While locked, no financial data is visible; a locked screen shows an "Unlock" button to retry after cancel or failure. If the phone has no screen lock or biometrics set up, the app does not lock and the Settings switch is disabled with a hint to set up a screen lock on the phone. Turning the switch off asks for authentication first; turning it on asks once to confirm it works. The setting is stored on the device in a new small `setting` table (new migration that only adds the table, keeps all user data). No login, no accounts, no backend, no database encryption. Out of scope: configurable lock timeout, currency selection (next feature 024), daily reminder, any other settings."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Only I can open my finances (Priority: P1)

Someone who borrows the phone should not see what the user earns and spends. The app asks for the phone's own fingerprint, face or screen lock before showing anything, the way banking apps do. There is no account and no password of its own.

**Why this priority**: It is the reason for the feature.

**Independent Test**: On a phone with a screen lock set up, open the app, check that nothing financial shows until unlocking, then send it to the background for short and long times.

**Acceptance Scenarios**:

1. *Opening*: **Given** the phone has a screen lock and the app lock is on, **When** the user opens the app from scratch, **Then** a locked screen shows the app name and an "Unlock" button with no amounts, entries or month, **And** the phone's unlock prompt appears by itself
2. *Unlocked*: **When** the user passes the prompt with a fingerprint, face or the phone's PIN, pattern or password, **Then** the screen they would have seen without the lock appears
3. *Cancelled or failed*: **Given** the user cancels the prompt or it fails, **Then** the locked screen stays, **And** tapping "Unlock" shows the prompt again
4. *Too many attempts*: **Given** the phone refuses for now after too many failed attempts, **Then** the locked screen says "Too many attempts. Try again in a moment." and "Unlock" stays available
5. *Short trip away*: **Given** the app is unlocked, **When** the user leaves it for 1 minute or less and comes back, **Then** it does not ask again
6. *Longer trip away*: **Given** the app is unlocked, **When** the user leaves it for more than 1 minute and comes back, **Then** it locks and asks again, **And** after unlocking the user is on the same screen as before, with anything typed still there
7. *Lock off*: **Given** the app lock is off, **Then** the app never shows the locked screen

---

### User Story 2 - Settings screen and turning the lock off or on (Priority: P1)

The user needs one place for app options. Today it holds the lock switch and the app version.

**Why this priority**: The lock is on by default, so the user must be able to turn it off. Without this story the lock cannot be changed.

**Independent Test**: Open Settings from home, turn the lock off and on, close and reopen the app, check the result.

**Acceptance Scenarios**:

1. *Opening Settings*: **Given** the user is on home, any month, **When** they tap the gear button at the top, **Then** a "Settings" screen opens with a "Security" section holding the "Lock with fingerprint" switch and an "About" section showing "Version 1.6.0" (the installed version)
2. *On by default*: **Given** the app was just installed, or updated from a version without this feature, **Then** the switch is on
3. *Turning off*: **When** the user turns the switch off, **Then** the phone's unlock prompt appears first. **If** they pass it, the switch turns off and stays off after the app restarts. **If** they cancel or fail, the switch stays on
4. *Turning on*: **When** the user turns the switch on, **Then** the phone's unlock prompt appears once. **If** they pass it, the switch turns on and stays on after the app restarts. **If** they cancel or fail, the switch stays off
5. *Remembered*: **Given** the user turned the lock off, **When** they reopen the app from scratch, **Then** it opens without the locked screen

---

### User Story 3 - A phone with no screen lock (Priority: P2)

**Why this priority**: The app must never shut the user out of their own data.

**Independent Test**: On a phone (or emulator) with no screen lock and no fingerprint, open the app and Settings.

**Acceptance Scenarios**:

1. *No lock*: **Given** the phone has no screen lock, fingerprint or face set up, **When** the user opens the app, **Then** it opens without the locked screen, whatever the switch says
2. *Explained*: **Then** in Settings the switch is shown off and cannot be changed, with the hint "Set up a screen lock on your phone to use this."
3. *Set up later*: **Given** the user had not turned the lock off, **When** they later set up a screen lock on the phone and open the app from scratch, **Then** the app locks, as it is on by default

---

### Edge Cases

- **Phone lock removed later**: if the user removes the phone's screen lock while the app lock is on, the app stops locking (Story 3). It never shows a locked screen that cannot be passed.
- **Unreadable setting**: if the stored lock setting cannot be read, the app treats the lock as on (the safe choice). It never changes or deletes other data.
- **Back button on the locked screen**: it leaves the app, as on home. It never reveals what is behind the lock.
- **Recent apps preview**: the system's recent-apps preview is not covered by this feature (see Out of Scope).
- **Dialogs and the date picker**: the app's own dialogs and the native date picker are part of the app and do not count as leaving it.
- **Accessibility**: the gear button reads "Settings". The switch reads "Lock with fingerprint", with its on or off state. The locked screen's button reads "Unlock".
- **Demo variant**: the demo build behaves the same.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Settings entry): Home MUST show a gear button at the top, in every month, that opens the Settings screen.
- **FR-002** (Settings screen): Settings MUST show a "Security" section with the "Lock with fingerprint" switch and an "About" section with "Version X.Y.Z", the installed app version. It MUST NOT hold any other option.
- **FR-003** (Default): The lock setting MUST be on until the user turns it off.
- **FR-004** (When it locks): While the lock setting is on and the phone has a screen lock, fingerprint or face set up, the app MUST lock when it opens from scratch and when it returns to the foreground after more than 1 minute in the background. It MUST NOT lock after 1 minute or less away. The 1 minute is fixed.
- **FR-005** (Locked screen): While locked, the app MUST show only the locked screen (app name, "Unlock" button, and a message when the phone refuses for now). No financial data may be visible. The phone's unlock prompt MUST appear by itself when the lock starts, and again on each "Unlock" tap.
- **FR-006** (How to unlock): Unlocking MUST use the phone's own authentication: fingerprint or face, with the phone's PIN, pattern or password as fallback. The app MUST NOT have a password, PIN or account of its own.
- **FR-007** (After unlocking): Unlocking MUST return the user to where they were, with screens and anything typed kept.
- **FR-008** (Changing the switch): Turning the switch off or on MUST first pass the phone's unlock prompt. Cancelling or failing MUST leave the setting as it was.
- **FR-009** (No phone lock): When the phone has no screen lock, fingerprint or face set up, the app MUST NOT lock. The switch MUST show off, disabled, with the hint "Set up a screen lock on your phone to use this.". The stored setting MUST NOT change because of this.
- **FR-010** (Stored on the device): The lock setting MUST be stored in the app's database on the device. Adding where it is stored MUST be a new migration step that keeps all existing data.
- **FR-011** (Baseline spec): `specs/003-month-browsing` MUST mention the gear button that opens Settings.

### Key Entities

- **Setting**: one named app option and its value, stored on the device. This feature stores only the lock setting (on or off). When it is missing, the lock is on.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the lock on, no amount, entry or month name is ever visible before unlocking, on opening or after more than 1 minute away.
- **SC-002**: Unlocking takes one touch of the fingerprint sensor (about 1 second) on a phone with a fingerprint set up.
- **SC-003**: Switching to another app for up to 1 minute and back never asks to unlock.
- **SC-004**: On a phone with no screen lock, the app opens exactly as it did before this feature.
- **SC-005**: After the update, all existing entries, repeats and plans are still there.

## Assumptions

- The phone's own lock is the login: no accounts or servers are needed because the data never leaves the device (constitution I). This protects access to the app. It does not encrypt the database.
- The switch is called "Lock with fingerprint" because that is how most people unlock. It also accepts face and the phone's PIN, pattern or password. Without the fallback, a failed sensor or too many attempts would shut the user out.
- 1 minute away matches banking apps: a quick look at another app does not ask again, a longer absence does.
- A phone with no screen lock cannot authenticate, so the app does not lock. The Android emulator used for E2E has no screen lock by default, so the existing flows open the app as before.
- The developer approved one new library (the official Expo module for the phone's authentication) and one new migration step that only adds the settings table.
- App texts stay in English, like the rest of the app.

## Out of Scope

- Any login, account, app password or PIN of its own; any backend.
- Encrypting the database.
- Choosing the lock timeout or "lock immediately".
- Hiding the app's content in the recent-apps preview.
- Currency selection (next feature, 024), the daily reminder and any other setting.
