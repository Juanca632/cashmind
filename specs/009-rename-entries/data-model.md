# Data Model: Rename Entries

## Step 5

`entry` (was `expense`): `id`, `date`, `kind` (was `bucket`, `CHECK (kind IN ('expense', 'savings', 'income'))`), `amount_cents`, `note`, `created_at`. Every row is copied unchanged. `plan_version` is not touched.

## Names

| Before | After |
| --- | --- |
| `Expense`, `ExpenseInput`, `ExpenseError` | `Entry`, `EntryInput`, `EntryError` |
| `EntryBucket`, `ENTRY_BUCKETS` | `EntryKind`, `ENTRY_KINDS` |
| `BUCKET_LABELS`, `BUCKET_DESCRIPTIONS`, `BUCKET_COLORS`, `BUCKET_TINTS`, `BUCKET_ICONS` | `KIND_LABELS`, `KIND_DESCRIPTIONS`, `KIND_COLORS`, `KIND_TINTS`, `KIND_ICONS` |
| `BucketBadge` | `KindBadge` |
| `validateExpense`, `expenseErrorMessage`, `EXPENSE_MISSING`, `defaultExpenseDate`, `totalsByBucket` | `validateEntry`, `entryErrorMessage`, `ENTRY_MISSING`, `defaultEntryDate`, `totalsByKind` |
| `getExpensesOfMonth`, `getExpense`, `insertExpense`, `updateExpense`, `deleteExpense` (repository) | `getEntriesOfMonth`, `getEntry`, `insertEntry`, `updateEntry`, `deleteEntry` |
| `addExpense`, `editExpense`, `deleteExpense` (service) | `addEntry`, `editEntry`, `deleteEntry` |
| `useExpense`, `useMonthExpenses`, `ExpenseList` | `useEntry`, `useMonthEntries`, `EntryList` |
| field `bucket` on an entry | `kind` |
| route `/expense` | `/entry` |
