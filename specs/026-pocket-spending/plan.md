# Implementation Plan: Spending from a pocket

**Branch**: `feat/026-pocket-spending` | **Date**: 2026-11-25 | **Spec**: [spec.md](./spec.md)

## Summary

The `pocket_id` from 025 now also marks an expense as "paid from that pocket". There is no migration. One rule, `countsInMonth(entry)`, leaves those expenses out wherever month figures are added up: home's totals, split and pace, Trends, fixed costs and quick add. Pocket balances subtract them. The expense form, the monthly entry form and the pocket screen get the "Paid from" choice and the pocket's spending.

## Technical Context

**Dependencies**: none new.

**Storage**: unchanged. `entry.pocket_id` and `recurring.pocket_id` may now be set for expenses. The format check allows a pocket on savings (required) and on expenses (optional), and never on income.

**Testing**:
- **Unit tests**: `countsInMonth`, `pocketBalances` with spending, `fixedCostsCents`, quick add, and validation.
- **Integration tests**: Stories 1–2 from the pocket screen and from home.
- No Maestro change.

## Constitution Check

| Principle | Result |
| --- | --- |
| II. Simple | Pass. One flag already in the data, and one rule for month figures. |
| IV. Money | Pass. Integer sums. |
| Migrations | None. |
| Architecture | Pass. `entries` owns the rule. Home and Trends filter with it, since home combines features. |
| Baseline | 001 FR-013 and 002 left to spend. |

## Design

- **Rules**:
  - `countsInMonth(entry)` is false only for an expense with `pocketId !== null`.
  - `checkPocket`: savings require a pocket, income has none, expenses may have one.
  - `fixedCostsCents` skips items with a pocket, and `quickAddSuggestions` skips entries with a pocket.
  - `pocketBalances(pockets, entries)` returns `{ pocket, cents, savedCents, spentCents }`, where `cents = starting + saved − spent`.
- **Repository**:
  - `readPocket` allows a pocket on expenses.
  - `getSavingsEntries` becomes `getPocketEntries`: every entry with a pocket, newest first. The hook becomes `usePocketEntries`.
- **Service**: unchanged. It already checks that the pocket exists for any entry with a `pocketId`.
- **Home**:
  - `summary`, `split` and `pace` use `monthEntries.filter(countsInMonth)`; the list uses every entry.
  - `loadedIncome` is unaffected.
- **Trends** and the **trend category screen** filter with `countsInMonth` before every computation.
- **Entry form**:
  - for kind Expense, a "Paid from" section with `PaidFromChoices`: radio pills "This month" plus each pocket, shown only when pockets exist;
  - the `pocket` param sets the initial pocket when adding;
  - switching kind resets the pocket: Expense to null, Savings keeps the choice for savings.
- **Monthly entry form**: the same choices for expense items.
- **`EntryRow`**: under the title, the caption "from <pocket>" next to the day for expenses with a pocket, plus the accessibility label.
- **Pocket screen**:
  - "Saved · Spent" when spent > 0, and a red balance plus the short text when below 0;
  - `CategorySplit` titled "Spent by category" for its expenses;
  - the "Spend from this pocket" button pushes `/entry?kind=expense&pocket=<id>`.
- **My pockets**: a negative balance shows in red (`theme.error`).
- **Pocket form**: the text when it cannot be deleted becomes "A pocket with savings or spending can't be deleted. You can rename it.".
