# Spec Delta

## MODIFIED Requirements

### Requirement: Past months are read-only
The system SHALL show past months without any option to edit the plan or the month's income, and SHALL offer a way to go back to the current month. Expense changes in past months follow the expenses editable period: only the previous month during the first 5 days of the current month.

#### Scenario: Viewing a past month
- **WHEN** the user is viewing September 2026 and the current month is November 2026
- **THEN** no edit actions are shown
- **AND** a "back to current month" action returns the home screen to November 2026

#### Scenario: Previous month during the first days
- **GIVEN** today is 2 December 2026
- **WHEN** the user views November 2026
- **THEN** the plan and income cannot be edited, but expenses can be added, edited or deleted
