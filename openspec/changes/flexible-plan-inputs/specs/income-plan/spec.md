# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Live euro preview while editing
The system SHALL show, while the user edits the income or any bucket, the euro amount and percentage of income of each bucket, including the automatic one, updated on every change and before saving.

#### Scenario: Preview updates on change
- **GIVEN** an income of 2000,00 € and fixed expenses of 1000,00 €
- **WHEN** the user changes savings from 10 % to 25 %
- **THEN** savings changes from 200,00 € to 500,00 € and leisure from 800,00 € (40 %) to 500,00 € (25 %) without saving

### Requirement: Current month overview
The system SHALL show, on the home screen, the selected month (the current month by default), its income (marking whether it is an override) and, for each bucket, its euro target, using the plan that applied to that month. When the income is below the fixed expenses it SHALL show the shortfall warning. When no plan exists yet, the home screen SHALL invite the user to create one.

#### Scenario: First launch
- **WHEN** the user opens the app without a saved plan
- **THEN** the home screen shows a prompt to set up the monthly plan instead of targets

#### Scenario: Plan exists
- **WHEN** the user opens the app with a saved plan
- **THEN** the home screen shows the current month's income and the three bucket targets

## REMOVED Requirements

### Requirement: Savings and leisure as a share of the income
**Reason**: Leisure and savings can now each be entered in EUR or percent, and either one can be the automatic bucket.
**Migration**: Saved plans keep savings as the entered percentage and leisure as the automatic bucket.
