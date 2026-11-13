# Feature Specification: Income Plan

**Feature Branch**: `002-income-plan` (baseline, no branch)

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Migrated from the OpenSpec `income-plan` capability; simplified by `008-simple-plan`; updated by 017-entry-and-daily-budget. History is in `docs/openspec-archive/`.

This is a baseline spec: it describes the current behavior of the app and is kept up to date when a later feature changes that behavior.

## Purpose

The plan is one number: the whole percentage of each month's recorded income the user wants to save. From it and the month's entries the app shows how much is left to spend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Income comes from what is recorded

**Implements**: FR-001

**Acceptance Scenarios**:

1. *Month's income*: **When** the user records incomes of 2000,00 € and 500,00 € in a month, **Then** that month's income is 2500,00 €
2. *No income yet*: **When** a month has no income, **Then** home says "Add this month's income" and offers repeating the most recent earlier month's total

---

### User Story 2 - One percentage for every month

**Implements**: FR-002, FR-003

**Acceptance Scenarios**:

1. *Default*: **Given** no saved plan, **When** a month's income is 2000,00 €, **Then** its savings goal is 400,00 € (20 %)
2. *Any income*: **Given** a plan of 30 %, **When** a month's income is 800,00 €, **Then** its goal is 240,00 €
3. *Rounding*: **Given** a plan of 20 %, **When** the income is 1000,01 €, **Then** the goal is 200,00 €

---

### User Story 3 - Left to spend

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Normal month*: **Given** 20 % and an income of 2000,00 €, **When** 150,00 € are saved and 900,00 € spent, **Then** home shows savings 150,00 € of 400,00 € with the goal bar a little over a third full, spent 900,00 € and 700,00 € left to spend
2. *Overspent*: **Given** 20 % and an income of 1000,00 €, **When** 900,00 € are spent, **Then** the month card turns red and shows -100,00 € left to spend; it is green again once left to spend is 0 or more
3. *Saved above the goal*: **Given** 20 % and an income of 2000,00 €, **When** 600,00 € are saved and 900,00 € spent, **Then** the goal shows as reached with a full bar and 500,00 € are left

---

### User Story 4 - Change the plan

**Implements**: FR-005, FR-006

**Acceptance Scenarios**:

1. *Preview in euros*: **Given** this month's income is 2000,00 €, **When** the user types 30 on My plan, **Then** it shows 600,00 € before saving
2. *Applies from now on*: **Given** 20 % saved in July and today in November, **When** the user saves 30 %, **Then** November onwards use 30 % and July to October keep 20 %
3. *Same month twice*: **When** the user saves twice in the same month, **Then** the latest value is used and no past month changes
4. *Invalid*: **When** the field is empty or not a whole number from 0 to 100, **Then** the plan cannot be saved
5. *Leaving with changes*: **Given** an unsaved percentage, **When** the user leaves, **Then** the app asks before discarding it

---

### User Story 5 - Errors, unreadable data and updates

**Implements**: FR-007, FR-008, FR-009

**Acceptance Scenarios**:

1. *Failed save*: **When** the plan cannot be saved, **Then** a message explains it and the screen stays open
2. *Unreadable plan*: **Given** a stored plan has the wrong format, **When** the user opens home or My plan, **Then** the screen says some data could not be read and no data is changed
3. *Update that cannot be applied*: **Given** the database cannot be updated, **When** the user opens the app, **Then** a message says the data is safe, instead of the app closing

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Income comes from what is recorded): A month's income SHALL be the sum of its income entries (see 001). The plan SHALL NOT store an income.
- **FR-002** (One percentage): The plan SHALL be one whole percentage from 0 to 100. With no saved plan every month uses 20 %.
- **FR-003** (Savings goal): A month's goal SHALL be its percentage of that month's income, rounded down to the cent.
- **FR-004** (Left to spend): When the selected month has income, home SHALL show the income, what was saved against the goal, what was spent and what is left to spend = income − expenses − the larger of the goal and what was saved. It can be negative. With a goal above 0 the savings tile shows a bar filled to saved ÷ goal (full at most); with a 0 % plan it says "No goal" and has no bar; when saved reaches a goal above 0 it says "Goal reached". The month card is red while left to spend is below 0 and green otherwise (added by 012-polish). In the current month, while left to spend is above 0, the card also says what can be spent per day: "≈ X / day · N days left" with N the days left including today and X = left to spend ÷ N rounded down to the cent, or "Today: X" on the last day (added by 017). A month with no income asks for it and offers repeating the most recent earlier month's total as one income with the note "Monthly income", dated today, or the month's last day in a past month.
- **FR-005** (Plan screen): My plan SHALL show the percentage and, while typing, the goal in euros for this month's income (or, with no income yet, ask for it), and SHALL save it. Leaving with unsaved changes SHALL ask before discarding them. It is not offered from past months.
- **FR-006** (Plan history): Saving SHALL apply from the current month onwards; every past month keeps the percentage that applied to it. Saving again in the same month replaces that month's version.
- **FR-007** (Changes that cannot be saved): The system SHALL validate the percentage before storing it, and SHALL show a message and keep the screen open when the save is rejected or fails.
- **FR-008** (Unreadable data): The system SHALL check the format of the plan data it reads and, when it is wrong, SHALL say that some data could not be read instead of showing figures. It SHALL NOT change or delete the data.
- **FR-009** (App updates): The system SHALL update the on-device database when a new version needs it and show a message saying the data is safe if the update cannot be applied. Data SHALL stay only on the device.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
