# Research: Fixed Expenses List

## Where the items live

**Decision**: A `fixed_item` table with one row per item, keyed by the plan version's `effective_month`.

**Rationale**: Past months must keep their list, and plan versions already give that history. Saving replaces the items of that month, the same rule the version follows.

**Alternatives considered**: A global list with its own history (a second history to keep in step with the plan). JSON in a column (no database checks on money).

## One source for the total

**Decision**: Remove `fixed_unit` and `fixed_value` from `plan_version`. The total is always the sum of the items.

**Rationale**: Two places for one number can disagree. Removing the unit also makes "always euros" (FR-003) impossible to break. SQLite cannot drop a column used in a CHECK, so the table is rebuilt inside the step's transaction; a failure rolls everything back.

**Alternatives considered**: Keep the columns and stop reading them (dead data that still has to be written because it is NOT NULL). Keep them in sync (can drift).

## Converting a percentage

**Decision**: `income_cents * fixed_value / 100` with integer division.

**Rationale**: It rounds down to the cent, exactly like `resolveAmount` today, so every month keeps the same total (SC-003). A plan whose amount is 0 gets no item, because items must be above zero.

## Saving

**Decision**: The version and its items are written in one transaction.

**Rationale**: A failure must never leave a plan with half a list.

## Fixed on the home screen

**Decision**: Selecting Fixed swaps the list below the cards for the plan's items, using the selection added by the redesign. No new route.

**Rationale**: One behavior for all three parts: tap a part, see what is in it.

## Old expenses recorded as fixed

**Decision**: They stay in the month's list and keep Fixed as a third choice only while editing one of them. The Fixed card ignores them.

**Rationale**: FR-010 forbids losing them, and the card must always equal the list. No user-facing rule appears for anyone who has none.

## Savings and wants as percentages

**Decision**: Whole percentages of the total income only. The last one edited is kept and the other shows the rest, as today (002 FR-011). The euro switch is removed for these two fields.

**Rationale**: The developer plans by share of salary and adjusts the two fields by trial and error until everything adds up to 100 %.

**Alternatives considered**: A share of what is left after fixed expenses (makes the two fields add up to 100 % on their own, but does not say how much of the salary each one is; rejected by the developer). Savings always in euros with wants automatic (rejected by the developer).

No stored data changes for this: `kept_unit` stays and new saves always write `pct`, which already means a share of the income. Plans saved in euros keep working for their months.

## One month with a different income

**Decision**: One rule for every month: the kept part is its share of that month's income, capped at what is left, and the other part takes the rest. This replaces "the rest is shared in the plan's proportion" (002 FR-004).

**Rationale**: Approved by the developer in the Notion proposal: 20 % of the salary must mean 20 % in any month.

**Consequence**: Months that already have their own income are recalculated when read. No stored data changes.
