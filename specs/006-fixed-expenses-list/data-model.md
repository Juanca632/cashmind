# Data Model: Fixed Expenses List

## `fixed_item` (new)

| Column | Type | Rules |
| --- | --- | --- |
| `id` | INTEGER | Primary key, autoincrement. Also the display order: items are inserted in the order the user sees them. |
| `effective_month` | TEXT | `YYYY-MM`. The plan version it belongs to. |
| `name` | TEXT | 1 to 40 characters |
| `amount_cents` | INTEGER | Above 0 |

The table is `STRICT`. A version can have no items, meaning a fixed total of 0 €.

## `plan_version` (changed)

Loses `fixed_unit` and `fixed_value`. The other columns are unchanged:
`effective_month`, `income_cents`, `kept_bucket`, `kept_unit`, `kept_value`.

## `expense` and `month_income_override`

Unchanged. Rows with `bucket = 'fixed'` are kept.

## Savings and wants

`kept_unit` and `kept_value` are unchanged in the database. New saves always write `pct` (a whole share of the income); rows saved as `eur` keep working for their months.

## Domain

```text
FixedItem  = { name, amountCents }
IncomePlan = { incomeCents, fixedItems: FixedItem[], kept, keptAmount }
fixed total = sum of fixedItems[].amountCents
```

Validation on save:

| Case | Result |
| --- | --- |
| Item with an empty or too long name after trimming | `item-invalid` |
| Item amount not above 0, or too large | `item-invalid` |
| Fixed total above the income | `fixed-over-income`, shown with the excess |
| Fixed total plus the kept amount above the income | `over-income`, shown with the excess |

Values read from the database are checked for format only: an item with the wrong format makes the screen report unreadable data.

## Migration step 2

In one transaction, in this order:

1. Create `fixed_item`.
2. For each `plan_version`, compute the euro amount (`fixed_value`, or `income_cents * fixed_value / 100` for a percentage). If it is above 0, insert one item named `Fixed expenses`.
3. Rebuild `plan_version` without the fixed columns, copying every row.
