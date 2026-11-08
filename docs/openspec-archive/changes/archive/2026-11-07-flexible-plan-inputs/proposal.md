# Proposal

## Why

Setting up the plan forces fixed expenses in euros and savings in percent, but people think about each bucket differently (rent in euros, savings as "30 %", leisure as "400 € a month"). The home screen also repeats each bucket's share of the salary, which the user already knows from the plan, instead of showing how far along the month is.

## What Changes

- In the plan editor, **each bucket (fixed expenses, leisure, savings) can be entered in EUR or as a percentage of the income**, with a toggle per field. The other unit is shown next to it.
- **Fixed expenses are always entered by the user.** Of leisure and savings, **the one edited last is kept and the other is filled in automatically** with what is left. Changing fixed expenses or the income adjusts the automatic one.
- A bucket entered as a percentage keeps its percentage when the recurring income is edited; one entered in euros keeps its amount.
- The editor blocks saving when the entered amounts don't fit in the income.
- **Unchanged:** in a month with a different income, fixed expenses stay the same and the difference is shared between leisure and savings in the plan's proportion.
- **Home:** each bucket shows its **progress percentage** ("70 % saved", "50 % spent") instead of its share of the income.
- Existing plans are migrated: fixed expenses in euros, savings in percent, leisure automatic.

**Out of scope**

- Decimal percentages, letting fixed expenses be the automatic bucket, more buckets.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `income-plan`: buckets can be entered in EUR or percent; leisure/savings "last edited wins, the other completes"; the overview no longer shows each bucket's share of the income.
- `expenses`: month progress shows a progress percentage per bucket.

## Impact

- Domain: new plan shape (per-bucket unit and value, which of leisure/savings is automatic) and resolution to euro targets; tests.
- SQLite schema version 5 with a data migration of `plan_version`.
- Plan editor (unit toggles, auto-complete), `BucketRows` on home and month income screen.
