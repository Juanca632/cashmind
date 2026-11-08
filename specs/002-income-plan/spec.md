# Feature Specification: Income Plan

**Feature Branch**: `002-income-plan` (baseline, no branch)

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Migrated verbatim from the OpenSpec `income-plan` capability. History is in `docs/openspec-archive/`.

This is a baseline spec: it describes the current behavior of the app and is kept up to date when a later feature changes that behavior.

## Purpose

Lets the user define how their monthly income is split between fixed expenses, leisure and savings, and gives the euro target for each bucket in any month.

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

1. *Preview updates on change*: **Given** an income of 2000,00 € and fixed expenses of 1000,00 €, **When** the user changes savings from 10 % to 25 %, **Then** savings changes from 200,00 € to 500,00 € and leisure from 800,00 € (40 %) to 500,00 € (25 %) without saving

---

### User Story 3 - Bucket amounts always add up to the income

**Implements**: FR-003

**Acceptance Scenarios**:

1. *Rounding remainder*: **Given** an income of 1000,01 €, fixed expenses of 500,00 € and savings 20 %, **When** the targets are computed, **Then** the three targets add up to exactly 1000,01 €

---

### User Story 4 - Per-month income override

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Month with a different income*: **Given** a recurring income of 2000,00 €, fixed expenses of 1000,00 € and savings 30 % (leisure 20 %), **When** the user sets this month's income to 2500,00 €, **Then** this month's targets are 1000,00 € fixed, 600,00 € leisure and 900,00 € savings, **And** next month still uses 2000,00 €
2. *Remove the override*: **When** the user removes this month's override, **Then** this month's targets are computed from the recurring income again

---

### User Story 5 - Current month overview

**Implements**: FR-005

**Acceptance Scenarios**:

1. *First launch*: **When** the user opens the app without a saved plan, **Then** the home screen shows a prompt to set up the monthly plan instead of targets
2. *Plan exists*: **When** the user opens the app with a saved plan, **Then** the home screen shows the current month's income and the three bucket targets

---

### User Story 6 - On-device persistence

**Implements**: FR-006

**Acceptance Scenarios**:

1. *Restart keeps the plan*: **When** the user saves a plan, closes the app and opens it again, **Then** the same plan and overrides are shown

---

### User Story 7 - Fixed expenses as an amount

**Implements**: FR-007

**Acceptance Scenarios**:

1. *Fixed expenses shown as a share of income*: **Given** a recurring income of 2000,00 €, **When** the user sets fixed expenses to 1000,00 €, **Then** the system shows that fixed expenses are 50 % of the income
2. *Fixed expenses above income*: **Given** a recurring income of 2000,00 €, **When** the user sets fixed expenses to 2100,00 €, **Then** the system does not save the plan and shows that fixed expenses cannot exceed the income

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

### User Story 10 - Buckets in euros or percent

**Implements**: FR-010

**Acceptance Scenarios**:

1. *Savings as a percentage*: **Given** a recurring income of 2000,00 €, **When** the user enters savings as 30 %, **Then** the editor shows 600,00 € next to it
2. *Income edited with a percentage bucket*: **Given** savings entered as 30 % and leisure filled in automatically, **When** the user changes the income from 2000,00 € to 2500,00 €, **Then** savings becomes 750,00 € and leisure is recomputed

---

### User Story 11 - Last edited of leisure and savings is kept

**Implements**: FR-011

**Acceptance Scenarios**:

1. *Two fields filled, third automatic*: **Given** an income of 2000,00 €, **When** the user sets fixed expenses to 1000,00 € and savings to 30 %, **Then** leisure is filled in automatically with 400,00 €
2. *Switching which bucket is kept*: **Given** fixed 1000,00 €, savings 30 % and leisure automatic on 2000,00 €, **When** the user sets leisure to 500,00 €, **Then** savings is filled in automatically with 500,00 €

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

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Recurring monthly income): The system SHALL let the user set a recurring monthly income in EUR, with cent precision, that applies to every month without an override from the month the plan is saved until the plan is changed. The income MUST be greater than zero.
- **FR-002** (Live euro preview while editing): The system SHALL show, while the user edits the income or any bucket, the euro amount and percentage of income of each bucket, including the automatic one, updated on every change and before saving.
- **FR-003** (Bucket amounts always add up to the income): The system SHALL compute each bucket's euro target rounded to the cent so that, whenever the month's income covers the fixed expenses, the three targets add up exactly to that income.
- **FR-004** (Per-month income override): The system SHALL let the user set a different income for the current month. That month SHALL keep the plan's fixed expenses, and the money left after them SHALL be shared between leisure and savings in the same proportion as in the plan. Other months keep using the recurring income. The user SHALL be able to remove the override to return that month to the recurring income. Overrides of past months are kept and shown but cannot be changed.
- **FR-005** (Current month overview): The system SHALL show, on the home screen, the selected month (the current month by default), its income (marking whether it is an override) and, for each bucket, its euro target, using the plan that applied to that month. When the income is below the fixed expenses it SHALL show the shortfall warning. When no plan exists yet, the home screen SHALL invite the user to create one.
- **FR-006** (On-device persistence): The system SHALL store the plan and month overrides only on the device, keep them across app restarts, and never send them over the network.
- **FR-007** (Fixed expenses as an amount): The system SHALL let the user set the monthly fixed expenses in EUR or as a percentage of the recurring income. The resulting amount SHALL stay the same in every month, including months with a different income. The amount MUST be zero or more and MUST NOT exceed the recurring income. The system SHALL show the value in the other unit.
- **FR-008** (Income below fixed expenses): The system SHALL warn the user when a month's income is lower than the fixed expenses, showing the shortfall in euros, and SHALL set that month's leisure and savings targets to 0 €.
- **FR-009** (Plan changes apply from the current month onwards): The system SHALL keep a history of the plan. Saving the plan SHALL make it apply from the current month onwards, and every past month SHALL keep the plan that applied to it. Saving the plan again within the same month SHALL replace that month's version. A month before the first saved plan has no plan.
- **FR-010** (Buckets in euros or percent): The system SHALL let the user enter each entered bucket either as an amount in EUR (cent precision) or as a whole-number percentage of the recurring income, switching per field, and SHALL show the value in the other unit next to it. A bucket entered as a percentage SHALL keep its percentage when the recurring income is edited, and one entered in EUR SHALL keep its amount.
- **FR-011** (Last edited of leisure and savings is kept): The system SHALL keep the value of whichever of leisure and savings the user edited last and SHALL fill the other one automatically with what is left of the income after fixed expenses and the kept bucket. Fixed expenses SHALL never be filled in automatically. Changing the income or fixed expenses SHALL only adjust the automatic bucket.
- **FR-012** (Plan must fit in the income): The system SHALL NOT save a plan where fixed expenses plus the kept bucket exceed the recurring income, and SHALL show by how much it exceeds.
- **FR-013** (Changes that cannot be saved): The system SHALL validate every change before storing it, and SHALL show a message and keep the form open when a change is rejected or fails.
- **FR-014** (Unreadable data): The system SHALL check the format of the plan data it reads and, when it has the wrong format, SHALL say that some data could not be read instead of showing figures. It SHALL NOT change or delete the data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
