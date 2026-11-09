# Contract: Writes

## `addExpense`, `editExpense`, `deleteExpense`

Accept `bucket = 'income'` with the same validation as any entry. `fixed` stays restricted as before.

## `savePlan(db, plan, today)`

`plan` has no income. Rejects only an invalid item or share; an income is never required.

## Removed

`setMonthIncome`, `removeMonthIncome`.
