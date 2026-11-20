# Data Model: Quick add

No table or column changes, no migration.

## QuickAddSuggestion (computed, not stored)

| Field | Type | From |
| --- | --- | --- |
| `category` | `EntryCategory` (an expense category) | the grouped expenses |
| `amountCents` | integer cents > 0 | the grouped expenses |
| `note` | string (may be empty) | the grouped expenses, exact |
| `count` | integer ≥ 2 | number of expenses in the group within the window |
| `lastDate` | `YYYY-MM-DD` | latest date in the group |

Rules: expenses only, not linked to a repeating item, dated from today − 59 days to today; ordered by `count` desc then `lastDate` desc; at most 4.
