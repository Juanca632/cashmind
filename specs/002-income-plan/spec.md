# Feature Specification: Income Plan

**Feature Branch**: `002-income-plan` (baseline, no branch)

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Migrated verbatim from the OpenSpec `income-plan` capability. History is in `docs/openspec-archive/`.

This is a baseline spec: it describes the current behavior of the app and is kept up to date when a later feature changes that behavior.

## Purpose

Lets the user list their fixed expenses and define what share of each month's recorded income goes to savings or leisure, and gives the euro target for each bucket in any month. The buckets are shown to the user as Fixed, Leisure and Savings.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Income comes from what is recorded

**Implements**: FR-001

**Acceptance Scenarios**:

1. *Month's income*: **When** the user records incomes of 2000,00 € and 500,00 € in a month, **Then** that month's income is 2500,00 €
2. *No income yet*: **When** a month has no income, **Then** the home screen asks for it and shows no shortfall

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

### User Story 4 - One rule for every month

**Implements**: FR-004

**Acceptance Scenarios**:

1. *Month with a different income*: **Given** fixed expenses of 1000,00 € and savings 30 %, **When** a month's income is 2500,00 €, **Then** that month's targets are 1000,00 € fixed, 750,00 € savings and 750,00 € leisure

---

### User Story 5 - Current month overview

**Implements**: FR-005

**Acceptance Scenarios**:

1. *First launch*: **When** the user opens the app without a saved plan, **Then** the home screen shows a prompt to set up the monthly plan instead of targets
2. *Plan exists*: **When** the user opens the app with a saved plan, **Then** the home screen shows the total spent and what is left of leisure and savings, and the plan screen shows the income

---

### User Story 6 - On-device persistence

**Implements**: FR-006

**Acceptance Scenarios**:

1. *Restart keeps the plan*: **When** the user saves a plan, closes the app and opens it again, **Then** the same plan is shown

---

### User Story 7 - Fixed expenses as a list

**Implements**: FR-007

**Acceptance Scenarios**:

1. *Fixed expenses above income*: **Given** a trial income of 2000,00 €, **When** the fixed expenses list adds up to 2100,00 €, **Then** the system shows that it is 100,00 € over this income

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

### User Story 10 - Savings and leisure as a percentage of the income

**Implements**: FR-010

**Acceptance Scenarios**:

1. *Savings as a percentage*: **Given** a trial income of 2000,00 €, **When** the user enters savings as 30 %, **Then** the editor shows 600,00 € next to it
2. *Income edited with a percentage bucket*: **Given** savings entered as 30 % and leisure filled in automatically, **When** the user changes the trial income from 2000,00 € to 2500,00 €, **Then** savings becomes 750,00 € and leisure is recomputed

---

### User Story 11 - Last edited of leisure and savings is kept

**Implements**: FR-011

**Acceptance Scenarios**:

1. *Two fields filled, third automatic*: **Given** an income of 2000,00 €, **When** the user sets fixed expenses to 1000,00 € and savings to 30 %, **Then** leisure is filled in automatically with 20 % (400,00 €)
2. *Switching which bucket is kept*: **Given** fixed 1000,00 €, savings 30 % and leisure automatic on 2000,00 €, **When** the user sets leisure to 25 %, **Then** savings is filled in automatically with 25 % (500,00 €)

---

### User Story 12 - A plan that does not fit a trial income

**Implements**: FR-012

**Acceptance Scenarios**:

1. *Kept bucket too high*: **Given** a trial income of 2000,00 € and fixed expenses of 1000,00 €, **When** the user sets savings to 60 %, **Then** the system shows that it is 200,00 € over this income, and the plan can still be saved

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

