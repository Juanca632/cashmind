# Feature Specification: Recorded Income

**Feature Branch**: `feat/007-recorded-income`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Record what I earn the same way I record what I spend and save. The plan only keeps the fixed expenses and the percentages; a simulator helps me choose them. Everything is calculated from what I record. The goal is flexibility, not more complexity."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record what I earn (Priority: P1)

The user records each income like an expense or a saving. A month's income is the sum of what was recorded.

**Why this priority**: It replaces the fixed monthly salary and the one-month exception with one simple action.

**Independent Test**: Add two incomes to a month and confirm the month's figures use their sum.

**Acceptance Scenarios**:

1. *Add income*: **Given** a plan with fixed expenses of 1030,00 € and savings at 20 %, **When** the user adds an income of 2000,00 €, **Then** the month allows 1030,00 € fixed, 400,00 € savings and 570,00 € leisure
2. *Several incomes*: **Given** an income of 2000,00 € this month, **When** the user adds 500,00 €, **Then** savings becomes 500,00 € and leisure 970,00 €
3. *Change an income*: **When** the user changes an income or deletes it after confirming, **Then** the month's figures update
4. *Invalid amount*: **When** the amount is empty, zero or negative, **Then** the income cannot be saved
5. *In the list*: **When** the user opens a month, **Then** its incomes are listed in Activity with its expenses and savings

---

### User Story 2 - A month with no income yet (Priority: P1)

Before the salary arrives, the app asks for it instead of warning about a problem.

**Why this priority**: Every month starts this way.

**Independent Test**: Open a month with a plan and no income.

**Acceptance Scenarios**:

1. *Asks for income*: **Given** a month with a plan and no income, **When** the user opens it, **Then** the home card says "Add this month's income" and no shortfall warning appears
2. *Repeat the last income*: **Given** last month's income was 2000,00 €, **When** the user taps repeat, **Then** one income of 2000,00 € is added to this month
3. *Nothing to repeat*: **Given** no earlier month has income, **When** the user opens the month, **Then** only adding an income is offered

---

### User Story 3 - The plan is a simulator (Priority: P1)

Editing the plan lets the user try an income and see the split. Only the fixed expenses and the percentage are saved.

**Why this priority**: The plan has to work for any income.

**Independent Test**: Type a trial income, save, and confirm no income was recorded.

**Acceptance Scenarios**:

1. *See the split*: **Given** fixed expenses of 1030,00 € and savings at 20 %, **When** the user types a trial income of 2000,00 €, **Then** the editor shows savings 400,00 € and leisure 28,5 % (570,00 €)
2. *Trial income is not saved*: **When** the user saves the plan after typing a trial income, **Then** no income is recorded and the month's figures do not change because of it
3. *No trial income*: **Given** a valid list and percentage and an empty trial income, **When** the user saves, **Then** the plan is saved
4. *Trial above what is available*: **Given** a trial income that does not cover the plan, **When** the editor shows it, **Then** it says so and the plan can still be saved

---

### User Story 4 - One rule for every month (Priority: P1)

**Why this priority**: The developer wants no conditional rules.

**Independent Test**: Record different incomes in two months and compare.

**Acceptance Scenarios**:

1. *Higher income*: **Given** fixed expenses of 1030,00 € and savings at 20 %, **When** a month's income is 3000,00 €, **Then** savings is 600,00 € and leisure 1370,00 €
2. *Income below fixed*: **Given** fixed expenses of 1030,00 €, **When** a month's income is 800,00 €, **Then** a warning says it is 230,00 € short, and leisure and savings are 0,00 €

---

### User Story 5 - See the current plan (Priority: P2)

**Why this priority**: The plan stays visible but the screen does not depend on editing.

**Independent Test**: Open My plan with and without income this month.

**Acceptance Scenarios**:

