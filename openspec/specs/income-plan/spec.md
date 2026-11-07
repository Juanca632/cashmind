# income-plan Specification

## Purpose
Lets the user define how their monthly income is split between fixed expenses, leisure and savings, and gives the euro target for each bucket in any month.

## Requirements

### Requirement: Recurring monthly income
The system SHALL let the user set a recurring monthly income in EUR, with cent precision, that applies to every month that has no override. The income MUST be greater than zero.

#### Scenario: Set recurring income
- **WHEN** the user enters 2500,00 € as their monthly income and saves
- **THEN** every month without an override uses 2500,00 € as its income

#### Scenario: Reject invalid income
- **WHEN** the user enters an empty value, zero or a negative amount
- **THEN** the system does not save the plan and shows that the income must be greater than zero

### Requirement: Live euro preview while editing
The system SHALL show, while the user edits the income, the fixed expenses or the savings percentage, the euro amount and percentage of income of each bucket, updated on every change and before saving.

#### Scenario: Preview updates on change
- **GIVEN** an income of 2000,00 € and fixed expenses of 1000,00 €
- **WHEN** the user changes savings from 10 % to 25 %
- **THEN** savings changes from 200,00 € to 500,00 € and leisure from 800,00 € (40 %) to 500,00 € (25 %) without saving

### Requirement: Bucket amounts always add up to the income
The system SHALL compute each bucket's euro target rounded to the cent so that, whenever the month's income covers the fixed expenses, the three targets add up exactly to that income.

#### Scenario: Rounding remainder
- **GIVEN** an income of 1000,01 €, fixed expenses of 500,00 € and savings 20 %
- **WHEN** the targets are computed
- **THEN** the three targets add up to exactly 1000,01 €

### Requirement: Per-month income override
The system SHALL let the user set a different income for a specific month. That month SHALL keep the plan's fixed expenses, and the money left after them SHALL be shared between leisure and savings in the same proportion as in the plan. Other months keep using the recurring income. The user SHALL be able to remove the override to return that month to the recurring income.

#### Scenario: Month with a different income
- **GIVEN** a recurring income of 2000,00 €, fixed expenses of 1000,00 € and savings 30 % (leisure 20 %)
- **WHEN** the user sets this month's income to 2500,00 €
- **THEN** this month's targets are 1000,00 € fixed (40 %), 600,00 € leisure (24 %) and 900,00 € savings (36 %)
- **AND** next month still uses 2000,00 €

#### Scenario: Remove the override
- **WHEN** the user removes this month's override
- **THEN** this month's targets are computed from the recurring income again

### Requirement: Current month overview
The system SHALL show, on the home screen, the current month, its income (marking whether it is an override) and, for each bucket, its euro target and its percentage of that month's income. When the income is below the fixed expenses it SHALL show the shortfall warning. When no plan exists yet, the home screen SHALL invite the user to create one.

#### Scenario: First launch
- **WHEN** the user opens the app without a saved plan
- **THEN** the home screen shows a prompt to set up the monthly plan instead of targets

#### Scenario: Plan exists
- **WHEN** the user opens the app with a saved plan
- **THEN** the home screen shows the current month's income and the three bucket targets with their percentages

### Requirement: On-device persistence
The system SHALL store the plan and month overrides only on the device, keep them across app restarts, and never send them over the network.

#### Scenario: Restart keeps the plan
- **WHEN** the user saves a plan, closes the app and opens it again
- **THEN** the same plan and overrides are shown

### Requirement: Fixed expenses as an amount
The system SHALL let the user set the monthly fixed expenses as an amount in EUR, with cent precision, that stays the same in every month. The amount MUST be zero or more and MUST NOT exceed the recurring income. The system SHALL show which percentage of the income that amount represents.

#### Scenario: Fixed expenses shown as a share of income
- **GIVEN** a recurring income of 2000,00 €
- **WHEN** the user sets fixed expenses to 1000,00 €
- **THEN** the system shows that fixed expenses are 50 % of the income

#### Scenario: Fixed expenses above income
- **GIVEN** a recurring income of 2000,00 €
- **WHEN** the user sets fixed expenses to 2100,00 €
- **THEN** the system does not save the plan and shows that fixed expenses cannot exceed the income

### Requirement: Savings and leisure as a share of the income
The system SHALL let the user set savings as a whole-number percentage of the recurring income. Leisure SHALL get the rest of the income after fixed expenses and savings, shown as a percentage of the income, so the three percentages add up to 100 %. The savings percentage MUST NOT exceed the share left after fixed expenses.

#### Scenario: Valid split
- **GIVEN** a recurring income of 2000,00 € and fixed expenses of 1000,00 € (50 %)
- **WHEN** the user sets savings to 30 %
- **THEN** savings is 600,00 € (30 %) and leisure is 400,00 € (20 %)

#### Scenario: Savings above what is left
- **GIVEN** a recurring income of 2000,00 € and fixed expenses of 1000,00 € (50 %)
- **WHEN** the user sets savings to 60 %
- **THEN** the system does not save the plan and shows that at most 50 % is left for savings

### Requirement: Income below fixed expenses
The system SHALL warn the user when a month's income is lower than the fixed expenses, showing the shortfall in euros, and SHALL set that month's leisure and savings targets to 0 €.

#### Scenario: Month that doesn't cover fixed expenses
- **GIVEN** fixed expenses of 1000,00 €
- **WHEN** this month's income is set to 800,00 €
- **THEN** the system warns that the income is 200,00 € short of the fixed expenses
- **AND** leisure and savings targets are 0,00 €
