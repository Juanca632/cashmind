# Proposal

## Why

Fixed expenses (rent, bills, subscriptions) don't change when the income changes, so expressing them as a percentage of income is wrong: a month with a higher income would wrongly inflate the fixed-expenses target. Only leisure and savings should move with the income.

## What Changes

- **BREAKING** Fixed expenses become an amount in EUR instead of a percentage. The app shows which percentage of the income that amount represents.
- The user sets the **savings percentage of the total income**. Leisure gets the rest of the income after fixed expenses and savings, also shown as a percentage of the income. So fixed % + leisure % + savings % always add up to 100 %.
- In a month with a different income, fixed expenses stay the same and the difference (more or less money) is shared between leisure and savings **keeping the plan's proportion** between them.
- When a month's income doesn't cover the fixed expenses, the app warns the user and leisure and savings are 0 €.
- Existing saved plans are migrated: the old fixed percentage becomes its euro amount on the recurring income, and the old savings percentage is kept.

**Out of scope**

- Listing individual fixed expenses (rent, phone…); it's a single total for now.
- Changing the fixed expenses for a single month.
- Expense tracking and progress against targets (next change).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `income-plan`: the three-percentage split is replaced by a fixed-expenses amount plus a savings percentage of the income; month overrides keep fixed expenses and share the difference between leisure and savings proportionally; new warning when income is below fixed expenses.

## Impact

- `src/domain/income-plan.ts` and its tests (new plan shape and target calculation).
- SQLite schema version 2 with a data migration for the `plan` table.
- Plan editor, home and month income screens.
