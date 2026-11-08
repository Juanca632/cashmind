# Feature Specification: App Architecture Foundation

**Feature Branch**: `feat/004-app-architecture`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "Restructure the app so it can keep growing: every write goes through one validation point, everything read is checked for the right format, screens only show data and send actions, and each part of the app lives in its own folder. Validated in the Notion page '6. Architecture proposal'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Invalid data is never saved (Priority: P1)

The user's financial data stays correct because every change is validated at a single point before it is stored, whichever screen or future feature asks for it.

**Why this priority**: The data is the product. A screen bug must not be able to store a wrong amount or change a closed month.

**Independent Test**: Call each write operation directly with invalid input and confirm the stored data did not change and a reason is returned.

**Acceptance Scenarios**:

1. **Given** today is 7 November, **When** an expense with a zero or negative amount is submitted, **Then** nothing is stored and the reason says the amount must be greater than zero
2. **Given** today is 7 November, **When** an expense dated in the future or before the editable period is submitted, **Then** nothing is stored
3. **Given** today is 6 December and an expense dated 30 November exists, **When** it is edited or deleted, **Then** the stored expense does not change
4. **Given** today is 3 December and an expense dated 30 November exists, **When** it is edited with a valid amount or deleted, **Then** the change is stored
5. **Given** an income of 2000,00 € and fixed expenses of 1000,00 €, **When** a plan with savings of 60 % is submitted, **Then** the plan is not stored and the reason says by how much it exceeds the income
6. **When** a month income of zero is submitted, **Then** nothing is stored and the reason says the income must be greater than zero
7. **When** an amount or income above 900 000,00 € is submitted, **Then** nothing is stored and the reason states the limit
8. **Given** valid input, **When** any write is submitted, **Then** it is stored and reported as successful

---

### User Story 2 - A failed change is always explained (Priority: P1)

If a change cannot be saved, the user sees why and stays on the form, on every screen.

**Why this priority**: Today the plan and month income screens fail silently, so the user could believe something was saved when it was not.

**Independent Test**: Make the storage fail while saving from each screen and confirm a message appears and the form stays open.

**Acceptance Scenarios**:

1. **Given** storage fails, **When** the user saves the plan, **Then** a message says the plan could not be saved and the plan form stays open
2. **Given** storage fails, **When** the user saves or removes the month income, **Then** a message says it could not be saved and the form stays open
3. **Given** storage fails, **When** the user adds, edits or deletes an expense, **Then** a message says it could not be saved and the form stays open

---

### User Story 3 - Damaged data is detected, never hidden or altered (Priority: P2)

If stored data ever has the wrong format, the user sees a clear message instead of wrong figures, and the data is left untouched.

**Why this priority**: A wrong total shown as if it were correct is worse than an error. It is less likely than a bad write, so it follows it.

**Independent Test**: Store a row with the wrong format, open the affected screen and confirm the message appears and the row is unchanged.

**Acceptance Scenarios**:

1. **Given** a stored expense whose amount is not a whole number, **When** the user opens that month, **Then** the screen says some data could not be read, instead of showing figures
2. **Given** a stored plan with an unknown unit, **When** the user opens the home, plan, month income or month picker screen, **Then** the screen says some data could not be read
3. **Given** damaged data was detected, **When** the check finishes, **Then** every stored row is unchanged
4. **Given** today is 1 March and a valid expense dated 30 November exists, **When** the user opens November, **Then** the expense is shown, even though that date could no longer be saved today

---

### User Story 4 - The structure protects itself (Priority: P3)

The code is organized by feature, and the agreed boundaries are checked automatically, so new features have a clear place and cannot bypass validation by accident.

**Why this priority**: It has no direct effect on the user today, but it is what lets the app keep growing safely.

**Independent Test**: Add a forbidden dependency and confirm the project's automatic checks reject it.

**Acceptance Scenarios**:

1. **Given** a screen or a shared component, **When** it depends directly on data access, **Then** the automatic checks fail
2. **Given** a data-loading hook, **When** it depends on an operation that writes data, **Then** the automatic checks fail
3. **Given** the expenses or plan feature, **When** it depends on another feature, **Then** the automatic checks fail
4. **Given** the restructured app, **When** every scenario in the baseline specs is run, **Then** all of them pass

---

### Edge Cases

- An expense is edited or deleted after it no longer exists: nothing is stored and the reason says it no longer exists.
- The app is left open across midnight or a month change and the user then saves: validation uses the date at the moment of saving.
- Reading damaged data while validating an edit or delete: nothing is stored and the failure is reported like any failed save.
- Months with no plan, or a plan-less first launch, are not damaged data and keep working as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST perform all six writes (add, edit and delete expense, save plan, set and remove month income) through one validation point per feature.
- **FR-002**: The system MUST NOT store anything when validation rejects a write, and MUST report the reason.
- **FR-003**: Adding an expense MUST require an amount above zero and not above 900 000,00 €, a known category, and a date in an editable month that is not in the future.
- **FR-004**: Editing an expense MUST meet FR-003 and require that the expense's current month is editable. Deleting an expense MUST require that its month is editable.
- **FR-005**: Saving a plan MUST require an income above zero and not above 900 000,00 €, valid fixed and kept amounts, and that the plan fits the income.
- **FR-006**: Setting or removing a month income MUST apply only to the current month, and setting it MUST require an income above zero and not above 900 000,00 €.
- **FR-007**: Every screen MUST handle a rejected or failed write the same way: show a message and keep the form open.
- **FR-008**: The system MUST check the format of everything read from storage: whole numbers for money and percentages, valid dates and months, known categories and units.
- **FR-009**: Reading MUST NOT apply business rules such as the editable period or whether a plan fits the income.
- **FR-010**: When a read finds data with the wrong format, the affected screen MUST show that some data could not be read, and the system MUST NOT change or delete any data.
- **FR-011**: Money conversion and formatting MUST exist in one place only, and MUST NOT use floating point to store or compute amounts.
- **FR-012**: Screens MUST NOT contain data access or validation rules.
- **FR-013**: The code MUST be organized by feature (expenses, plan, home), with shared code and database setup kept apart.
- **FR-014**: Automatic checks MUST reject screens and shared components that access data directly, data-loading hooks that use write operations, and features that depend on each other. Home is the only feature allowed to combine others.
- **FR-015**: The appearance and behavior of the app MUST NOT change other than as described in this spec.
- **FR-016**: The database structure MUST NOT change.

### Key Entities

- **Write result**: The outcome of a write: successful, or not successful with a message for the user.
- **Damaged data**: A stored value whose format does not match what the app expects.

## Out of Scope

Stronger database migrations, APK builds, automatic updates, backup and export, visual redesign, and changes to the database structure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % of the invalid-input scenarios in User Story 1 leave the stored data unchanged.
- **SC-002**: A failed save shows a message on 100 % of the screens that save data.
- **SC-003**: 100 % of the acceptance scenarios in the baseline specs still pass after the restructure.
- **SC-004**: A new feature can be added without changing the code of the existing expenses and plan features.
- **SC-005**: Each forbidden dependency in User Story 4 is rejected by the automatic checks.

## Assumptions

- Only this app writes to the database, so the storage constraints remain as they are today.
- One damaged row makes the whole affected screen show the message, instead of hiding that row and showing partial totals.
- Hooks keep reading directly from data access, because adding a layer that only forwards reads would add complexity without benefit.
- A future import of a backup would go through the same validation as a normal write.
