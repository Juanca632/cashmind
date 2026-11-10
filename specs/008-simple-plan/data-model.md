# Data Model: Simple Plan

## Step 4 (new)

### `expense` (rebuilt)

| Column | Change |
| --- | --- |
| `bucket` | `CHECK (bucket IN ('expense', 'savings', 'income'))`. `fixed` and `leisure` rows become `expense`. |

Other columns, ids and `created_at` are copied unchanged.

### `plan_version` (rebuilt)

| Column | Type | Rule |
| --- | --- | --- |
| `effective_month` | TEXT PK | `YYYY-MM` |
| `savings_pct` | INTEGER | 0–100 |

From step 3: `kept_value` when `kept_bucket = 'savings' AND kept_unit = 'pct'`, otherwise 20.

### `fixed_item`

Dropped.

## Domain

- `EntryBucket = 'income' | 'savings' | 'expense'`
- `PlanVersion = { effectiveMonth: string; savingsPercent: number }`
- `savingsPercentFor(versions, month)`: latest version not after `month`, else 20.
- `monthSummary(totals, percent)` → `{ income, saved, spent, goal, left }`, with `goal = floor(income × percent / 100)` and `left = income − spent − max(goal, saved)`.
