# Feature Specification: Recurring Entries

**Feature Branch**: `feat/018-recurring-entries`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Mark any entry (income, savings or expense) as 'Repeat every month': it repeats every month until you stop it. When the app is opened in a new month, every recurring entry is recorded in it on the 1st. Skipped months are not filled and past months never change. A section in My plan lists what repeats every month, with a monthly total, to review, change or stop it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mark an entry as monthly (Priority: P1)

**Why this priority**: Rent, salary and subscriptions are the same every month; typing them again each month is the main chore of manual logging.

**Independent Test**: In November, add an expense "Rent" of 900,00 € with "Repeat every month" on, then open the app in December.

**Acceptance Scenarios**:

1. *Switch*: **When** the user adds or edits an entry of the current month, **Then** the form shows a "Repeat every month" switch, off by default
2. *Mark on a new entry*: **Given** it is 15 November, **When** the user adds "Rent", Housing, 900,00 € on 15 November with the switch on, **Then** the entry is saved for 15 November as usual and Rent is added to the monthly list in My plan
3. *Mark an existing entry*: **When** the user edits an entry of the current month, turns the switch on and saves, **Then** it starts repeating from next month
4. *Past months*: **Given** the user edits or adds an entry in a past month, **Then** the switch is not shown
5. *Icon*: **Then** every entry that repeats, or was recorded by a repeat, shows a small repeat icon in home and Activity lists

---

### User Story 2 - New month starts filled in (Priority: P1)

**Why this priority**: The fixed costs must be counted from day one, so "Left to spend" is the real money left from the 1st.

**Independent Test**: With Rent 900,00 € and Salary 2 000,00 € repeating, open the app in a new month.

**Acceptance Scenarios**:

1. *Recorded on the 1st*: **Given** Rent and Salary repeat and December has not been opened yet, **When** the user opens the app on 4 December, **Then** December has Rent (Housing, 900,00 €) and Salary (2 000,00 €) dated 1 December, with the same kind, category and note
2. *Once per month*: **When** the user opens the app again in December, **Then** nothing is added a second time
3. *Deleted stays deleted*: **Given** the user deleted December's Rent, **When** the app is opened again in December, **Then** Rent does not come back in December, and it is recorded again in January
4. *Edited stays edited*: **When** the user changes December's Rent to 950,00 €, **Then** only December changes; January's Rent is still 900,00 €
5. *Skipped months*: **Given** the app was last opened in November, **When** it is opened in February, **Then** the recurring entries are recorded in February only; December and January stay as they were
6. *Repeat last income*: **Given** Salary repeats, **Then** the new month already has income and "Add this month's income" is not shown; **Given** no income repeats, **Then** "Add this month's income" and "Repeat last income" work as before
7. *Month changes while open*: **Given** the app is open on 30 November, **When** the user returns to it on 1 December, **Then** December is filled in as if the app had just been opened

---

### User Story 3 - Review what repeats (Priority: P1)

**Why this priority**: The user must see in one place what is recorded every month and how much it adds up to, and change it without hunting for entries.

**Independent Test**: With Salary +2 000,00 €, Rent 900,00 € and Netflix 12,99 € repeating, open My plan.

**Acceptance Scenarios**:

1. *List*: **When** the user opens My plan, **Then** below the percentage an "Every month" section lists each repeating item with its note (or category name when it has no note), its category icon and its amount, income with a "+"
2. *Total*: **Then** the section shows "Fixed costs: 912,99 € a month", the sum of the repeating expenses
3. *Empty*: **Given** nothing repeats, **Then** the section says "Nothing repeats yet." and offers Add
4. *Add*: **When** the user taps Add, **Then** the usual entry form opens for today with "Repeat every month" on; saving records today's entry and adds the item to the list
5. *Change*: **When** the user taps Rent, changes it to 950,00 € and saves, **Then** the list shows 950,00 € and the next new month records 950,00 €; this month's Rent keeps its amount
6. *Stop*: **When** the user taps Rent, then "Stop repeating", and confirms, **Then** Rent leaves the list and is not recorded in later months; entries already recorded stay
7. *Stop from the entry*: **When** the user turns the switch off on an entry of a repeating item and saves, **Then** the item stops repeating, as in scenario 6
8. *Past month*: **Given** the user is viewing a past month, **Then** My plan is not offered, as today

---

### Edge Cases

- **Item marked late in the month**: it is recorded from the next new month; the entry it was marked on is the current month's.
- **Two items with the same note**: both repeat; they are separate items.
- **Kind of an item**: fixed. To change it, the user stops the item and marks a new entry.
- **Changing an entry of a repeating item**: only that entry changes; the item keeps its amount, category and note.
- **First day already passed**: entries are always dated the 1st, even when the month is opened later.
- **Data format**: a repeating item with the wrong format is reported like other unreadable data (001 FR-008); it is never recorded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Mark): The entry form MUST offer a "Repeat every month" switch, off by default, for entries of the current month only. Saving with it on MUST keep the entry as entered and create a repeating item with the entry's kind, category, amount and note.
- **FR-002** (Record): When the app starts or comes back to the foreground in a current month that has not been filled, it MUST record every active repeating item once in that month, dated the 1st, with the item's kind, category, amount and note. Each item MUST be recorded at most once per month. Months never opened MUST NOT be filled, and past months MUST NOT change.
- **FR-003** (Recorded entries are normal): An entry recorded by a repeat MUST be editable and deletable like any other, changing only that month. Deleting it MUST NOT bring it back in the same month.
- **FR-004** (Review): My plan MUST show an "Every month" section listing the active repeating items (note or category name, category icon, amount, "+" for income), the sum of the repeating expenses as "Fixed costs: X a month", and an Add action that opens the entry form for today with the switch on.
- **FR-005** (Change and stop): Tapping an item MUST let the user change its amount, category and note, effective from the next month, or stop it after a confirmation. Turning the switch off on one of its entries MUST also stop it. Stopping MUST keep every recorded entry.
- **FR-006** (Icon): Entries linked to a repeating item, active or stopped, MUST show a repeat icon in home and Activity lists.
- **FR-007** (Saving and reading): Changes MUST be validated and stored like other changes (001 FR-007); repeating items MUST be format-checked when read (001 FR-008).
- **FR-008** (App update): The update that adds repeating items MUST keep every existing entry and plan unchanged; existing entries do not repeat.
- **FR-009** (Baseline specs): `specs/001-expenses` (entry form switch, repeat icon, entries recorded on the 1st) and `specs/002-income-plan` FR-005 (the "Every month" section in My plan) MUST be updated.

### Key Entities

- **Repeating item**: kind, category, amount in cents, note, whether it is active, and the last month it was recorded in.
- **Entry**: gains an optional link to the repeating item that recorded it or was marked from it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A month with N repeating items has its N entries on the first screen the user sees in that month, with no tap.
- **SC-002**: Marking an entry as monthly takes one extra tap on the form.
- **SC-003**: No repeating item is ever recorded twice in the same month, whatever the number of app openings.

## Assumptions

- "Fixed costs" counts expenses only; repeating income and savings are listed but not added to it.
- The repeat icon uses the app's existing icon set (Feather "repeat").
- The month is the phone's local month, as everywhere else in the app.
- No new library; works in Expo Go.

## Out of Scope

- Frequencies other than monthly, or a day of the month per item.
- Filling months the app was not opened in.
- Reminders or notifications of upcoming charges.
- Future-dated entries.
- Repeating items for past months, or changing an item's kind.