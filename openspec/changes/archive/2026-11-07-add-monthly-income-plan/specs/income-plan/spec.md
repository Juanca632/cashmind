# Spec Delta

## Purpose

Lets the user define how their monthly income is split between fixed expenses, leisure and savings, and gives the euro target for each bucket in any month.

## ADDED Requirements

### Requirement: Recurring monthly income
The system SHALL let the user set a recurring monthly income in EUR, with cent precision, that applies to every month that has no override. The income MUST be greater than zero.

#### Scenario: Set recurring income
- **WHEN** the user enters 2500,00 € as their monthly income and saves
- **THEN** every month without an override uses 2500,00 € as its income

#### Scenario: Reject invalid income
- **WHEN** the user enters an empty value, zero or a negative amount
- **THEN** the system does not save the plan and shows that the income must be greater than zero

### Requirement: Percentage split into three buckets
The system SHALL let the user assign a whole-number percentage (0–100) to each of the three buckets: fixed expenses, leisure and savings. The plan SHALL only be saved when the three percentages add up to exactly 100.

#### Scenario: Valid split
- **WHEN** the user sets fixed expenses 50 %, leisure 30 % and savings 20 % and saves
- **THEN** the plan is saved with those percentages

#### Scenario: Split does not add up to 100
- **WHEN** the percentages add up to 90 or 110
- **THEN** the system does not save the plan and shows how far the total is from 100 %

### Requirement: Live euro preview while editing
The system SHALL show, while the user edits the income or any percentage, the euro amount of each bucket and the percentage total, updated on every change and before saving.

#### Scenario: Preview updates on change
- **GIVEN** an income of 2000,00 €
- **WHEN** the user changes savings from 10 % to 25 %
- **THEN** the savings amount shown changes from 200,00 € to 500,00 € without saving

### Requirement: Bucket amounts always add up to the income
The system SHALL compute each bucket's euro target from the month's income and its percentage, rounded to the cent, so that the three targets always add up exactly to the income.

#### Scenario: Rounding remainder
- **GIVEN** an income of 1000,01 € split 50 / 30 / 20
- **WHEN** the targets are computed
- **THEN** the three targets add up to exactly 1000,01 €

### Requirement: Per-month income override
The system SHALL let the user set a different income for a specific month. That month's targets SHALL use the override with the plan's percentages, while other months keep using the recurring income. The user SHALL be able to remove the override to return that month to the recurring income.

#### Scenario: Month with a different income
- **GIVEN** a recurring income of 2500,00 € split 50 / 30 / 20
- **WHEN** the user sets this month's income to 3000,00 €
- **THEN** this month's targets are 1500,00 € fixed, 900,00 € leisure and 600,00 € savings
- **AND** next month still uses 2500,00 €

#### Scenario: Remove the override
- **WHEN** the user removes this month's override
- **THEN** this month's targets are computed from the recurring income again

### Requirement: Current month overview
The system SHALL show, on the home screen, the current month, its income (marking whether it is an override) and the euro target for each bucket with its percentage. When no plan exists yet, the home screen SHALL invite the user to create one.

#### Scenario: First launch
- **WHEN** the user opens the app without a saved plan
- **THEN** the home screen shows a prompt to set up the monthly plan instead of targets

#### Scenario: Plan exists
- **WHEN** the user opens the app with a saved plan
- **THEN** the home screen shows the current month's income and the three bucket targets

### Requirement: On-device persistence
The system SHALL store the plan and month overrides only on the device, keep them across app restarts, and never send them over the network.

#### Scenario: Restart keeps the plan
- **WHEN** the user saves a plan, closes the app and opens it again
- **THEN** the same plan and overrides are shown
