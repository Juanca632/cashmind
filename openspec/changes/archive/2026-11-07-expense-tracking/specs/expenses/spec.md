# Spec Delta

## Purpose

Lets the user record what they spend or save in each bucket and see, for any month, how it compares to that month's targets.

## ADDED Requirements

### Requirement: Record an expense
The system SHALL let the user record an expense with an amount in EUR greater than zero (cent precision), one bucket (fixed expenses, leisure or savings), an optional note and a date. The date SHALL default to today and SHALL be within an editable month and not after today.

#### Scenario: Add a leisure expense
- **WHEN** the user adds 12,50 € to leisure with the note "Cinema" and today's date
- **THEN** the expense appears in this month's list and leisure spending increases by 12,50 €

#### Scenario: Invalid amount
- **WHEN** the user tries to save an expense with an empty, zero or negative amount
- **THEN** the system does not save it and shows that the amount must be greater than zero

### Requirement: Savings entries count towards the savings goal
The system SHALL treat expenses in the savings bucket as money set aside, and SHALL show them as progress towards the month's savings target.

#### Scenario: Saving after payday
- **GIVEN** a savings target of 900,00 €
- **WHEN** the user records 600,00 € in savings
- **THEN** the savings progress shows 600,00 € of 900,00 € and 300,00 € left to save

### Requirement: Edit and delete an expense
The system SHALL let the user change any field of an expense or delete it, as long as both its current date and its new date are in an editable month.

#### Scenario: Correct an amount
- **WHEN** the user changes an expense from 12,50 € to 15,00 €
- **THEN** the list and the bucket's spending reflect 15,00 €

#### Scenario: Delete an expense
- **WHEN** the user deletes an expense
- **THEN** it disappears from the list and no longer counts towards its bucket

### Requirement: Editable period for expenses
The system SHALL allow expense changes in the current month, and in the previous month only during days 1 to 5 of the current month. Expenses of any other past month SHALL be read-only.

#### Scenario: Forgotten expense at the start of the month
- **GIVEN** today is 3 December
- **WHEN** the user adds an expense dated 30 November
- **THEN** it is saved and counts towards November

#### Scenario: Grace period over
- **GIVEN** today is 6 December
- **WHEN** the user views November
- **THEN** November's expenses cannot be added, edited or deleted

### Requirement: Month progress against targets
The system SHALL show, for the selected month and each bucket, the amount recorded and the target. For fixed expenses and leisure it SHALL show what is left, or a warning with the excess when the recorded amount is above the target. For savings it SHALL show what is left to reach the goal, or that the goal is reached.

#### Scenario: Leisure over its limit
- **GIVEN** a leisure target of 400,00 €
- **WHEN** leisure expenses add up to 450,00 €
- **THEN** leisure shows a warning that it is 50,00 € over

#### Scenario: Within the limit
- **GIVEN** a fixed-expenses target of 1000,00 €
- **WHEN** fixed expenses add up to 700,00 €
- **THEN** fixed expenses shows 300,00 € left

### Requirement: Month expense list
The system SHALL list the selected month's expenses, newest date first, showing date, bucket, note and amount.

#### Scenario: Viewing a past month
- **WHEN** the user picks a past month with expenses
- **THEN** the list shows that month's expenses and its progress per bucket
