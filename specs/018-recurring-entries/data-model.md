# Data Model: Recurring Entries

## Migration step 7 (adds only; no existing row changes)

```sql
CREATE TABLE recurring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'savings', 'income')),
  category TEXT NOT NULL CHECK (
    (kind = 'expense' AND category IN ('housing', 'groceries', 'transport', 'eating_out', 'leisure', 'health', 'subscriptions', 'other'))
    OR (kind = 'income' AND category IN ('salary', 'freelance', 'benefits', 'gifts', 'other'))
    OR (kind = 'savings' AND category IN ('emergency_fund', 'investments', 'travel', 'goal', 'other'))
  ),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  note TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  last_month TEXT NOT NULL CHECK (last_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]')
) STRICT;
ALTER TABLE entry ADD COLUMN recurring_id INTEGER REFERENCES recurring(id);
```

Existing entries get `recurring_id = NULL` (they do not repeat, FR-008).

## Entities

- **RecurringItem** `{ id, kind, category, amountCents, note, active, lastMonth }`
  - `kind` fixed after creation; `category` must belong to `kind`; `amountCents` > 0 and within the entry limit; `note` ≤ 80 characters like entries.
  - `lastMonth`: the latest month it has an entry for (set to the current month when created, since the marked entry is that month's).
- **Entry** gains `recurringId: number | null`.

## State

`active (1)` → stop → `inactive (0)`. No way back: to repeat again, mark an entry again (a new item).

## Month fill

For month `M` (current): every item with `active = 1 AND last_month < M` → `last_month = M` and one entry `{date: M-01, kind, category, amount_cents, note, recurring_id: id}`.
