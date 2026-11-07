# Spec Delta

## ADDED Requirements

### Requirement: Plan changes apply from the current month onwards
The system SHALL keep a history of the plan. Saving the plan SHALL make it apply from the current month onwards, and every past month SHALL keep the plan that applied to it. Saving the plan again within the same month SHALL replace that month's version. A month before the first saved plan has no plan.

#### Scenario: Changing the plan in a later month
- **GIVEN** a plan of 2000,00 € saved in July
- **WHEN** the user changes the income to 2400,00 € in December
- **THEN** December and the following months use 2400,00 €
- **AND** July to November still use 2000,00 €

#### Scenario: Saving twice in the same month
- **GIVEN** a plan saved earlier this month
- **WHEN** the user saves a different plan this month
- **THEN** this month uses the latest plan and no past month changes

## MODIFIED Requirements

### Requirement: Recurring monthly income
The system SHALL let the user set a recurring monthly income in EUR, with cent precision, that applies to every month without an override from the month the plan is saved until the plan is changed. The income MUST be greater than zero.

#### Scenario: Set recurring income
- **WHEN** the user enters 2500,00 € as their monthly income and saves
- **THEN** the current month and following months without an override use 2500,00 € as their income

#### Scenario: Reject invalid income
- **WHEN** the user enters an empty value, zero or a negative amount
- **THEN** the system does not save the plan and shows that the income must be greater than zero

### Requirement: Per-month income override
The system SHALL let the user set a different income for the current month. That month SHALL keep the plan's fixed expenses, and the money left after them SHALL be shared between leisure and savings in the same proportion as in the plan. Other months keep using the recurring income. The user SHALL be able to remove the override to return that month to the recurring income. Overrides of past months are kept and shown but cannot be changed.

#### Scenario: Month with a different income
- **GIVEN** a recurring income of 2000,00 €, fixed expenses of 1000,00 € and savings 30 % (leisure 20 %)
- **WHEN** the user sets this month's income to 2500,00 €
- **THEN** this month's targets are 1000,00 € fixed (40 %), 600,00 € leisure (24 %) and 900,00 € savings (36 %)
- **AND** next month still uses 2000,00 €

#### Scenario: Remove the override
- **WHEN** the user removes this month's override
- **THEN** this month's targets are computed from the recurring income again

### Requirement: Current month overview
The system SHALL show, on the home screen, the selected month (the current month by default), its income (marking whether it is an override) and, for each bucket, its euro target and its percentage of that month's income, using the plan that applied to that month. When the income is below the fixed expenses it SHALL show the shortfall warning. When no plan exists yet, the home screen SHALL invite the user to create one.

#### Scenario: First launch
- **WHEN** the user opens the app without a saved plan
- **THEN** the home screen shows a prompt to set up the monthly plan instead of targets

#### Scenario: Plan exists
- **WHEN** the user opens the app with a saved plan
- **THEN** the home screen shows the current month's income and the three bucket targets with their percentages
