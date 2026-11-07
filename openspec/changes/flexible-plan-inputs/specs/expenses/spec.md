# Spec Delta

## MODIFIED Requirements

### Requirement: Month progress against targets
The system SHALL show, for the selected month and each bucket, the amount recorded, the target and the progress as a percentage of the target. For fixed expenses and leisure it SHALL show what is left, or a warning with the excess when the recorded amount is above the target. For savings it SHALL show what is left to reach the goal, or that the goal is reached.

#### Scenario: Leisure over its limit
- **GIVEN** a leisure target of 400,00 €
- **WHEN** leisure expenses add up to 450,00 €
- **THEN** leisure shows a warning that it is 50,00 € over

#### Scenario: Within the limit
- **GIVEN** a fixed-expenses target of 1000,00 €
- **WHEN** fixed expenses add up to 700,00 €
- **THEN** fixed expenses shows 300,00 € left

#### Scenario: Progress percentage
- **GIVEN** a savings target of 900,00 € and a leisure target of 400,00 €
- **WHEN** 630,00 € are saved and 200,00 € of leisure are spent
- **THEN** savings shows 70 % saved and leisure shows 50 % spent
