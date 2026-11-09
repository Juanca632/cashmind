# Feature Specification: Fixed Expenses List

**Feature Branch**: `feat/006-fixed-expenses-list`

**Created**: 2026-11-09

**Status**: Implemented

**Input**: User description: "Before splitting money, the user first needs to say what they must pay every month. A simple list of named amounts (House, Transport, Supermarket...) is the base of the plan; it stays the same every month until the user changes it, even when the income goes up."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List what I must pay every month (Priority: P1)

The user builds the plan by first writing down each thing they must pay every month, with a name and an amount. The app adds them up.

**Why this priority**: A plan cannot be made without knowing where the essential money goes. Everything else depends on this total.

**Independent Test**: Add, change and remove items in the plan, save it, and confirm the fixed total on the home screen is their sum.

**Acceptance Scenarios**:

1. *Build the list*: **Given** no plan yet, **When** the user adds House 700,00 €, Transport 60,00 €, Phone 20,00 € and Supermarket 250,00 €, **Then** the plan shows a fixed total of 1030,00 €
2. *Change an item*: **Given** House at 700,00 € in a list totalling 1030,00 €, **When** the user changes House to 750,00 €, **Then** the total becomes 1080,00 €
3. *Remove an item*: **Given** a list totalling 1030,00 € with Phone at 20,00 €, **When** the user removes Phone, **Then** the total becomes 1010,00 €
4. *Invalid item*: **When** an item has no name or its amount is empty, zero or negative, **Then** the plan cannot be saved and the item shows what is wrong
5. *No fixed expenses*: **Given** an empty list, **When** the user saves the plan, **Then** it is saved with a fixed total of 0,00 €

---

### User Story 2 - Split only what is left (Priority: P1)

After the list comes the income, and the app shows what is left to split between savings and leisure.

**Why this priority**: This order is the purpose of the app: what I must pay, what comes in, and how I share the rest.

**Independent Test**: Enter a list and an income and confirm what is left, then split it.

**Acceptance Scenarios**:

1. *Split what is left*: **Given** a trial income of 2000,00 € and 970,00 € left, **When** the user sets savings to 20 %, **Then** it shows 400,00 €, **And** leisure is filled in with 28,5 % (570,00 €)
2. *Adjust by trial and error*: **Given** savings at 20 % and leisure filled in with 28,5 %, **When** the user sets leisure to 30 %, **Then** savings is filled in with 18,5 %
3. *List above the income*: **Given** a trial income of 1000,00 €, **When** the list totals 1030,00 €, **Then** the editor shows that it is 30,00 € over the income

---

### User Story 3 - Fixed expenses do not follow the income (Priority: P1)

The list stays the same every month until the user changes it. Earning more or less one month does not change it.

**Why this priority**: The developer's main rule: a higher salary must not raise the fixed expenses.

**Independent Test**: Save a list, change the income and confirm the fixed total is the same; change the list in a later month and confirm past months are untouched.

**Acceptance Scenarios**:

1. *Higher income*: **Given** a fixed total of 1030,00 € and savings at 20 %, **When** a month records an income of 2500,00 €, **Then** the fixed total stays 1030,00 €, savings is 500,00 € and leisure takes the remaining 970,00 €
2. *One different month*: **Given** a fixed total of 1030,00 € and savings at 20 %, **When** this month records an income of 3000,00 €, **Then** this month's fixed total stays 1030,00 €, savings is 600,00 € and leisure takes the remaining 1370,00 €
3. *Changes apply onwards*: **Given** a list saved in July with House at 700,00 €, **When** the user changes House to 750,00 € in December, **Then** December and later months use 750,00 €, **And** July to November still use 700,00 €
4. *Next month repeats*: **Given** a list saved this month, **When** a new month starts, **Then** the same list applies without doing anything

---

### User Story 4 - Fixed expenses count by themselves (Priority: P2)

The fixed part is treated as already spent. The list is edited from the plan, and during the month the user only records leisure and savings.

**Why this priority**: It removes the monthly chore of recording rent and bills, but the plan already has value without it.

**Independent Test**: With a saved list and no recorded expenses, open the home screen, tap Fixed, then open the add expense form.

**Acceptance Scenarios**:

1. *Nothing to record*: **Given** a list totalling 1030,00 € and no recorded expenses, **When** the user opens the home screen, **Then** the month's spent figure is 1030,00 €
2. *Only two choices*: **When** the user adds an expense, **Then** they can choose Leisure or Savings and not Fixed
3. *Parts on screen*: **When** the user sees the plan, **Then** the three parts are called Fixed, Leisure and Savings

---

### User Story 5 - Existing data is kept (Priority: P1)

Whoever already has a plan keeps it after updating, and can split their total into items later.

**Why this priority**: The app already holds the developer's real finances.

**Independent Test**: Update from a version with saved plans and expenses and confirm every month shows the same fixed total and the expenses are still there.

**Acceptance Scenarios**:

1. *Amount becomes one item*: **Given** a plan with fixed expenses of 1000,00 €, **When** the app updates, **Then** the list has one item of 1000,00 € named "Fixed expenses" that the user can edit or split
2. *Percentage becomes euros*: **Given** a plan with fixed expenses of 40 % of an income of 2000,00 €, **When** the app updates, **Then** the list has one item of 800,00 €
3. *Every past plan*: **Given** plans saved in several months, **When** the app updates, **Then** each month keeps the same fixed total it had
4. *Recorded fixed expenses*: **Given** an expense already recorded as fixed, **When** the app updates, **Then** it is still listed in its month, **And** it keeps its part if it is edited

---

### User Story 6 - See the plan apart from changing it (Priority: P2)

The plan is shown as a ring with its three parts. Editing is one button at the end of that screen.

