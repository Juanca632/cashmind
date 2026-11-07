# Proposal

## Why

The plan says how much should go to fixed expenses, leisure and savings, but the app can't yet tell whether the month is on track. Recording expenses (manually for now) lets every month show what was spent or saved against each target, including past months.

## What Changes

- The user can **record an expense**: amount in EUR, bucket (fixed expenses, leisure or savings), optional note and date (today by default).
- **Savings entries** represent money moved to savings (typically right after payday); they count towards the savings goal.
- The user can **edit or delete** an expense.
- The home screen shows, per bucket, **progress against the month's target**: spent vs. limit for fixed expenses and leisure (with a warning when over), and saved vs. goal for savings. It also lists the month's expenses, newest first.
- **Editable period:** expenses can be added, edited or deleted in the current month, and also in the previous month during the first 5 days of the current month. Any other past month stays read-only.

**Out of scope**

- Automatic capture from bank notifications, CSV import.
- Sub-categories, recurring expenses, income entries, search or filters.
- Editing the plan or income of past months (unchanged: still read-only).

## Capabilities

### New Capabilities

- `expenses`: recording, editing and deleting expenses per bucket, the editable period, and each month's progress against its targets.

### Modified Capabilities

- `month-browsing`: past months stay read-only for the plan and income, but the previous month accepts expense changes during the first 5 days of the current month.

## Impact

- Domain: expense validation, totals per bucket, progress, editable-month rule.
- SQLite schema version 4: new `expense` table.
- Home screen (progress and expense list), new add/edit expense screen.
