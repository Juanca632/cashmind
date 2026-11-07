# Design

## Context

Schema version 3 (`plan_version`, `month_income_override`). Home shows the selected month (`?month=YYYY-MM`) with targets from `targetsFor`. Past months are read-only via `isPastMonth`.

## Goals / Non-Goals

**Goals:**
- One `expense` table, totals computed in the domain from the month's rows.
- Editable-period rule as one pure function used by every screen.
- No new libraries.

**Non-Goals:**
- Pagination (a month has at most a few hundred rows), charts.

## Decisions

### 1. Table `expense` (schema version 4)
`id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL ('YYYY-MM-DD'), bucket TEXT NOT NULL CHECK (bucket IN ('fixed','leisure','savings')), amount_cents INTEGER NOT NULL CHECK (amount_cents > 0), note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL`. A month's expenses: `WHERE substr(date, 1, 7) = ?` ordered by `date DESC, id DESC`; no index, the table stays small.

### 2. Domain functions
- `totalsByBucket(expenses) → Record<Bucket, cents>`.
- `bucketProgress(bucket, spent, target)` → `{ spent, target, left, over }` where `left = max(target − spent, 0)`, `over = max(spent − target, 0)`; savings uses the same numbers, read as "left to save" / "goal reached".
- `isExpenseMonthEditable(month, today)`: `month === monthKey(today)` or (`month` is the previous month and `today.getDate() <= 5`).
- `validateExpense(input, today)`: amount > 0, valid bucket, date not after today and in an editable month.

### 3. Date input without a date-picker library
The expense screen shows the date with `‹` / `›` buttons that move one day, bounded by the first editable day (1st of the previous month in the grace period, else 1st of the current month) and today. Avoids adding `@react-native-community/datetimepicker`; dates in a budgeting app are almost always today or a few days ago.
*Alternative:* native date picker — better for far dates, but needs a new dependency.

### 4. Screens
- `src/app/expense.tsx`: add (no params, optional `month` to default the date into the grace month) or edit (`id` param). Fields: amount (€), bucket as three toggle buttons, note, date stepper. Delete button when editing.
- Home: `BucketRows` gains progress (bar + "x € left" / "x € over" / "goal reached") when expenses are passed; an "Add expense" button when the month is editable; the expense list below. Tapping an expense opens it for editing only if editable.
- Progress bar: a plain `View` with a percentage width, no library.

### 5. Data loading
A `useMonthExpenses(month)` hook loads that month's rows on focus, like `useIncomePlan`.

## Risks / Trade-offs

- [The day stepper is slow for dates far back] → the editable window is at most ~36 days.
- [Device time zone defines "today"] → same accepted trade-off as plan months.
- [`substr` filter scans the table] → irrelevant at this data size; add an index on `date` if it ever matters.
