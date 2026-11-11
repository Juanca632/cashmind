# Feature Specification: Data Backup

**Feature Branch**: `feat/010-data-backup`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "Backups for v1.0.0. The point is not having to make backups by hand: rely on Android's automatic backup (data goes encrypted to the user's Google Drive) and prove it works with the APK before v1.0.0. No manual export or import."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - My data comes back after reinstalling (Priority: P1)

The user never thinks about backups. If they reinstall the app or move to a new phone with the same Google account, their entries and plan come back on their own.

**Why this priority**: From v1.0.0 the data is real. Losing or resetting the phone must not lose every month.

**Independent Test**: On the emulator, with the release APK: record entries, force an Android backup, uninstall, reinstall, and check the data is back.

**Acceptance Scenarios**:

1. *Restore on reinstall*: **Given** Android backup is on, the user recorded entries in several months and changed the plan, and Android has made a backup, **When** the user uninstalls and installs the app again, **Then** home shows the same entries and plan as before, amounts to the cent
2. *Restore into a newer version*: **Given** a backup made by an older version of the app, **When** a newer version is installed and the data is restored, **Then** the data is upgraded and nothing is lost
3. *Backup off*: **Given** Android backup is off on the phone, **When** the app is reinstalled, **Then** it starts empty and works normally

---

### Edge Cases

- **Backup taken while the app writes**: a restored copy is never half-written; at worst it lacks the last changes made before the backup.
- **Demo mode**: the demo data is not part of the backup, so a restore never brings back invented data.
- **Backup timing**: Android decides when to back up (roughly once a day, while charging, on Wi-Fi, idle). Changes made after the last backup can be lost; this is accepted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST allow Android's automatic backup and restore of its data (entries and plan).
- **FR-002**: The backed-up data MUST be consistent: a restore gives the data as it was at some moment, never a partly written state.
- **FR-003**: Restored data from an older app version MUST go through the normal database upgrade and keep all user data.
- **FR-004**: The demo database MUST be excluded from the backup.
- **FR-005**: The constitution's Privacy First principle MUST be amended in the same change to allow one exception: Android's own encrypted backup to the user's Google account. Nothing else changes: no backend, no logging of financial data, no other network use.
- **FR-006**: The backup and restore journey MUST be part of the E2E checks run before a release.

### Key Entities

- No new entities. The backup is a copy of the existing entries and plan versions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After uninstall and reinstall with a backup available, 100 % of entries and plan versions come back unchanged.
- **SC-002**: The user does nothing in the app to get backups.

## Assumptions

- The user has Android backup turned on for their Google account (Settings → Google → Backup).
- Restore happens when the app is installed; it works for an APK installed by hand as well as for store installs. If the E2E check shows otherwise, this feature is revisited before v1.0.0.
- The release APKs are always signed with the same key, managed by EAS.

## Out of Scope

- Manual export or import of a backup file.
- Automatic exports to a folder or cloud of the app's own.
- Cloud sync or any backend.
- Showing backup status or the last backup date in the app.
- Choosing a backup from a past date.
