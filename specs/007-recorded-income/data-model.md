# Data Model: Recorded Income

## `expense` (changed)

`bucket` allows `income` as well as `fixed`, `leisure` and `savings`. All other columns and rows are unchanged.

## `plan_version` (changed)

Loses `income_cents`. Columns: `effective_month`, `kept_bucket`, `kept_unit`, `kept_value`.

## `month_income_override` (removed)

Its values become income entries.

## `fixed_item`

Unchanged.

## Domain

```text
month income = sum of the month's entries with bucket 'income'
IncomePlan   = { fixedItems, kept, keptAmount }
targets      = targetsFor(plan, month income)
```

## Migration step 3

In one transaction:

1. Read every plan version and override.
2. Rebuild `expense` with the new CHECK, copying every row including `id` and `created_at`.
3. For each month from the first plan to the current month, insert one income on day 1: the month's override, otherwise the income of the latest version not after that month. Note: `Monthly income`.
4. Rebuild `plan_version` without `income_cents`.
5. Drop `month_income_override`.
