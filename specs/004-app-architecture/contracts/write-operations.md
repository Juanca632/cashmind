# Contract: Write Operations

Every operation returns a write result and never throws. `today` is the date at the moment of the action.

## `features/expenses/service`

| Operation | Rejected when |
| --- | --- |
| `addExpense(db, input, today)` | Amount not above zero, unknown category, date outside the editable period |
| `editExpense(db, id, input, today)` | Same as add; expense missing; expense's current month not editable |
| `deleteExpense(db, id, today)` | Expense missing; expense's month not editable |

## `features/plan/service`

| Operation | Rejected when |
| --- | --- |
| `savePlan(db, plan, today)` | Invalid income, fixed or kept amount; plan exceeds the income |
| `setMonthIncome(db, incomeCents, today)` | Income not a whole number above zero |
| `removeMonthIncome(db, today)` | Never rejected by rules |

`savePlan`, `setMonthIncome` and `removeMonthIncome` always act on the month of `today`.

## Import boundaries

| Code | May not import |
| --- | --- |
| `src/app` (except `_layout`), screens, components, `shared/ui` | Repositories, `src/db` |
| Hooks | Write functions of repositories, `src/db` |
| `features/expenses`, `features/plan` | Any other feature |
| `src/shared` | Features, `src/db` |
| `src/app`, screens, components, `shared/ui` | Calling query methods on the database |
