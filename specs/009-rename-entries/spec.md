# Feature Specification: Rename Entries

**Feature Branch**: `feat/009-rename-entries`

**Created**: 2026-11-11

**Status**: Implemented

**Input**: User description: "Rename expense to entry (table, types, route and feature) before v1.0.0, because since 008 it holds income, savings and expenses."

## User Scenarios & Testing *(mandatory)*

This change renames the internal names only. Nothing the user sees or does changes.

### User Story 1 - The app works exactly as before (Priority: P1)

**Why this priority**: A rename must never change behavior.

**Independent Test**: Every acceptance scenario of the baseline specs 001-003 still holds.

**Acceptance Scenarios**:

1. *Same behavior*: **When** the user records, edits, deletes, filters and browses entries, **Then** every screen, text and figure is the same as before the change

---

### User Story 2 - Existing data is kept (Priority: P1)

**Why this priority**: The phone already holds the user's entries.

**Independent Test**: Upgrade a database saved by the previous version and compare.

**Acceptance Scenarios**:

1. *Upgrade*: **Given** entries and plans saved by the previous version, **When** the app updates, **Then** every entry keeps its id, date, kind, amount, note and creation time, and every plan keeps its month and percentage

---

### Edge Cases

- **Opening an entry from an old link**: the entry screen has a new address; nothing outside the app links to it, so no redirect is kept.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Everything that means "a recorded entry" MUST be named entry: the stored table, the feature, its types, functions, hooks, components, files and the entry screen's route (`/entry`).
- **FR-002**: The kind of an entry MUST be named kind, not bucket. The kind value `expense` stays, as one of the three kinds.
- **FR-003**: A new migration step MUST rename the stored data and keep every row unchanged.
- **FR-004**: Visible texts, screens and behavior MUST NOT change.
- **FR-005**: Specs, agent instructions and docs that name the old table, route or files MUST be updated.

### Key Entities

- **Entry** (renamed from expense): amount, date, optional note and kind (income, savings or expense).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario of the baseline specs holds after the change.
- **SC-002**: No name in the app code says expense or bucket where it means any entry or its kind.
- **SC-003**: After updating, 100 % of entries and plans are kept unchanged.

## Assumptions

- Before v1.0.0, this is the cheapest moment to rename stored data.

## Out of Scope

- Any change in behavior, texts or design.
