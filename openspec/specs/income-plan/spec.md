# income-plan Specification

## Purpose
Lets the user define how their monthly income is split between fixed expenses, leisure and savings, and gives the euro target for each bucket in any month.

## Requirements

### Requirement: Recurring monthly income
The system SHALL let the user set a recurring monthly income in EUR, with cent precision, that applies to every month without an override from the month the plan is saved until the plan is changed. The income MUST be greater than zero.

#### Scenario: Set recurring income
- **WHEN** the user enters 2500,00 € as their monthly income and saves
- **THEN** the current month and following months without an override use 2500,00 € as their income

#### Scenario: Reject invalid income
- **WHEN** the user enters an empty value, zero or a negative amount
- **THEN** the system does not save the plan and shows that the income must be greater than zero

### Requirement: Live euro preview while editing
The system SHALL show, while the user edits the income or any bucket, the euro amount and percentage of income of each bucket, including the automatic one, updated on every change and before saving.

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
The system SHALL show, on the home screen, the selected month (the current month by default), its income (marking whether it is an override) and, for each bucket, its euro target, using the plan that applied to that month. When the income is below the fixed expenses it SHALL show the shortfall warning. When no plan exists yet, the home screen SHALL invite the user to create one.

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

### Requirement: Fixed expenses as an amount
The system SHALL let the user set the monthly fixed expenses in EUR or as a percentage of the recurring income. The resulting amount SHALL stay the same in every month, including months with a different income. The amount MUST be zero or more and MUST NOT exceed the recurring income. The system SHALL show the value in the other unit.

#### Scenario: Fixed expenses shown as a share of income
- **GIVEN** a recurring income of 2000,00 €
- **WHEN** the user sets fixed expenses to 1000,00 €
- **THEN** the system shows that fixed expenses are 50 % of the income

#### Scenario: Fixed expenses above income
- **GIVEN** a recurring income of 2000,00 €
- **WHEN** the user sets fixed expenses to 2100,00 €
- **THEN** the system does not save the plan and shows that fixed expenses cannot exceed the income

### Requirement: Income below fixed expenses
The system SHALL warn the user when a month's income is lower than the fixed expenses, showing the shortfall in euros, and SHALL set that month's leisure and savings targets to 0 €.

#### Scenario: Month that doesn't cover fixed expenses
- **GIVEN** fixed expenses of 1000,00 €
- **WHEN** this month's income is set to 800,00 €
- **THEN** the system warns that the income is 200,00 € short of the fixed expenses
- **AND** leisure and savings targets are 0,00 €

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

### Requirement: Buckets in euros or percent
The system SHALL let the user enter each entered bucket either as an amount in EUR (cent precision) or as a whole-number percentage of the recurring income, switching per field, and SHALL show the value in the other unit next to it. A bucket entered as a percentage SHALL keep its percentage when the recurring income is edited, and one entered in EUR SHALL keep its amount.

#### Scenario: Savings as a percentage
- **GIVEN** a recurring income of 2000,00 €
- **WHEN** the user enters savings as 30 %
- **THEN** the editor shows 600,00 € next to it

#### Scenario: Income edited with a percentage bucket
- **GIVEN** savings entered as 30 % and leisure filled in automatically
- **WHEN** the user changes the income from 2000,00 € to 2500,00 €
- **THEN** savings becomes 750,00 € and leisure is recomputed

### Requirement: Last edited of leisure and savings is kept
The system SHALL keep the value of whichever of leisure and savings the user edited last and SHALL fill the other one automatically with what is left of the income after fixed expenses and the kept bucket. Fixed expenses SHALL never be filled in automatically. Changing the income or fixed expenses SHALL only adjust the automatic bucket.

#### Scenario: Two fields filled, third automatic
- **GIVEN** an income of 2000,00 €
- **WHEN** the user sets fixed expenses to 1000,00 € and savings to 30 %
- **THEN** leisure is filled in automatically with 400,00 €

#### Scenario: Switching which bucket is kept
- **GIVEN** fixed 1000,00 €, savings 30 % and leisure automatic on 2000,00 €
- **WHEN** the user sets leisure to 500,00 €
- **THEN** savings is filled in automatically with 500,00 €

### Requirement: Plan must fit in the income
The system SHALL NOT save a plan where fixed expenses plus the kept bucket exceed the recurring income, and SHALL show by how much it exceeds.

#### Scenario: Kept bucket too high
- **GIVEN** an income of 2000,00 € and fixed expenses of 1000,00 €
- **WHEN** the user sets savings to 60 %
- **THEN** the system does not save the plan and shows that it is 200,00 € over the income
