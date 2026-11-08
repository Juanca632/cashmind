# Data Model: App Architecture Foundation

The database schema does not change. See `src/db/database.ts`.

## Read checks per table

| Table | Field | Check |
| --- | --- | --- |
| `expense` | `id` | Integer |
| `expense` | `date` | Real day, `YYYY-MM-DD` |
| `expense` | `bucket` | `fixed`, `leisure` or `savings` |
| `expense` | `amount_cents` | Integer above zero |
| `expense` | `note` | Text |
| `plan_version` | `effective_month` | Valid `YYYY-MM` |
| `plan_version` | `income_cents`, `fixed_value`, `kept_value` | Integer |
| `plan_version` | `fixed_unit`, `kept_unit` | `eur` or `pct` |
| `plan_version` | `kept_bucket` | `leisure` or `savings` |
| `month_income_override` | `month` | Valid `YYYY-MM` |
| `month_income_override` | `income_cents` | Integer |

## Write result

`{ ok: true }`, or `{ ok: false, kind: 'invalid' | 'failed', message: string }`.

## Loadable data

`{ status: 'loading' }`, `{ status: 'error' }` or `{ status: 'ready', data }`.