**Why this priority**: The developer found one screen with everything hard to read.

**Independent Test**: Open the plan and confirm it has no fields, then open the editor from its button.

**Acceptance Scenarios**:

1. *The plan is shown with only a way to edit it*: **When** the user opens the plan, **Then** it shows the income and each part with its share and amount, with nothing to type
2. *Changing it happens on other screens*: **When** the user taps Edit plan or Edit fixed expenses at the end of the plan, **Then** a separate screen opens to edit that part
3. *Saving goes back to the plan*: **When** the user saves, **Then** they return to the plan

---

### Edge Cases

- **Income below the list in one month**: the existing shortfall warning applies and leisure and savings are 0,00 € that month.
- **Two items with the same name**: allowed.
- **Plan with no fixed expenses when updating**: the list is empty.
- **Leaving the plan without saving**: nothing changes, like any other plan edit.
- **Saving the list twice in the same month**: the latest list replaces that month's list and no past month changes.
- **List cannot be read**: the screen says some data could not be read and nothing is changed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to add, change and remove fixed expense items, each with a name of 1 to 40 characters and an amount in EUR greater than zero with cent precision.
- **FR-002**: The system MUST show the list total while editing, and use it as the plan's fixed expenses.
- **FR-003**: The fixed expenses MUST always be in euros. Entering them as a percentage MUST no longer be possible.
- **FR-004**: The first setup MUST start with the fixed expenses list and continue to the split. Afterwards the list and the split are edited on separate screens, both reached from the plan.
- **FR-005**: The split editor MUST say by how much the plan exceeds a trial income.
- **FR-006**: The fixed total MUST NOT change when a month's income changes.
- **FR-007**: The list MUST be saved together with the plan: it applies from the current month onwards until changed, every past month MUST keep the list that applied to it, and saving again in the same month MUST replace that month's list.
- **FR-008**: Each month's fixed part MUST count as spent in full without the user recording anything, and MUST show neither an amount left nor an amount over.
- **FR-009**: The fixed items MUST be listed and edited on their own screen, opened from a button at the end of the plan. The home screen includes their total in the month's spending and does not list them.
- **FR-010**: New expenses MUST be recorded only as leisure or savings. An expense already recorded as fixed MUST be kept, stay listed in its month and keep its part when edited.
- **FR-011**: The three parts MUST be shown as Fixed, Leisure and Savings.
- **FR-012**: A new plan MUST start with savings at 20 %.
- **FR-013**: When the app updates, each saved plan's fixed expenses MUST become one item named "Fixed expenses" with the same euro amount, a percentage being converted using that plan's income; a plan with no fixed expenses MUST get an empty list. No plan or expense MUST be lost.
- **FR-014**: The list MUST be stored only on the device, and the system MUST say some data could not be read instead of showing figures when a stored item has the wrong format, without changing it.
- **FR-015**: This feature MUST update the affected baseline specs, `001-expenses` and `002-income-plan`, in the same change.
- **FR-016**: Savings and leisure MUST be entered only as whole percentages of the total income, each showing its euro amount next to it. Entering them in euros MUST no longer be possible. Whichever of the two the user edits last is kept and the other shows the rest, so the three parts always add up to 100 % of the income; the part filled in automatically may show a decimal.
- **FR-017**: Every month MUST use the same rule: the kept part is its percentage of that month's income, never above what is left after the fixed expenses, and the other part takes the rest. This also applies to months whose income was set individually, including months already saved. A part saved in euros by an older version keeps its euro amount until the plan is saved again.
- **FR-018**: The system MUST show the current plan on its own screen, as a ring with the income and each part's share and amount, with nothing to type there, and MUST let the user open the editor from the end of that screen. Saving returns to it.
- **FR-019**: The system MUST ask for confirmation, with one shared dialog, before deleting an expense, removing a filled fixed expense from the list, removing a month's own income, or leaving a form with unsaved changes. Cancelling MUST change nothing.
- **FR-020**: The app MUST say what to do next where nothing else does: an empty month explains what to record, an empty part says so, and the plan editor says why Save is off and when this month keeps its own income. Saving a month's income returns to Home.
- **FR-021**: The home screen MUST show the total spent this month (fixed expenses plus leisure, never savings) as its main figure.
- **FR-022**: Expenses of any month with a plan MUST be editable; the five-day editable period is removed.
- **FR-023**: The home screen MUST offer one Add action beside the Activity title, with what is being added chosen in the form, and MUST show the day of each entry in the list.

### Key Entities

- **Fixed expense item**: Something the user must pay every month: a name and an amount in euros. Belongs to one version of the plan, so past months keep their own list, in the order the user added the items.
- **Plan version** (existing): The plan that applies from a given month. Its fixed expenses are now the total of its items.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
- **SC-002**: A first-time user can enter four fixed expenses and an income and see what is left in under 2 minutes.
- **SC-003**: After updating, 100 % of saved plans show the same fixed total in every month, and no recorded expense is missing.
- **SC-004**: A month with a list needs no recording at all for its fixed part to be fully counted.

## Assumptions

- Percentages for savings and leisure are a share of the total income, not of what is left (developer's decision). Plans already saved in euros keep their amounts for their months and open with the nearest percentage when edited.
- Items are added within the plan, not on a separate menu, and are saved with the "Save plan" action.
- Months that already have their own income are recalculated with the single rule (developer's decision); no stored data changes.
- Variable costs such as the supermarket are entered as an estimated item; going over that amount is not tracked, and the user raises the item instead.
- Depends on the redesign in commit 7c11349 (one card per part, plan bar).

## Out of Scope

- Marking items as paid.
- Changing the whole plan or the list for one month only.
- Tracking actual spending per fixed item.
- Payment dates, recurring schedules or reminders.
- Categories inside leisure.
