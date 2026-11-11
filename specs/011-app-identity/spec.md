# Feature Specification: App Identity

**Feature Branch**: `feat/011-app-identity`

**Created**: 2026-11-11

**Status**: Implemented

**Input**: User description: "Before v1.0.0 the app needs its own identity: replace Expo's default icon and splash with a CashMind icon (a simple open white C on the app's green gradient), show the name 'CashMind' on the phone, and add an EAS production profile that builds an installable APK."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognize the app on the phone (Priority: P1)

**Why this priority**: The app still shows Expo's template icon and blue splash. A v1.0.0 must look like CashMind.

**Independent Test**: Install the APK and look at the launcher, the app drawer and the app's start.

**Acceptance Scenarios**:

1. *Launcher*: **When** the app is installed, **Then** the launcher shows a white open "C" on the app's green and the name "CashMind"
2. *Any icon shape*: **Given** a launcher that cuts icons into circles, squircles or rounded squares, **Then** the "C" is whole and centred in every shape
3. *Themed icons*: **Given** Android's themed icons are on, **Then** the launcher shows the "C" in the system's colors
4. *Start*: **When** the app opens, **Then** the start screen shows the white "C" on the app's green, not Expo's blue

---

### User Story 2 - Build the release APK (Priority: P1)

**Why this priority**: v1.0.0 is shipped as an APK the developer downloads and installs.

**Independent Test**: Run the production build and install the result on the emulator.

**Acceptance Scenarios**:

1. *Production build*: **When** the developer runs the production build, **Then** EAS produces an APK that installs on Android
2. *Updates install on top*: **Given** a production APK is installed with data, **When** a newer production APK is installed over it, **Then** it installs without uninstalling and the data stays

---

### Edge Cases

- **Small sizes**: the "C" stays readable at notification and settings sizes.
- **App name length**: "CashMind" fits under the icon on a normal launcher without being cut.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app icon MUST be a white open "C" (a ring about three quarters closed, open to the right, with round ends) on the app's green gradient (#065F52 to #0B8A6F), with adaptive foreground, background and monochrome layers so every launcher shape and themed icons work.
- **FR-002**: The start (splash) screen MUST show the same white "C" on #065F52.
- **FR-003**: The name shown on the phone MUST be "CashMind". The package name and the EAS project MUST NOT change, so existing installs keep updating and backups keep restoring.
- **FR-004**: There MUST be a production build profile that produces an APK, raises the build number on every build, and signs with the same EAS-managed key as earlier builds.
- **FR-005**: The source drawing of the icon MUST be kept in the repository so it can be changed later.

### Key Entities

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No Expo template image is left in the app's icon, splash or launcher.
- **SC-002**: A production APK installs over the previous one without losing data.

## Assumptions

- The free EAS plan is enough for the production build (no cost).
- Dark mode for the splash is handled together with the app's dark mode in a later feature.

## Out of Scope

- Play Store listing, screenshots or store submission.
- iOS icons.
- A wordmark or logo inside the app's screens.
- Setting the app version to 1.0.0 (done in the release commit).
