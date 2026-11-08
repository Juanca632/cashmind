# Feature Specification: Expenses

**Feature Branch**: `001-expenses` (baseline, no branch)

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Migrated verbatim from the OpenSpec `expenses` capability. History is in `docs/openspec-archive/`.

This is a baseline spec: it describes the current behavior of the app and is kept up to date when a later feature changes that behavior.

## Purpose

Lets the user record what they spend or save in each bucket and see, for any month, how it compares to that month's targets.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record an expense

**Implements**: FR-001

**Acceptance Scenarios**:

1. *Add a leisure expense*: **When** the user adds 12,50 € to leisure with the note "Cinema" and today's date, **Then** the expense appears in this month's list and leisure spending increases by 12,50 €
2. *Invalid amount*: **When** the user tries to save an expense with an empty, zero or negative amount, **Then** the system does not save it and shows that the amount must be greater than zero

---

### User Story 2 - Savings entries count towards the savings goal

**Implements**: FR-002

**Acceptance Scenarios**:

1. *Saving after payday*: **Given** a savings target of 900,00 €, **When** the user records 600,00 € in savings, **Then** the savings progress shows 600,00 € of 900,00 € and 300,00 € left to save

---

### User Story 3 - Edit and delete an expense

**Implements**: FR-003

**Acceptance Scenarios**:

1. *Correct an amount*: **When** the user changes an expense from 12,50 € to 15,00 €, **Then** the list and the bucket's spending reflect 15,00 €
2. *Delete an expense*: **When** the user deletes an expense, **Then** it disappears from the list and no longer counts towards its bucket

---

### User Story 4 - Editable period for expenses

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Forgotten expense at the start of the month*: **Given** today is 3 December, **When** the user adds an expense dated 30 November, **Then** it is saved and counts towards November
2. *Grace period over*: **Given** today is 6 December, **When** the user views November, **Then** November's expenses cannot be added, edited or deleted

---

### User Story 5 - Month progress against targets

**Implements**: FR-005

**Acceptance Scenarios**:

1. *Leisure over its limit*: **Given** a leisure target of 400,00 €, **When** leisure expenses add up to 450,00 €, **Then** leisure shows a warning that it is 50,00 € over
2. *Within the limit*: **Given** a fixed-expenses target of 1000,00 €, **When** fixed expenses add up to 700,00 €, **Then** fixed expenses shows 300,00 € left
3. *Progress percentage*: **Given** a savings target of 900,00 € and a leisure target of 400,00 €, **When** 630,00 € are saved and 200,00 € of leisure are spent, **Then** savings shows 70 % saved and leisure shows 50 % spent

---

### User Story 6 - Month expense list

**Implements**: FR-006

**Acceptance Scenarios**:

1. *Viewing a past month*: **When** the user picks a past month with expenses, **Then** the list shows that month's expenses and its progress per bucket

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Record an expense): The system SHALL let the user record an expense with an amount in EUR greater than zero (cent precision), one bucket (fixed expenses, leisure or savings), an optional note and a date. The date SHALL default to today and SHALL be within an editable month and not after today.
- **FR-002** (Savings entries count towards the savings goal): The system SHALL treat expenses in the savings bucket as money set aside, and SHALL show them as progress towards the month's savings target.
- **FR-003** (Edit and delete an expense): The system SHALL let the user change any field of an expense or delete it, as long as both its current date and its new date are in an editable month.
- **FR-004** (Editable period for expenses): The system SHALL allow expense changes in the current month, and in the previous month only during days 1 to 5 of the current month. Expenses of any other past month SHALL be read-only.
- **FR-005** (Month progress against targets): The system SHALL show, for the selected month and each bucket, the amount recorded, the target and the progress as a percentage of the target. For fixed expenses and leisure it SHALL show what is left, or a warning with the excess when the recorded amount is above the target. For savings it SHALL show what is left to reach the goal, or that the goal is reached.
- **FR-006** (Month expense list): The system SHALL list the selected month's expenses, newest date first, showing date, bucket, note and amount.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
