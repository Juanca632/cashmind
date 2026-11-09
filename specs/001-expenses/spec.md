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
2. *Invalid amount*: **When** the user tries to save an expense with a zero or negative amount, **Then** the system does not save it and shows that the amount must be greater than zero
3. *Empty amount*: **When** the amount is empty, **Then** the save action is disabled and the system does not save the expense

---

### User Story 2 - Savings entries count towards the savings goal

**Implements**: FR-002

**Acceptance Scenarios**:

1. *Saving after payday*: **Given** a savings target of 900,00 €, **When** the user records 600,00 € in savings, **Then** the savings progress shows 600,00 € of 900,00 €

---

### User Story 3 - Edit and delete an expense

**Implements**: FR-003

**Acceptance Scenarios**:

1. *Correct an amount*: **When** the user changes an expense from 12,50 € to 15,00 €, **Then** the list and the bucket's spending reflect 15,00 €
2. *Delete an expense*: **When** the user deletes an expense and confirms, **Then** it disappears from the list and no longer counts towards its bucket
3. *Deleting an expense can be cancelled*: **When** the user taps delete and cancels, **Then** nothing changes
4. *Leaving with changes*: **Given** an expense form with unsaved changes, **When** the user leaves, **Then** the app asks before discarding them

---

### User Story 4 - Past months can be corrected

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Forgotten expense*: **Given** today is 3 December, **When** the user opens November and adds an expense, **Then** it is saved and counts towards November
2. *Any past month*: **Given** today is 6 December, **When** the user views November, **Then** the expenses of November can be added, edited or deleted

---

### User Story 5 - Month progress against targets

**Implements**: FR-005

**Acceptance Scenarios**:

1. *Leisure over its limit*: **Given** a wants target of 400,00 €, **When** wants expenses add up to 450,00 €, **Then** the home screen shows that it is 50,00 € over
2. *Within the limit*: **Given** a wants target of 400,00 €, **When** wants expenses add up to 100,00 €, **Then** the home screen shows 300,00 € left
3. *Progress percentage*: **Given** a savings target of 900,00 € and a wants target of 400,00 €, **When** 630,00 € are saved and 200,00 € of wants are spent, **Then** savings shows 630,00 € of 900,00 € and wants shows 200,00 € of 400,00 €

---

### User Story 6 - Month expense list

**Implements**: FR-006

**Acceptance Scenarios**:

1. *Viewing a past month*: **When** the user picks a past month with expenses, **Then** the list shows that month's expenses and its progress per bucket

---

### User Story 7 - Changes that cannot be saved and unreadable data

**Implements**: FR-007, FR-008

**Acceptance Scenarios**:

1. *Failed save*: **When** an expense cannot be added, edited or deleted, **Then** a message explains it and the form stays open
2. *Unreadable expense*: **Given** a stored expense has the wrong format, **When** the user opens its month, **Then** the screen says some data could not be read and no data is changed

---

### User Story 8 - Look inside one part of the plan

**Implements**: FR-009

**Acceptance Scenarios**:

1. *Tapping a part lists only its expenses*: **Given** a month with expenses in several buckets, **When** the user taps one bucket on the home screen, **Then** the list shows only that bucket's expenses, **And** "Show all" brings back the full list

---

### User Story 9 - Fixed expenses are not recorded

**Implements**: FR-010

**Acceptance Scenarios**:

1. *Saving is not spending*: **When** the user adds an expense it counts as wants, and **When** the user taps Add savings it counts as savings
2. *An expense already recorded as fixed keeps its part*: **Given** an expense recorded as fixed by an older version, **When** the user edits it, **Then** it can stay fixed

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Record an expense): The system SHALL let the user record an expense with an amount in EUR greater than zero (cent precision), one part (wants or savings), chosen by how it is added (Add for wants, Add savings for savings), an optional note and a date. The date SHALL default to today, SHALL NOT be after today and stays within the month where the expense is recorded.
- **FR-002** (Savings entries count towards the savings goal): The system SHALL treat expenses in the savings bucket as money set aside, and SHALL show them as progress towards the month's savings target.
- **FR-003** (Edit and delete an expense): The system SHALL let the user change any field of an expense or delete it, in any month. Deleting SHALL ask for confirmation, and leaving the form with unsaved changes SHALL ask before discarding them.
- **FR-004** (Past months can be corrected): The system SHALL let the user add, edit and delete expenses in any month with a plan, up to today. There is no editable period.
- **FR-005** (Month progress against targets): The system SHALL show, for the selected month, the total spent (fixed expenses plus wants, never savings) against what the plan allows, and how much is left or over. For wants and savings it SHALL show the recorded amount against its target. The fixed part counts as spent in full by itself and shows its total and number of items.
- **FR-006** (Month expense list): The system SHALL list the selected month's expenses, newest date first, showing date, bucket, note and amount.
- **FR-007** (Changes that cannot be saved): The system SHALL validate every change before storing it, and SHALL show a message and keep the form open when a change is rejected or fails.
- **FR-008** (Unreadable data): The system SHALL check the format of the expenses it reads and, when one has the wrong format, SHALL say that some data could not be read instead of showing figures. It SHALL NOT change or delete the data.
- **FR-009** (Look inside one part of the plan): The system SHALL let the user tap wants or savings on the home screen to list only that part's expenses for the selected month, and SHALL let the user return to the full list. Tapping fixed shows the plan's list of fixed expenses (see 002).
- **FR-010** (Expenses recorded as fixed): New expenses SHALL NOT be recorded as fixed. An expense already recorded as fixed SHALL be kept, stay listed in its month and keep its part when edited.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
