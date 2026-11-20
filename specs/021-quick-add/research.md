# Research: Quick add

## Where the suggestions sit

- **Decision**: in the entry form, under the amount field and above the kind choice, only while adding an expense.
- **Rationale**: home is already full (hero card, tiles, pace chart, list); the form is where the user is about to type the same values. Under the amount field the row stays visible above the keyboard, which opens on the amount.
- **Alternatives**: a row on home (rejected by the developer: too busy); a long-press menu on the Add button (hidden, hard to discover).

## What a tap does

- **Decision**: fill amount, category and note; the user still taps the add button.
- **Rationale**: one predictable behavior, nothing saved by mistake while scrolling, no undo system needed.
- **Alternatives**: save at once with an "Undo" message (one tap fewer, but a new pattern and accidental entries).

## Which expenses count

- **Decision**: same note, category and amount; at least 2 in the last 60 days; at most 4; order by count, then latest date; monthly repeats left out; exact note match.
- **Rationale**: keeps one-off purchases out, shows daily and weekly habits, and is easy to reason about; repeats are recorded by the app itself.
- **Alternatives**: fuzzy note matching or amount ranges (unpredictable); user-pinned favourites (needs storage and settings).

## Data access

- **Decision**: reuse `getEntriesBetween` / `useEntriesBetween` over the months that hold the window, filter by day in the pure function.
- **Rationale**: no new query or table; at most three months of entries, a few hundred rows.
- **Alternatives**: a GROUP BY query in SQL (more code to format-check, harder to unit test).
