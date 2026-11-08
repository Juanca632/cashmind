# Feature Specification: Database Foundation

**Feature Branch**: `feat/005-database-foundation`

**Created**: 2026-11-08

**Status**: Implemented

**Input**: User description: "Make the database structure final for the first APK and make migrations safe to rely on. Validated in the Notion pages '6. Migrations proposal' and '7. Database structure proposal'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Updates never lose or break data (Priority: P1)

When a new version of the app needs a different database structure, the phone updates itself on opening and the user's data is still there.

**Why this priority**: The user will keep real finances in the app across many versions.

**Independent Test**: Build a database at an older version with data, apply the pending steps and confirm the data is intact.

**Acceptance Scenarios**:

1. **Given** an empty database, **When** the app opens, **Then** the final structure is created and marked as version 1
2. **Given** a database at the latest version with data, **When** the app opens, **Then** nothing changes
3. **Given** a database several versions behind with data, **When** the app opens, **Then** every missing step runs in order and the data is kept
4. **Given** the structure saved for every released version, **When** each one is upgraded to the latest, **Then** the result matches a new install

---

### User Story 2 - A failed update is explained and harmless (Priority: P1)

If a step cannot be applied, the user sees a clear message instead of a closing app, and the data stays as it was before that step.

**Why this priority**: A crash on opening looks like lost data, and leaves the user with no information.

**Independent Test**: Make a step fail and confirm the message appears and the database is left as it was before that step.

**Acceptance Scenarios**:

1. **Given** a step that fails midway, **When** the app opens, **Then** the screen says the app could not update the data and that the data is safe
2. **Given** a step that fails midway, **When** it stops, **Then** none of that step's changes remain and the database version stays at the last completed step
3. **Given** two pending steps where the second fails, **When** the app opens, **Then** the first step's changes and version are kept
4. **Given** a database saved by a newer version than the app knows, **When** the app opens, **Then** the screen asks to install the latest version and nothing is written

---

### User Story 3 - The database rejects invalid data (Priority: P2)

The database itself refuses data with the wrong type or format, as a last line of defense behind the app's validation.

**Why this priority**: It only matters if a future bug passes the validation, but it can only be added cheaply before real data exists.

**Independent Test**: Try to store each kind of invalid value directly and confirm the database refuses it.

**Acceptance Scenarios**:

1. **When** text or a decimal is stored in a money or percentage column, **Then** the database refuses it
2. **When** a badly formatted date or month is stored, **Then** the database refuses it
3. **When** a zero or negative income, or a percentage above 100, is stored, **Then** the database refuses it
4. **When** valid data is stored, including a value above the app's 900 000,00 € limit, **Then** the database accepts it, because that limit is a business rule

---

### Edge Cases

- A database file from the development versions (version 2 to 5) counts as newer than the app. It is test data only, and clearing it resolves it.
- An error unrelated to updating the database is not reported as an update problem.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Database changes MUST be defined as an ordered list with one step per version, starting at version 1.
- **FR-002**: On opening, the system MUST apply only the missing steps, in order.
- **FR-003**: Each step MUST run in its own transaction together with its version change.
- **FR-004**: When a step fails, the system MUST show a message saying the data is safe, and MUST NOT delete user data.
- **FR-005**: When the database version is higher than the latest step known to the app, the system MUST stop, show a message, and write nothing.
- **FR-006**: The structure of each released version MUST be saved in the repository, and automatic tests MUST prove that it upgrades to the latest version with the same result as a new install.
- **FR-007**: All tables MUST enforce column types.
- **FR-008**: The database MUST refuse badly formatted dates and months, incomes not above zero, negative values, and percentages above 100.
- **FR-009**: The 900 000,00 € limit MUST NOT be enforced by the database.
- **FR-010**: Tables and columns MUST stay the same as today.

### Key Entities

- **Migration step**: A version number and the change that brings the database to it.
- **Released structure**: The saved definition of the database at a released version.

## Out of Scope

Automatic copy before migrating, backup and export, APK builds, automatic updates, indexes, and new tables or columns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % of the data present before an upgrade is present after it in the automatic upgrade tests.
- **SC-002**: A failing step shows a message in 100 % of the tested failure cases, and the app does not close.
- **SC-003**: 100 % of the invalid values in User Story 3 are refused by the database.
- **SC-004**: 100 % of the scenarios in the existing specs still pass.

## Assumptions

- No APK has been installed yet, so the development versions can be replaced by one starting point.
- Test data in Expo Go can be cleared.
