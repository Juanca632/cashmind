# Feature Specification: Month Browsing

**Feature Branch**: `003-month-browsing` (baseline, no branch)

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Migrated from the OpenSpec `month-browsing` capability; updated by 008-simple-plan. History is in `docs/openspec-archive/`.

This is a baseline spec: it describes the current behavior of the app and is kept up to date when a later feature changes that behavior.

## Purpose

Lets the user pick any past or current month from a calendar and see how that month went, without being able to change its plan.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Month picker

**Implements**: FR-001

**Acceptance Scenarios**:

1. *Pick a past month*: **Given** it is November 2026 and entries exist since July 2026, **When** the user opens the picker and selects September 2026, **Then** the home screen shows September 2026 with its savings goal computed from the percentage that applied in September

---

### User Story 2 - No future months

**Implements**: FR-002

**Acceptance Scenarios**:

1. *Future months disabled*: **Given** it is November 2026, **When** the user opens the picker on 2026, **Then** December 2026 cannot be selected and the next-year button is disabled

---

### User Story 3 - How far back

**Implements**: FR-003

**Acceptance Scenarios**:

1. *First entry*: **Given** the first entry is from March 2025, **When** the user opens the picker, **Then** they can go back to 2025 and no earlier
2. *Nothing recorded*: **Given** it is 3 January 2027 and no entries, **When** the user opens the picker, **Then** they can go back to 2026 and no earlier

---

### User Story 4 - The plan of a past month cannot be changed

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Viewing a past month*: **When** the user is viewing September 2026 and the current month is November 2026, **Then** My plan is not offered, **And** a "back to current month" action returns the home screen to November 2026
2. *Expenses stay editable*: **Given** today is 6 December 2026, **When** the user views November 2026, **Then** expenses can be added, edited or deleted

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Month picker): The system SHALL let the user open a month picker from the home screen showing a year with buttons to go to the previous and next year, and the twelve months of that year. Selecting a month SHALL show that month on the home screen. The current month SHALL be highlighted.
- **FR-002** (No future months): The system SHALL NOT let the user select a month after the current month, and SHALL NOT let the user go to a year after the current year.
- **FR-003** (How far back): The system SHALL let the user go back to the year of the first recorded entry, and always at least to the previous year. Every month has a plan (20 % until one is saved, see 002).
- **FR-004** (Past months keep their plan): The system SHALL show past months without any option to edit the plan, and SHALL offer a way to go back to the current month. Entries of past months, including income, can be changed (see 001 FR-004).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
