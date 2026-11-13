# Feature Specification: Categories

**Feature Branch**: `feat/015-categories`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Every entry gets a category from a fixed list for its kind, so the user can see what the money of each kind is made of. Expenses: Housing, Groceries, Transport, Eating out, Leisure, Health, Subscriptions, Other. Income: Salary, Freelance, Benefits, Gifts, Other. Savings: Emergency fund, Investments, Travel, Goal, Other. The form only offers the categories of the chosen kind. On home, selecting a kind's tile shows that kind split by category. Entries recorded before this change become Other. Fixed lists for now, no custom categories."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a category when recording (Priority: P1)

**Why this priority**: Without a category on each entry there is nothing to split; everything else builds on it.

**Independent Test**: Record an expense in Groceries, reopen it and check the category is kept.

**Acceptance Scenarios**:

1. *Categories of the kind*: **When** the user opens the form for an expense, **Then** it offers Housing, Groceries, Transport, Eating out, Leisure, Health, Subscriptions and Other, each with an icon; for income it offers Salary, Freelance, Benefits, Gifts and Other; for savings Emergency fund, Investments, Travel, Goal and Other
2. *Default*: **When** the user opens a new entry form, **Then** Other is selected, so an entry can still be saved without choosing a category
3. *Saved*: **When** the user records 45,20 € as an expense in Groceries, **Then** reopening it shows Groceries selected
4. *Changing kind*: **Given** a new entry form with the expense kind and Groceries selected, **When** the user switches the kind to income, **Then** the income categories are shown and Other is selected
5. *Editing*: **When** the user changes an entry's category from Other to Transport and saves, **Then** the entry keeps Transport and its amount, date and note are unchanged
6. *Unsaved change*: **When** the user only changes the category and leaves the form, **Then** the app asks before discarding the change

---

### User Story 2 - See a kind split by category (Priority: P1)

**Why this priority**: This is the answer to "where did my money go?", the reason for the feature.

**Independent Test**: Record expenses in three categories in one month, tap Spent on home and compare the split with the amounts recorded.

**Acceptance Scenarios**:

1. *Split*: **Given** a month with 320,00 € in Groceries, 650,00 € in Housing and 230,00 € in Other expenses, **When** the user taps Spent on home, **Then** above the list home shows Housing 650,00 € 54 %, Groceries 320,00 € 27 %, Other 230,00 € 19 %, largest first
2. *Income and savings*: **Given** a month with 2.000,00 € Salary and 300,00 € Freelance income, **When** the user taps Income, **Then** home shows Salary 2.000,00 € 87 % and Freelance 300,00 € 13 %; tapping Savings shows the savings split the same way
3. *Only used categories*: **Then** categories with no entries that month are not listed
4. *One category*: **Given** every expense of the month is in Groceries, **When** the user taps Spent, **Then** the split shows only Groceries 100 %
5. *No tile selected*: **When** no tile is selected, **Then** home shows no split
6. *Follows changes*: **When** the user moves an expense from Other to Health and comes back to home with Spent selected, **Then** the split shows the change

---

### User Story 3 - Category in the lists (Priority: P2)

**Why this priority**: The lists should tell at a glance what each entry was.

**Independent Test**: Record entries with and without notes in different categories and look at home and the Activity screen.

**Acceptance Scenarios**:

1. *Icon*: **Then** every row on home and on the Activity screen shows its category's icon in its kind's color
2. *No note*: **Given** an expense in Groceries without a note, **Then** its row reads "Groceries"; **Given** an expense in Other without a note, **Then** its row reads "Expense" as today
3. *With a note*: **Given** an expense in Groceries with the note "Market", **Then** its row reads "Market"

---

### User Story 4 - Existing entries are kept (Priority: P1)

**Why this priority**: Users already have months of data; the update must not lose or change any of it.

**Independent Test**: Install the previous version, record entries, update the app and check every entry.

**Acceptance Scenarios**:

1. *Update*: **Given** entries recorded with the previous version, **When** the app updates, **Then** every entry keeps its kind, amount, date and note and is in Other
2. *Repeat income*: **When** the user repeats last month's income from home, **Then** the new income entry is in Other

---

### Edge Cases

- **Kind changed on an existing entry**: when the user edits an entry and switches its kind, the category resets to Other, as for a new entry.
- **Percentages**: whole numbers rounded to the nearest (half up), so they may add up to 99 % or 101 %.
- **Many categories in a month**: the split lists all used categories (at most 8 for expenses) without hiding any.
- **Past months**: the split and categories work the same in past months.
- **Unreadable category**: a stored entry with an unknown category, or a category that does not belong to its kind, shows the "some data could not be read" screen and changes nothing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Fixed categories): Every entry MUST have exactly one category from its kind's list: expenses Housing, Groceries, Transport, Eating out, Leisure, Health, Subscriptions, Other; income Salary, Freelance, Benefits, Gifts, Other; savings Emergency fund, Investments, Travel, Goal, Other. Each category has an icon.
- **FR-002** (Form): The entry form MUST offer the categories of the selected kind, MUST select Other for a new entry and when the kind changes, and MUST keep the category when the entry is saved. A category change counts as an unsaved change.
- **FR-003** (Split on home): When a tile is selected on home, home MUST show that kind's total of the month split by category, largest first, each with its amount and its whole percentage of the kind's total (rounded to the nearest, half up), listing only categories with entries. With no tile selected there is no split.
- **FR-004** (Rows): List rows on home and on the Activity screen MUST show the category's icon in the kind's color, and MUST show the note, or the category name when there is no note, or the kind's name when there is no note and the category is Other.
- **FR-005** (Existing data): Updating the app MUST keep every existing entry unchanged and put it in Other. Repeating the last income from home records it in Other.
- **FR-006** (Validation and unreadable data): The system MUST reject a category that is not in the entry's kind list before storing it, and MUST show the "some data could not be read" screen when a stored category is unknown or does not match its kind, changing nothing.
- **FR-007** (Baseline spec): `specs/001-expenses` MUST be updated: FR-001 (category in the form), FR-006 (row text and icon), FR-009 (the split when a tile is selected), FR-010 (categories per kind), and their user stories.

### Key Entities

- **Category**: a fixed value per kind (no table of user data); its name and icon come with the app.
- **Entry**: gains a category, which must belong to the entry's kind. Entries recorded before this change are in Other.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After updating, 100 % of existing entries are still there with the same amounts, dates, kinds and notes.
- **SC-002**: From home, the user sees what a month's spending is made of in 1 tap.
- **SC-003**: Recording an entry without choosing a category takes no extra step compared with today.

## Assumptions

- Category names and icons are in English like the rest of the app (the Spanish names in the discussion map to these).
- Other is last in the form. In the split, categories with the same amount follow the list order.
- The Activity screen keeps its kind filter; it gets no category filter.

## Out of Scope

- Custom categories, renaming or hiding categories.
- Budgets or limits per category.
- Charts, trends or comparing categories between months.
- Filtering the lists by category or tapping a category in the split.
- Recurring entries (a later feature).