1. *Split shown on the plan screen*: **Given** an income of 2000,00 € with fixed expenses of 1000,00 €, leisure of 400,00 € and savings of 600,00 €, **When** the user opens the plan screen, **Then** it shows the split as Fixed 50 %, Leisure 20 % and Savings 30 %

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Income comes from what is recorded): A month's income SHALL be the sum of the income entries recorded in it (see 001). The plan SHALL NOT store an income.
- **FR-002** (Live preview while editing): The system SHALL let the user type a trial income in the plan editor and show, updated on every change and before saving, each part's euro amount and share of that income. The trial income SHALL NOT be stored.
- **FR-003** (Bucket amounts always add up to the income): The system SHALL compute each bucket's euro target rounded to the cent so that, whenever the month's income covers the fixed expenses, the three targets add up exactly to that income.
- **FR-004** (One rule for every month): Every month SHALL keep the plan's fixed expenses; the kept part SHALL be its percentage of that month's income, never above what is left, and the other part SHALL take the rest.
- **FR-005** (Current month overview): The system SHALL show, on the home screen, the selected month, the total spent, and what is left of leisure and savings with their percentages, using the plan that applied to that month and its recorded income. A month with no income SHALL ask for it. When the income is below the fixed expenses it SHALL show the shortfall warning. When no plan exists yet, the home screen SHALL invite the user to create one.
- **FR-006** (On-device persistence): The system SHALL store the plan only on the device, keep it across app restarts, and never send it over the network.
- **FR-007** (Fixed expenses as a list): The system SHALL let the user list the monthly fixed expenses, on their own screen, as items with a name and an amount in EUR. Their total SHALL stay the same in every month, whatever the income. Each month's fixed part SHALL count as spent in full. Removing a filled item SHALL ask for confirmation.
- **FR-008** (Income below fixed expenses): The system SHALL warn the user when a month's recorded income is above zero and lower than the fixed expenses, showing the shortfall in euros, and SHALL set that month's leisure and savings targets to 0 €.
- **FR-009** (Plan changes apply from the current month onwards): The system SHALL keep a history of the plan, including its list of fixed expenses. Saving the plan SHALL make it apply from the current month onwards, and every past month SHALL keep the plan that applied to it. Saving the plan again within the same month SHALL replace that month's version. A month before the first saved plan has no plan.
- **FR-010** (Savings and leisure as a percentage of the income): The system SHALL let the user enter savings or leisure only as a whole percentage of the income, showing its euro amount next to it. Every month SHALL use one rule: the kept part is its percentage of that month's income, never above what is left after the fixed expenses, and the other part takes the rest. Amounts saved in euros by older versions keep working for their months and open at the nearest percentage when an income is known.
- **FR-011** (Last edited of leisure and savings is kept): The system SHALL keep the value of whichever of leisure and savings the user edited last and SHALL fill the other one automatically with what is left of the income after fixed expenses and the kept bucket. Fixed expenses SHALL never be filled in automatically. The automatic part may show a decimal percentage. Changing the fixed expenses SHALL only adjust the automatic bucket; changing the income also changes the euros of the kept bucket, because it is a percentage.
- **FR-012** (A plan that does not fit a trial income): The system SHALL show by how much the plan exceeds a trial income. This SHALL NOT prevent saving the plan.
- **FR-013** (Changes that cannot be saved): The system SHALL validate every change before storing it, and SHALL show a message and keep the form open when a change is rejected or fails.
- **FR-014** (Unreadable data): The system SHALL check the format of the plan data it reads and, when it has the wrong format, SHALL say that some data could not be read instead of showing figures. It SHALL NOT change or delete the data.
- **FR-015** (App updates keep the data): The system SHALL update the on-device database when a new version needs it, keep the existing data, and show a message saying the data is safe if the update cannot be applied.
- **FR-016** (The plan at a glance): The system SHALL show the split between the three buckets with each bucket's share of the total: as a ring on the plan screen, and as one bar while editing the plan and while setting a month's income.
- **FR-018** (See the plan apart from changing it): The system SHALL show the current plan on a read-only screen, with each part's share and amount for this month's income as a ring, or the fixed total and percentage when there is no income yet, and SHALL let the user change the split on a separate screen opened from the end of that screen, and the fixed expenses on another, also opened from there.
- **FR-019** (Unsaved changes): Leaving the plan editor with unsaved changes SHALL ask before discarding them.
- **FR-020** (First setup): With no plan, the user MUST first list the fixed expenses and continue with Next, which saves the plan with savings at 20 %, to the split. Leaving the split at that point keeps that default.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds in the app.
