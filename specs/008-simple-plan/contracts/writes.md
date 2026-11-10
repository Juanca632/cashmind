# Contract: Writes

## `addExpense`, `editExpense`, `deleteExpense`

Accept `bucket` in `income`, `savings`, `expense`, with the same validation for all. No bucket is restricted any more.

## `savePlan(db, savingsPercent, today)`

Saves a whole percentage from 0 to 100 as the version for the current month, replacing that month's version. Rejects anything else with "The savings goal must be a whole percentage from 0 to 100."

## Removed

Fixed items and the kept bucket in `savePlan`.
