# Feature Specification: Income Plan

**Feature Branch**: `002-income-plan` (baseline, no branch)

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Migrated verbatim from the OpenSpec `income-plan` capability. History is in `docs/openspec-archive/`.

This is a baseline spec: it describes the current behavior of the app and is kept up to date when a later feature changes that behavior.

## Purpose

Lets the user list their fixed expenses and define how the rest of their monthly income is split between wants and savings, and gives the euro target for each bucket in any month. The buckets are shown to the user as Fixed, Wants (leisure) and Savings.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recurring monthly income

**Implements**: FR-001

**Acceptance Scenarios**:

1. *Set recurring income*: **When** the user enters 2500,00 € as their monthly income and saves, **Then** the current month and following months without an override use 2500,00 € as their income
2. *Reject invalid income*: **When** the user enters zero or a negative amount, **Then** the system does not save the plan and shows that the income must be greater than zero
3. *Empty income*: **When** the income is empty, **Then** the save action is disabled and the system does not save the plan

---

### User Story 2 - Live euro preview while editing

**Implements**: FR-002

**Acceptance Scenarios**:

1. *Preview updates on change*: **Given** an income of 2000,00 € and fixed expenses of 1000,00 €, **When** the user changes savings from 10 % to 25 %, **Then** savings changes from 200,00 € to 500,00 € and wants from 800,00 € (40 %) to 500,00 € (25 %) without saving

---

### User Story 3 - Bucket amounts always add up to the income

**Implements**: FR-003

**Acceptance Scenarios**:

1. *Rounding remainder*: **Given** an income of 1000,01 €, fixed expenses of 500,00 € and savings 20 %, **When** the targets are computed, **Then** the three targets add up to exactly 1000,01 €

---

### User Story 4 - Per-month income override

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Month with a different income*: **Given** a recurring income of 2000,00 €, fixed expenses of 1000,00 € and savings 30 % (wants 20 %), **When** the user sets this month's income to 2500,00 €, **Then** this month's targets are 1000,00 € fixed, 750,00 € savings and 750,00 € wants, **And** next month still uses 2000,00 €
2. *Remove the override*: **When** the user removes this month's override and confirms, **Then** this month's targets are computed from the recurring income again

---

### User Story 5 - Current month overview

**Implements**: FR-005

**Acceptance Scenarios**:

1. *First launch*: **When** the user opens the app without a saved plan, **Then** the home screen shows a prompt to set up the monthly plan instead of targets
2. *Plan exists*: **When** the user opens the app with a saved plan, **Then** the home screen shows the total spent against what the plan allows, wants, savings and the fixed total, and the plan screen shows the income

---

### User Story 6 - On-device persistence

**Implements**: FR-006

**Acceptance Scenarios**:

1. *Restart keeps the plan*: **When** the user saves a plan, closes the app and opens it again, **Then** the same plan and overrides are shown

---

### User Story 7 - Fixed expenses as a list

**Implements**: FR-007

**Acceptance Scenarios**:

1. *Fixed expenses above income*: **Given** a recurring income of 2000,00 €, **When** the fixed expenses list adds up to 2100,00 €, **Then** the system does not save the plan and shows that it is 100,00 € over the income

---

### User Story 8 - Income below fixed expenses

**Implements**: FR-008

**Acceptance Scenarios**:

1. *Month that doesn't cover fixed expenses*: **Given** fixed expenses of 1000,00 €, **When** this month's income is set to 800,00 €, **Then** the system warns that the income is 200,00 € short of the fixed expenses, **And** leisure and savings targets are 0,00 €

---

### User Story 9 - Plan changes apply from the current month onwards

**Implements**: FR-009

**Acceptance Scenarios**:

1. *Changing the plan in a later month*: **Given** a plan of 2000,00 € saved in July, **When** the user changes the income to 2400,00 € in December, **Then** December and the following months use 2400,00 €, **And** July to November still use 2000,00 €
2. *Saving twice in the same month*: **Given** a plan saved earlier this month, **When** the user saves a different plan this month, **Then** this month uses the latest plan and no past month changes