1. *With income*: **Given** this month's income is 2000,00 €, **When** the user opens My plan, **Then** the ring and rows show each part's share and amount for that income
2. *Without income*: **Given** no income this month, **When** the user opens My plan, **Then** it shows the fixed total and the percentage, and says the split appears once income is added

---

### User Story 6 - Existing data is kept (Priority: P1)

**Why this priority**: The app holds real finances.

**Independent Test**: Upgrade saved data and confirm each month shows the same figures.

**Acceptance Scenarios**:

1. *Plan income becomes entries*: **Given** a plan of 2000,00 € saved in July and today in November, **When** the app updates, **Then** July to November each have one income of 2000,00 €
2. *One-month income*: **Given** September had its own income of 3000,00 €, **When** the app updates, **Then** September has one income of 3000,00 €
3. *Plan change*: **Given** plans of 2000,00 € from July and 2400,00 € from October, **When** the app updates, **Then** September has 2000,00 € and October 2400,00 €
4. *Everything else*: **When** the app updates, **Then** fixed lists, percentages, amounts saved in euros and all recorded entries are unchanged

---

### Edge Cases

- **No income and spending recorded**: spending stays listed; the card keeps asking for income.
- **Repeat when last month had several incomes**: one entry with their total.
- **Repeat in a past month**: dated on that month's last day; otherwise today.
- **Months without a plan**: income is not offered, as with expenses.
- **Editing an income's date**: stays within its month and never after today.
- **Deleting the only income**: the month goes back to asking for income.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to add, edit and delete income entries with an amount in EUR above zero, an optional note and a date, in any month with a plan, up to today. Deleting MUST ask for confirmation.
- **FR-002**: A month's income MUST be the sum of its income entries, and every figure of the month MUST follow from it.
- **FR-003**: The plan MUST store only the fixed expenses list and the kept share. It MUST NOT store an income.
- **FR-004**: Every month MUST use one rule: the fixed total as listed; the kept part as its percentage of that month's income, never above what is left; the other part takes the rest. If the income does not cover the fixed total, leisure and savings MUST be 0 € and a warning MUST show the shortfall.
- **FR-005**: The plan editor MUST let the user type a trial income, show the resulting split, and MUST NOT store the trial income. An empty or insufficient trial income MUST NOT block saving.
- **FR-006**: A month with a plan and no income MUST show "Add this month's income" with no shortfall warning, and MUST offer repeating the most recent earlier month's total as one entry.
- **FR-007**: Home MUST offer one Add action where the user chooses income, leisure or savings, and income entries MUST appear in Activity. Home MUST show what is left of leisure and of savings, each with its percentage, and MUST NOT show a fixed tile.
- **FR-008**: The one-month income override, its screen and its action MUST be removed.
- **FR-009**: My plan MUST stay read-only and show each part's share and amount for this month's income, or the fixed total and percentage when there is no income yet.
- **FR-010**: When the app updates, every month from the first plan to the current one MUST get one income entry with the income it had, its own if it had one, otherwise its plan's. Nothing else MUST change and no data MUST be lost.
- **FR-011**: Baseline specs 001, 002 and 003 MUST be updated in the same change.
- **FR-012**: My plan MUST offer Edit plan and Edit fixed expenses at its end, each opening its own screen. The trial income exists only in Edit plan.

### Key Entities

- **Income entry**: Money received: amount, date and optional note. Recorded the same way as expenses and savings.
- **Plan version** (existing): Fixed expenses list and kept share, from a given month. No longer has an income.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
- **SC-002**: A new month can be set up with one tap when the income is the same as last month.
- **SC-003**: After updating, 100 % of past months show the same income, fixed total and split as before.

## Assumptions

- A plan saved with its share in euros keeps that amount for its months and opens at the nearest percentage when an income is known.
- The trial income starts with this month's income when there is one.
- Income is recorded when received; the app does not forecast.

## Out of Scope

- Income categories or sources.
- Recurring income schedules or reminders.
- Expected or forecast income.
- Rollover between months.
- Changing the plan for one month only.
