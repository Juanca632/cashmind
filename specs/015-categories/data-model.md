# Data Model: Categories

## entry (changed, migration step 6)

| Column | Type | Rule |
| --- | --- | --- |
| `category` (new) | `TEXT NOT NULL DEFAULT 'other'` | must be in the list of the row's `kind` (CHECK) |

Every other column is unchanged. Existing rows get `'other'`.

## Category lists (code, not stored)

| Kind | Keys (in order) | Labels |
| --- | --- | --- |
| expense | `housing`, `groceries`, `transport`, `eating_out`, `leisure`, `health`, `subscriptions`, `other` | Housing, Groceries, Transport, Eating out, Leisure, Health, Subscriptions, Other |
| income | `salary`, `freelance`, `benefits`, `gifts`, `other` | Salary, Freelance, Benefits, Gifts, Other |
| savings | `emergency_fund`, `investments`, `travel`, `goal`, `other` | Emergency fund, Investments, Travel, Goal, Other |

## Entry (TypeScript)

`{ id, date, kind, amountCents, note, category }`; `EntryInput` is the same without `id`. Validation error `'category-invalid'` when `category` is not in `kind`'s list.

## CategoryShare (derived)

`{ category, cents, percent }`: cents of the kind in that category this month; `percent = round(cents × 100 / kind total)`.
