# Feature Specification: Expenses

**Feature Branch**: `001-expenses` (baseline, no branch)

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Migrated from the OpenSpec `expenses` capability; updated by 007-recorded-income, 008-simple-plan, 014-activity-screen, 015-categories and 017-entry-and-daily-budget. History is in `docs/openspec-archive/`.

This is a baseline spec: it describes the current behavior of the app and is kept up to date when a later feature changes that behavior.

## Purpose

Lets the user record what they earn, save or spend, in any month, and see that month's entries.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record an expense

**Implements**: FR-001

**Acceptance Scenarios**:

1. *Add an expense*: **When** the user adds an expense of 12,50 € with the note "Cinema" and today's date, **Then** it appears in this month's list and the month's spending increases by 12,50 €
2. *Invalid amount*: **When** the user tries to save an expense with a zero or negative amount, **Then** the system does not save it and shows that the amount must be greater than zero
3. *Empty amount*: **When** the amount is empty, **Then** the save action is disabled and the system does not save the expense

---

### User Story 2 - Savings entries count towards the savings goal

**Implements**: FR-002

**Acceptance Scenarios**:

1. *Saving after payday*: **Given** a savings goal of 900,00 €, **When** the user records 600,00 € in savings, **Then** savings shows 600,00 € of 900,00 €

---

### User Story 3 - Edit and delete an expense

**Implements**: FR-003

**Acceptance Scenarios**:

1. *Correct an amount*: **When** the user changes an expense from 12,50 € to 15,00 €, **Then** the list and the month's spending reflect 15,00 €
2. *Delete an expense*: **When** the user deletes an expense and confirms, **Then** it disappears from the list and no longer counts
3. *Deleting an expense can be cancelled*: **When** the user taps delete and cancels, **Then** nothing changes
4. *Leaving with changes*: **Given** an expense form with unsaved changes, **When** the user leaves, **Then** the app asks before discarding them

---

### User Story 4 - Past months can be corrected

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Forgotten expense*: **Given** today is 3 December and nothing was ever recorded, **When** the user opens November and adds an expense, **Then** it is saved and counts towards November
2. *Any past month*: **Given** today is 6 December, **When** the user views November, **Then** the expenses of November can be added, edited or deleted

---

### User Story 5 - Month figures

**Implements**: FR-005

**Acceptance Scenarios**:

1. *Spent*: **When** a month's expenses add up to 900,00 €, **Then** home shows 900,00 € spent; savings and income are not spending

---

### User Story 6 - Month expense list

**Implements**: FR-006

**Acceptance Scenarios**:

1. *Viewing a past month*: **When** the user picks a past month with expenses, **Then** the list shows that month's entries and its figures
2. *Short list on home*: **Given** a month with 12 entries, **Then** home lists the 5 newest and a "See all (12)" link; with 5 entries or fewer it lists them all and shows no link
3. *Whole month*: **When** the user taps "See all", **Then** an Activity screen titled "Activity · <month>" lists every entry of that month, newest first; tapping one opens it to edit, and going back shows the change
4. *Row title and icon*: **Given** an expense in Groceries without a note, **Then** its row shows the Groceries icon and reads "Groceries"; in Other without a note it reads "Expense"; with a note it reads the note

---

### User Story 7 - Changes that cannot be saved and unreadable data

**Implements**: FR-007, FR-008

**Acceptance Scenarios**:

1. *Failed save*: **When** an expense cannot be added, edited or deleted, **Then** a message explains it and the form stays open
2. *Unreadable expense*: **Given** a stored expense has the wrong format, **When** the user opens its month, **Then** the screen says some data could not be read and no data is changed
3. *Unreadable date in the month picker*: **Given** a stored entry has a date in the wrong format, **When** the user opens the month picker, **Then** it says some data could not be read and no data is changed

---

### User Story 8 - Look inside one kind

**Implements**: FR-009

**Acceptance Scenarios**:

