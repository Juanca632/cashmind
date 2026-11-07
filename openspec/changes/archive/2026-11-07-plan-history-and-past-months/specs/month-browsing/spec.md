# Spec Delta

## Purpose

Lets the user pick any past or current month from a calendar and see how that month was planned, without being able to change the past.

## ADDED Requirements

### Requirement: Month picker
The system SHALL let the user open a month picker from the home screen showing a year with buttons to go to the previous and next year, and the twelve months of that year. Selecting a month SHALL show that month on the home screen. The current month SHALL be highlighted.

#### Scenario: Pick a past month
- **GIVEN** it is November 2026 and a plan exists since July 2026
- **WHEN** the user opens the picker and selects September 2026
- **THEN** the home screen shows September 2026 with the plan that applied in September

### Requirement: No future months
The system SHALL NOT let the user select a month after the current month, and SHALL NOT let the user go to a year after the current year.

#### Scenario: Future months disabled
- **GIVEN** it is November 2026
- **WHEN** the user opens the picker on 2026
- **THEN** December 2026 cannot be selected and the next-year button is disabled

### Requirement: Months without a plan
The system SHALL let the user go back to the year of the first saved plan and no earlier. A month before the first saved plan SHALL show that there was no plan for that month.

#### Scenario: Month before the first plan
- **GIVEN** the first plan applies from July 2026
- **WHEN** the user selects March 2026
- **THEN** the home screen shows that there was no plan in March 2026

### Requirement: Past months are read-only
The system SHALL show past months without any option to edit the plan or the month's income, and SHALL offer a way to go back to the current month.

#### Scenario: Viewing a past month
- **WHEN** the user is viewing September 2026 and the current month is November 2026
- **THEN** no edit actions are shown
- **AND** a "back to current month" action returns the home screen to November 2026