---

### User Story 10 - Savings and wants as a percentage of the income

**Implements**: FR-010

**Acceptance Scenarios**:

1. *Savings as a percentage*: **Given** a recurring income of 2000,00 €, **When** the user enters savings as 30 %, **Then** the editor shows 600,00 € next to it
2. *Income edited with a percentage bucket*: **Given** savings entered as 30 % and wants filled in automatically, **When** the user changes the income from 2000,00 € to 2500,00 €, **Then** savings becomes 750,00 € and wants is recomputed

---

### User Story 11 - Last edited of leisure and savings is kept

**Implements**: FR-011

**Acceptance Scenarios**:

1. *Two fields filled, third automatic*: **Given** an income of 2000,00 €, **When** the user sets fixed expenses to 1000,00 € and savings to 30 %, **Then** wants is filled in automatically with 20 % (400,00 €)
2. *Switching which bucket is kept*: **Given** fixed 1000,00 €, savings 30 % and wants automatic on 2000,00 €, **When** the user sets wants to 25 %, **Then** savings is filled in automatically with 25 % (500,00 €)

---

### User Story 12 - Plan must fit in the income

**Implements**: FR-012

**Acceptance Scenarios**:

1. *Kept bucket too high*: **Given** an income of 2000,00 € and fixed expenses of 1000,00 €, **When** the user sets savings to 60 %, **Then** the system does not save the plan and shows that it is 200,00 € over the income

---

### User Story 13 - Changes that cannot be saved and unreadable data

**Implements**: FR-013, FR-014

**Acceptance Scenarios**:

1. *Failed save*: **When** the plan or the month's income cannot be saved, **Then** a message explains it and the form stays open
2. *Unreadable plan*: **Given** a stored plan has the wrong format, **When** the user opens the home, plan, month income or month picker screen, **Then** the screen says some data could not be read and no data is changed

---

### User Story 14 - App updates keep the data

**Implements**: FR-015

**Acceptance Scenarios**:

1. *Update keeps the data*: **Given** data saved by an older version of the app, **When** the user opens a newer version, **Then** the same data is shown
2. *Update that cannot be applied*: **Given** the database cannot be updated, **When** the user opens the app, **Then** a message says the data is safe, instead of the app closing

---

### User Story 15 - The plan at a glance

**Implements**: FR-016

**Acceptance Scenarios**:

1. *Split shown on the plan screen*: **Given** an income of 2000,00 € with fixed expenses of 1000,00 €, wants of 400,00 € and savings of 600,00 €, **When** the user opens the plan screen, **Then** it shows the split as Fixed 50 %, Wants 20 % and Savings 30 %

---

### User Story 16 - 50/30/20 as a starting point

**Implements**: FR-017

**Acceptance Scenarios**:

1. *Suggested amounts*: **Given** an income of 2000,00 € and fixed expenses of 1000,00 €, **When** the user edits the plan, **Then** savings suggests 20 % and wants suggests the rest, 30 %, **And** no value is changed by the suggestion

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Recurring monthly income): The system SHALL let the user set a recurring monthly income in EUR, with cent precision, that applies to every month without an override from the month the plan is saved until the plan is changed. The income MUST be greater than zero.
- **FR-002** (Live euro preview while editing): The system SHALL show, while the user edits the income or any bucket, the euro amount and percentage of income of each bucket, including the automatic one, updated on every change and before saving.
- **FR-003** (Bucket amounts always add up to the income): The system SHALL compute each bucket's euro target rounded to the cent so that, whenever the month's income covers the fixed expenses, the three targets add up exactly to that income.
- **FR-004** (Per-month income override): The system SHALL let the user set a different income for the current month. That month SHALL keep the plan's fixed expenses and use the same rule as every month (FR-010). Other months keep using the recurring income. The user SHALL be able to remove the override, after confirming, to return that month to the recurring income. Overrides of past months are kept and shown but cannot be changed. The user reaches this from the plan editor.
- **FR-005** (Current month overview): The system SHALL show, on the home screen, the selected month (the current month by default), the total spent against what the plan allows, wants, savings and the fixed total, using the plan that applied to that month. The month's income, and whether it is only for this month, SHALL be shown on the plan screen. When the income is below the fixed expenses it SHALL show the shortfall warning. When no plan exists yet, the home screen SHALL invite the user to create one.
- **FR-006** (On-device persistence): The system SHALL store the plan and month overrides only on the device, keep them across app restarts, and never send them over the network.
- **FR-007** (Fixed expenses as a list): The system SHALL let the user list the monthly fixed expenses as items with a name and an amount in EUR. Their total SHALL stay the same in every month, including months with a different income, and MUST NOT exceed the recurring income. Each month's fixed part SHALL count as spent in full. Tapping it on the home screen SHALL show the items of the plan that applies to that month. Removing a filled item SHALL ask for confirmation.
- **FR-008** (Income below fixed expenses): The system SHALL warn the user when a month's income is lower than the fixed expenses, showing the shortfall in euros, and SHALL set that month's leisure and savings targets to 0 €.
- **FR-009** (Plan changes apply from the current month onwards): The system SHALL keep a history of the plan, including its list of fixed expenses. Saving the plan SHALL make it apply from the current month onwards, and every past month SHALL keep the plan that applied to it. Saving the plan again within the same month SHALL replace that month's version. A month before the first saved plan has no plan.
- **FR-010** (Savings and wants as a percentage of the income): The system SHALL let the user enter savings or wants only as a whole percentage of the income, showing its euro amount next to it. Every month SHALL use one rule: the kept part is its percentage of that month's income, never above what is left after the fixed expenses, and the other part takes the rest. Amounts saved in euros by older versions keep working for their months and open at the nearest percentage when edited.
- **FR-011** (Last edited of leisure and savings is kept): The system SHALL keep the value of whichever of leisure and savings the user edited last and SHALL fill the other one automatically with what is left of the income after fixed expenses and the kept bucket. Fixed expenses SHALL never be filled in automatically. The automatic part may show a decimal percentage. Changing the fixed expenses SHALL only adjust the automatic bucket; changing the income also changes the euros of the kept bucket, because it is a percentage.
- **FR-012** (Plan must fit in the income): The system SHALL NOT save a plan where fixed expenses plus the kept bucket exceed the recurring income, and SHALL show by how much it exceeds.
- **FR-013** (Changes that cannot be saved): The system SHALL validate every change before storing it, and SHALL show a message and keep the form open when a change is rejected or fails.
- **FR-014** (Unreadable data): The system SHALL check the format of the plan data it reads and, when it has the wrong format, SHALL say that some data could not be read instead of showing figures. It SHALL NOT change or delete the data.
- **FR-015** (App updates keep the data): The system SHALL update the on-device database when a new version needs it, keep the existing data, and show a message saying the data is safe if the update cannot be applied.
- **FR-016** (The plan at a glance): The system SHALL show the split between the three buckets with each bucket's share of the total: as a ring on the plan screen, and as one bar while editing the plan and while setting a month's income.
- **FR-017** (50/30/20 as a reference): The system SHALL show, once the income is valid, a suggested share for savings (20 % of the income, never above what is left) and for wants (the rest of what is left). Suggestions SHALL NOT change any value.
- **FR-018** (See the plan apart from changing it): The system SHALL show the current plan on a read-only screen, as a ring with the income and each part's share and amount, and SHALL let the user change it on a separate screen reached from Home.
- **FR-019** (Unsaved changes): Leaving the plan editor or the month's income form with unsaved changes SHALL ask before discarding them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
