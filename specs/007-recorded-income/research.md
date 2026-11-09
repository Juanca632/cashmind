# Research: Recorded Income

## Where income is stored

**Decision**: In the `expense` table, with a new `bucket` value `income`.

**Rationale**: An income has exactly the same fields as an expense. Reusing the record reuses the list, form, validation and confirmation, which is what the developer asked for: flexibility without more architecture.

**Alternatives considered**: A separate `income` table and feature (duplicates all of that code).

## Migration needs today's date

**Decision**: Step 3 is written in TypeScript inside the migration, self-contained, and reads the clock once.

**Rationale**: It must create one entry per month up to the current month. It imports no app code, so later changes cannot alter a released step.

## Entry date for migrated incomes

**Decision**: The first day of each month, with the note "Monthly income".

**Rationale**: It is always within the month and never in the future.

## The plan's income

**Decision**: Remove `income_cents` from `plan_version`, and drop `month_income_override`.

**Rationale**: Income has one source. Keeping the columns would leave two places for one number.

## Trial income

**Decision**: Local state in the editor, excluded from the unsaved-changes check, starting with this month's income passed as a route parameter.

**Rationale**: It is never stored, so leaving with only a trial income loses nothing.

## Repeat last income

**Decision**: One entry with the total of the most recent earlier month that has income, dated by the existing default date rule.

**Rationale**: One tap covers the usual case with no recurring schedule.
