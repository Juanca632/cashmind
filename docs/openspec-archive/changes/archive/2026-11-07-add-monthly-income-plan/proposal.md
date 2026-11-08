# Proposal

## Why

The developer wants a simple way to decide, every month, how their income is split between fixed expenses, leisure and savings, and to see that split in euros before committing to it. This is the foundation of cashmind: every later feature (expense tracking, monthly metrics) measures progress against this plan.

## What Changes

- The user can set a **monthly income** in EUR that repeats every month by default.
- The user can split that income into three buckets — **fixed expenses**, **leisure** and **savings** — by choosing a percentage for each. The percentages are fully user-defined and must add up to 100%.
- While editing, the app shows the amount in euros for each bucket, so the user can judge whether the split works for them before saving.
- The user can **override the income for a single month** (e.g. a month with a bonus or less work). The month's bucket amounts are recalculated from that income with the same percentages, without changing the recurring income.
- The home screen shows the current month's plan: income and the euro target for each bucket.
- The plan is stored only on the device and survives app restarts.
- The Expo template's demo screens are removed.

**Out of scope**

- Recording expenses, automatic capture from bank notifications, and progress metrics against the targets (later changes).
- Custom or additional buckets beyond the three fixed ones.
- Different percentages per month (only the income can be overridden per month).
- Multiple income sources, history browsing of past months, currencies other than EUR, iOS, cloud sync or backup.

## Capabilities

### New Capabilities

- `income-plan`: the user's recurring monthly income, its split into fixed expenses / leisure / savings by percentage, per-month income overrides, and the resulting euro targets for a given month.

### Modified Capabilities

None.

## Impact

- New screens under `src/app/` (current month overview and plan editor); template demo screens and components removed.
- New local persistence for the plan (see design.md for the storage choice — adds one Expo dependency).
- Adds a unit test setup for the money calculation logic.
