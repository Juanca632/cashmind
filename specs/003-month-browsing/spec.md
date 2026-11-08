# Feature Specification: Month Browsing

**Feature Branch**: `003-month-browsing` (baseline, no branch)

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Migrated verbatim from the OpenSpec `month-browsing` capability. History is in `docs/openspec-archive/`.

This is a baseline spec: it describes the current behavior of the app and is kept up to date when a later feature changes that behavior.

## Purpose

Lets the user pick any past or current month from a calendar and see how that month was planned, without being able to change the past.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Month picker

**Implements**: FR-001

**Acceptance Scenarios**:

1. *Pick a past month*: **Given** it is November 2026 and a plan exists since July 2026, **When** the user opens the picker and selects September 2026, **Then** the home screen shows September 2026 with the plan that applied in September

---

### User Story 2 - No future months

**Implements**: FR-002

**Acceptance Scenarios**:

1. *Future months disabled*: **Given** it is November 2026, **When** the user opens the picker on 2026, **Then** December 2026 cannot be selected and the next-year button is disabled

---

### User Story 3 - Months without a plan

**Implements**: FR-003

**Acceptance Scenarios**:

1. *Month before the first plan*: **Given** the first plan applies from July 2026, **When** the user selects March 2026, **Then** the home screen shows that there was no plan in March 2026

---

### User Story 4 - Past months are read-only

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Viewing a past month*: **When** the user is viewing September 2026 and the current month is November 2026, **Then** no edit actions are shown, **And** a "back to current month" action returns the home screen to November 2026
2. *Previous month during the first days*: **Given** today is 2 December 2026, **When** the user views November 2026, **Then** the plan and income cannot be edited, but expenses can be added, edited or deleted

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Month picker): The system SHALL let the user open a month picker from the home screen showing a year with buttons to go to the previous and next year, and the twelve months of that year. Selecting a month SHALL show that month on the home screen. The current month SHALL be highlighted.
- **FR-002** (No future months): The system SHALL NOT let the user select a month after the current month, and SHALL NOT let the user go to a year after the current year.
- **FR-003** (Months without a plan): The system SHALL let the user go back to the year of the first saved plan and no earlier. A month before the first saved plan SHALL show that there was no plan for that month.
- **FR-004** (Past months are read-only): The system SHALL show past months without any option to edit the plan or the month's income, and SHALL offer a way to go back to the current month. Expense changes in past months follow the expenses editable period: only the previous month during the first 5 days of the current month.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