1. *Tapping a kind lists only its entries*: **Given** a month with entries of every kind, **When** the user taps Income, Spent or Savings on home, **Then** the list shows only those entries, **And** "Show all" brings back the full list
2. *Filter on the Activity screen*: **Given** the Spent tile is selected, **When** the user taps "See all", **Then** the Activity screen opens with Spent selected, **And** its All, Income, Spent and Savings filters change the list without changing home's tile
3. *Split by category*: **Given** a month with 650,00 € Housing, 320,00 € Groceries and 230,00 € Other expenses, **When** the user taps Spent, **Then** "By category" above the list shows Housing 650,00 € 54 %, Groceries 320,00 € 27 %, Other 230,00 € 19 %

---

### User Story 9 - Three kinds of entry

**Implements**: FR-010

**Acceptance Scenarios**:

1. *The form chooses*: **When** the user adds an entry, **Then** they choose Income, Savings or Expense
2. *Categories of the kind*: **When** the user picks a kind in the form, **Then** it offers that kind's categories with Other selected, and switching the kind selects Other again
3. *Older entries*: **Given** entries recorded before categories existed, **When** the app updates, **Then** they keep every field and are in Other

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Record an expense): The system SHALL let the user record an entry with an amount in EUR greater than zero (cent precision), one kind (income, savings or expense) chosen in the form, one category of that kind (Other by default and after changing the kind, see FR-010), an optional note and a date. The date SHALL default to today, SHALL NOT be after today and stays within the month where the entry is recorded; it moves one day at a time or is picked from Android's calendar by tapping it (see 017). The note field's example fits the kind: Cinema, Salary or Emergency fund.
- **FR-002** (Savings entries count towards the savings goal): Savings entries SHALL be money set aside and SHALL show as progress towards the month's savings goal (see 002).
- **FR-003** (Edit and delete an expense): The system SHALL let the user change any field of an entry or delete it, in any month. Deleting SHALL ask for confirmation, and leaving the form with unsaved changes SHALL ask before discarding them.
- **FR-004** (Past months can be corrected): The system SHALL let the user add, edit and delete entries in any month up to today. There is no editable period.
- **FR-005** (Month figures): When the selected month has income, the system SHALL show its income, savings and spending (the sum of its expenses); see 002 for the goal and what is left. Without income, home asks for it instead (see 002).
- **FR-006** (Month list): The system SHALL list the selected month's entries, newest first (by date, then by when they were recorded), showing the date, the category's icon (the kind's icon for Other) on the kind's color, the note (or the category's name when there is no note, or the kind's name for Other) and the amount. Home SHALL list at most the 5 newest of them; when there are more, it SHALL show a "See all (N)" link to an Activity screen that lists all of the month's entries the same way (see 014).
- **FR-007** (Changes that cannot be saved): The system SHALL validate every change before storing it, and SHALL show a message and keep the form open when a change is rejected or fails.
- **FR-008** (Unreadable data): The system SHALL check the format of the entries it reads and, when one has the wrong format, SHALL say that some data could not be read instead of showing figures. This includes entries of an earlier month that home reads to offer repeating the last income. It SHALL NOT change or delete the data.
- **FR-009** (Look inside one kind): When the month has income, the system SHALL let the user tap income, spent or savings on home to list only those entries, titled with that tile's name, and SHALL let the user return to the full list. The selected tile filters home's short list (and the count in "See all") and is the starting filter of the Activity screen, which has its own All, Income, Spent and Savings filter and shows the same empty texts. While a tile is selected, home SHALL show above the list that kind's month total split by category ("By category"), largest first, with each category's amount and whole percentage rounded to the nearest, listing only categories with entries. The Add action then adds that kind; with no tile selected it adds an expense.
- **FR-010** (Three kinds and their categories): Every entry SHALL be an income, a saving or an expense, with one category of its kind: expenses Housing, Groceries, Transport, Eating out, Leisure, Health, Subscriptions, Other; income Salary, Freelance, Benefits, Gifts, Other; savings Emergency fund, Investments, Travel, Goal, Other (see 015). Entries recorded as fixed or leisure by older versions become expenses, and entries from before categories are in Other, when the app updates. A stored category that is unknown or not of the entry's kind counts as unreadable data (FR-008).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
