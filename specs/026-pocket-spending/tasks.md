# Tasks: Spending from a pocket

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

Tests are written by the `test-writer` subagent from the spec (project rule), not by the implementation tasks.

- [X] T001 rules: `countsInMonth`, `checkPocket` for expenses, `fixedCostsCents` and `quickAddSuggestions` skip pocket entries, `pocketBalances` with saved/spent
- [X] T002 repository: `readPocket` allows expenses; `getPocketEntries`; hook `usePocketEntries` (replaces `useSavingsEntries`)
- [X] T003 home: summary, split and pace from `countsInMonth` entries; Trends and trend-category filter
- [X] T004 [US1] `PaidFromChoices` and the expense form ("Paid from", `pocket` param, kind switch)
- [X] T005 [US1] monthly entry form "Paid from" for expense items
- [X] T006 [US1] `EntryRow` "from <pocket>" caption and label
- [X] T007 [US2] pocket screen: Saved · Spent, Spent by category, red short balance, "Spend from this pocket"; My pockets red negative; pocket form text
- [X] T008 baseline specs 001 FR-013 and 002 left to spend
- [X] T009 Tests by the `test-writer` subagent for 026-pocket-spending
- [X] T010 lint, tsc, jest; `code-reviewer`; fix BLOCKER/MAJOR
