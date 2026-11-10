# Feature Specification: Simple Plan

**Feature Branch**: `feat/008-simple-plan`

**Created**: 2026-11-10

**Status**: Implemented

**Input**: User description: "Make the app simpler. The plan is only the percentage of each month's income I want to save. Remove the fixed expenses list, the leisure part and the plan simulator. On the home screen I record income, savings and expenses, and I see what I earned, my savings goal and what I saved, what I spent, and what is left to spend. It must work for any income."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the month at a glance (Priority: P1)

The home screen answers one question: how much can I still spend this month?

**Why this priority**: It is the reason the app exists.

**Independent Test**: Record an income, a saving and an expense in a month and read the home screen.

**Acceptance Scenarios**:

1. *Month with entries*: **Given** a savings goal of 20 %, **When** the month has an income of 2000,00 €, savings of 150,00 € and expenses of 900,00 €, **Then** home shows income 2000,00 €, savings 150,00 € of 400,00 €, spent 900,00 € and 700,00 € left to spend
2. *Spent more than possible*: **Given** a savings goal of 20 % and an income of 1000,00 €, **When** expenses add up to 900,00 €, **Then** home shows -100,00 € left to spend
3. *Saved more than the goal*: **Given** a savings goal of 20 % and an income of 2000,00 €, **When** the user saves 600,00 € and spends 900,00 €, **Then** the savings goal shows as reached and 500,00 € are left to spend
4. *Several incomes*: **Given** a savings goal of 20 % and an income of 2000,00 €, **When** the user adds an income of 500,00 €, **Then** the income is 2500,00 € and the goal 500,00 €

---

### User Story 2 - Record income, savings and expenses (Priority: P1)

Every entry is one of three kinds: income, savings or expense. Rent is an expense like any other.

**Why this priority**: Everything on home comes from these entries.

**Independent Test**: Add one entry of each kind and see each one in Activity.

**Acceptance Scenarios**:

1. *Choose the kind*: **When** the user adds an entry, **Then** they choose Income, Savings or Expense
2. *Look inside one kind*: **Given** a month with entries of every kind, **When** the user taps Spent on home, **Then** the list, titled Spent, shows only expenses, **And** "Show all" brings back every entry
3. *Any month*: **Given** today is 3 December and nothing was ever recorded, **When** the user opens November and adds an expense, **Then** it is saved and counts towards November

---

### User Story 3 - The plan is one percentage (Priority: P1)

**Why this priority**: The plan must be easy to understand and work for any income.

**Independent Test**: Change the percentage and see the goal change on home.

**Acceptance Scenarios**:

1. *Default*: **Given** the user never saved a plan, **When** the month has an income of 2000,00 €, **Then** the savings goal is 20 % (400,00 €)
2. *Change it*: **Given** this month's income is 2000,00 €, **When** the user sets the plan to 30 % and saves, **Then** the plan screen showed 600,00 € while typing, and home shows a goal of 600,00 €
3. *Any income*: **Given** a plan of 30 %, **When** a month's income is 800,00 €, **Then** its goal is 240,00 €
4. *Invalid percentage*: **When** the field is empty or not a whole number from 0 to 100, **Then** the plan cannot be saved
5. *Leaving with changes*: **Given** an unsaved percentage, **When** the user leaves the plan screen, **Then** the app asks before discarding it

---

### User Story 4 - Past months keep their plan (Priority: P2)

**Why this priority**: Changing the plan must not rewrite history.

**Independent Test**: Save a new percentage and look at a past month.

**Acceptance Scenarios**:

1. *Change applies from now on*: **Given** a plan of 20 % saved in July and today in November, **When** the user saves 30 %, **Then** November and later use 30 %, **And** July to October still use 20 %
2. *Past month is read-only for the plan*: **When** the user views a past month, **Then** the plan cannot be changed from there, and its entries can still be changed

---

### User Story 5 - A month with no income yet (Priority: P2)

**Why this priority**: Every month starts this way.

**Acceptance Scenarios**:

1. *Asks for income*: **Given** a month with no income, **When** the user opens it, **Then** home says "Add this month's income" instead of the figures
2. *Repeat the last income*: **Given** last month's income was 2000,00 €, **When** the user taps repeat, **Then** one income of 2000,00 € is added to this month

---

### Edge Cases

- **Expenses but no income**: expenses stay listed and home keeps asking for income.
- **Goal rounding**: the goal is rounded down to the cent (20 % of 1000,01 € is 200,00 €).
- **0 %**: no goal (the savings tile says "No goal"); left to spend is income minus expenses minus what was saved.
- **Old data**: expenses recorded as fixed or leisure become expenses; a plan with savings as a percentage keeps it; any other plan becomes 20 %. The fixed expenses list is removed. Before v1.0.0 nothing else needs to be kept.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An entry MUST be an income, a saving or an expense, with an amount in EUR above zero, an optional note and a date up to today, in any month. Entries can be edited and deleted; deleting asks for confirmation.
- **FR-002**: The plan MUST be one whole percentage from 0 to 100: the share of each month's income to save. With no saved plan it is 20 %.
- **FR-003**: Every month MUST use one rule: goal = its percentage of the month's income, rounded down to the cent; left to spend = income − expenses − the larger of the goal and what was saved. Left to spend can be negative.
- **FR-004**: Home MUST show, for the selected month, the income, what was saved against the goal, what was spent, and what is left to spend. With no income it MUST ask for it and offer repeating the most recent earlier month's total.
- **FR-005**: Tapping income, savings or spent on home MUST list only those entries in Activity, with a way back to all.
- **FR-006**: The plan screen MUST show the percentage, the euro goal for this month's income while typing, and save it. Saving applies from the current month onwards; past months keep theirs.
- **FR-007**: The fixed expenses list and screen, the leisure part, the trial income and the shortfall warnings MUST be removed.
- **FR-008**: The month picker MUST go back to the year of the first recorded entry, and always at least to the previous year.
- **FR-009**: When the app updates, data MUST be converted as described in Edge Cases.
- **FR-010**: Baseline specs 001, 002 and 003 MUST be updated in the same change.

### Key Entities

- **Entry**: amount, date, optional note and kind (income, savings or expense).
- **Plan version**: savings percentage and the month it applies from.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
- **SC-002**: A user sees how much is left to spend in one look at home, without opening another screen.
- **SC-003**: Setting up the plan takes one field and one tap.

## Assumptions

- The user records rent and bills as ordinary expenses.
- Savings are recorded by hand; the goal is a target, not an automatic transfer.

## Out of Scope

- Expense categories (fixed, leisure or others).
- Repeating last month's expenses.
- Rollover between months.
- Keeping the fixed expenses list or old plans exactly as they were.
