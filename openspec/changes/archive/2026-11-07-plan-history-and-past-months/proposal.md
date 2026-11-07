# Proposal

## Why

The plan changes over time (a raise, a new rent), but today there is a single plan that silently rewrites every month, including past ones. The user also wants to look back at previous months. Both need the app to remember which plan applied to each month.

## What Changes

- **Plan history:** saving the plan creates a version that applies **from the current month onwards**. Past months keep the plan they had. Saving again in the same month replaces that month's version.
- **Month picker:** the user can open a calendar with a year selector and a 12-month grid, pick a past month and see that month's income and targets. Future months cannot be selected.
- **Past months are read-only:** their plan and income cannot be edited. Only the current month allows editing the plan and setting a one-month income.
- The month income override is limited to the current month.
- Existing data is migrated: the current plan becomes the first version, applying from the earliest month with data.

**Out of scope**

- Recording expenses and showing how a month went against its targets (next change; the month view will then show it).
- Future months, editing past months, deleting plan versions, a list of plan changes.

## Capabilities

### New Capabilities

- `month-browsing`: picking a month from a year/month calendar and viewing it, limited to the current and past months, with past months read-only.

### Modified Capabilities

- `income-plan`: the recurring plan becomes versioned by the month it takes effect; month overrides are limited to the current month; the home overview shows the selected month instead of always the current one.

## Impact

- Domain: plan lookup by month; month arithmetic helpers.
- SQLite schema version 3: `plan` table becomes `plan_version` keyed by effective month, with a data migration.
- Home screen gains a month header that opens the picker; new month picker screen; plan editor states from which month the change applies.
