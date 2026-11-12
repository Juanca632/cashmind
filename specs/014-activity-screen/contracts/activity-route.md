# Contract: `/activity` route

| Param | Values | Missing or invalid |
| --- | --- | --- |
| `month` | `YYYY-MM`, not after the current month | current month |
| `kind` | `income`, `savings`, `expense` | All |

- Header title: `Activity · <Month YYYY>` (for example `Activity · November 2026`).
- Filter pills, in order: All, Income, Spent, Savings; the selected one has `accessibilityState.selected`.
- Rows: same as home (kind icon, note or kind name, day name, amount); tapping one opens `/entry?id=<id>`.
- Empty texts: All → "Nothing was recorded this month."; per kind → home's texts ("No income this month.", "No savings this month.", "No expenses this month.").
- Unreadable data: the shared `DataError` screen.

Home link: `See all (N)` button below the list, accessibility label `See all N entries`, pushes `/activity` with home's `month` and selected `kind`.
