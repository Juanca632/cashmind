# Feature Specification: Entry Form and Daily Budget

**Feature Branch**: `feat/017-entry-and-daily-budget`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Show on the month card how much can be spent per day for the rest of the month. In the entry form, pick the date from Android's calendar instead of only stepping day by day, show a note example that fits the kind, and remove the kind description under the kind choices, which categories made redundant."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - How much per day (Priority: P1)

**Why this priority**: "Left to spend" alone does not say whether today's spending is fine; the amount per remaining day does.

**Independent Test**: With a known left to spend, open home on a known day and check the daily line.

**Acceptance Scenarios**:

1. *Per day*: **Given** today is 20 November and left to spend is 420,00 €, **When** the user opens home, **Then** below the figure the card says "≈ 38,18 € / day · 11 days left" (420,00 € ÷ 11 days, rounded down to the cent; today counts)
2. *Last day*: **Given** today is 30 November and left to spend is 25,00 €, **Then** the card says "Today: 25,00 €"
3. *Overspent*: **Given** left to spend is below 0 or exactly 0, **Then** no daily line is shown
4. *Past month*: **Given** the user is viewing a past month, **Then** no daily line is shown
5. *No income*: **Given** the month has no income, **Then** the card asks for it as today and shows no daily line
6. *Follows changes*: **When** the user adds an expense of 22,00 € on 20 November with 420,00 € left, **Then** the line becomes "≈ 36,18 € / day · 11 days left"

---

### User Story 2 - Pick the date from a calendar (Priority: P1)

**Why this priority**: Moving one day at a time takes many taps for an entry from earlier in the month.

**Independent Test**: On 25 November, add an expense dated 3 November by tapping the date.

**Acceptance Scenarios**:

1. *Open*: **When** the user taps the date in the entry form, **Then** Android's calendar opens on the entry's date
2. *Pick*: **When** the user picks 3 November and confirms, **Then** the form shows 3 November and the entry is saved with it
3. *Limits*: **Then** the calendar only allows days of the entry's month, and never after today
4. *Cancel*: **When** the user closes the calendar without confirming, **Then** the date does not change
5. *Steps stay*: **Then** the previous and next day buttons still work as today
6. *Unsaved change*: **When** only the date was changed with the calendar and the user leaves, **Then** the app asks before discarding

---

### User Story 3 - A cleaner form (Priority: P2)

**Why this priority**: Small text that no longer helps, and an example that does not fit income or savings.

**Independent Test**: Open the form and switch between the three kinds.

**Acceptance Scenarios**:

1. *No kind description*: **Then** no description text appears below the Income / Savings / Expense choices
2. *Note example*: **Then** the note field's example reads "Cinema" for an expense, "Salary" for income and "Emergency fund" for savings, and changes when the kind changes

---

### Edge Cases

- **Daily amount with cents**: always rounded down to the cent, so following it never overspends.
- **Month with 31 days, first day**: on 1 December with 310,00 € left, the line is "≈ 10,00 € / day · 31 days left".
- **Entry in a past month**: the calendar opens on that month and allows all its days.
- **Entry in the current month**: the calendar allows from the 1st up to today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Daily line): In the current month, when left to spend is above 0, the month card MUST show "≈ X / day · N days left", where N is the days from today to the month's last day including today, and X is left to spend ÷ N rounded down to the cent; on the last day it MUST show "Today: X". It MUST NOT show in past months, without income, or when left to spend is 0 or below.
- **FR-002** (Calendar): Tapping the entry form's date MUST open Android's date picker on the current date of the form, limited to the entry's month and to today; confirming sets the date, closing leaves it unchanged. The day buttons stay.
- **FR-003** (Note example): The note field's example MUST fit the selected kind: "Cinema" (expense), "Salary" (income), "Emergency fund" (savings).
- **FR-004** (No kind description): The kind description under the kind choices MUST be removed.
- **FR-005** (Baseline specs): `specs/002-income-plan` FR-004 (the daily line on the month card) and `specs/001-expenses` FR-001 (date from a calendar) MUST be updated.

### Key Entities

- None. No data changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Any day of the entry's month can be set in at most 3 taps from the form.
- **SC-002**: The daily amount times the days left is never more than left to spend.

## Assumptions

- Amounts use the app's euro format with cents, like "Left to spend".
- Android's own date picker follows the phone's language and theme.
- The date picker library (`@react-native-community/datetimepicker`, the one Expo documents) was approved by the developer on 2026-11-13; it needs a new app build.

## Out of Scope

- Picking the time of day, or dates in another month than the entry's.
- A daily amount for savings or a daily history.
- Changing the plan or the left to spend rule.
