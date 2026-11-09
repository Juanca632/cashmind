# Contract: Plan and Expense Writes

All writes keep going through the feature services and return a `WriteResult`.

## `savePlan(db, plan, today)`

- `plan.fixedItems` replaces the old `plan.fixed`.
- `plan.keptAmount` is always a whole percentage of the income.
- Rejects with a message on any validation error in [data-model.md](../data-model.md); nothing is stored.
- On success, in one transaction: upserts the version for the current month, deletes that month's items and inserts the new ones in list order.
- A storage failure stores nothing and returns the existing "could not be saved" message.

## `getPlanVersions(db)`

Returns each version with its `fixedItems` in `id` order. A row with the wrong format raises `DataFormatError` naming only the field.

## `addExpense(db, input, now)`

Rejects `bucket = 'fixed'`.

## `editExpense(db, id, input, now)`

Accepts `bucket = 'fixed'` only when the stored expense is already fixed.

## Unchanged

`setMonthIncome`, `removeMonthIncome`, `deleteExpense`.
