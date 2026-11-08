# Data Model: Database Foundation

Version 1 is defined in `src/db/migrations.ts`. All tables are `STRICT`.

| Table | Column | Rule |
| --- | --- | --- |
| `plan_version` | `effective_month` | Text matching `YYYY-MM` digits, primary key |
| `plan_version` | `income_cents` | Integer above zero |
| `plan_version` | `fixed_unit`, `kept_unit` | `eur` or `pct` |
| `plan_version` | `fixed_value`, `kept_value` | Integer, zero or more, at most 100 when the unit is `pct` |
| `plan_version` | `kept_bucket` | `leisure` or `savings` |
| `month_income_override` | `month` | Text matching `YYYY-MM` digits, primary key |
| `month_income_override` | `income_cents` | Integer above zero |
| `expense` | `date` | Text matching `YYYY-MM-DD` digits |
| `expense` | `bucket` | `fixed`, `leisure` or `savings` |
| `expense` | `amount_cents` | Integer above zero |
