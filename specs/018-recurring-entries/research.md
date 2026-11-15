# Research: Recurring Entries

## When to record the month's entries

- **Decision**: when home shows the current month: once at start, and again when the month changes while the app is open (`useToday` refreshes on returning to the foreground). Home waits for it before showing the month.
- **Rationale**: no background job, no notification permission, works in Expo Go; the first screen of a new month already has the entries (SC-001).
- **Alternatives**: in the database `onInit` (misses a month change while open); a background task (needs native setup and permissions; out of proportion).

## Making it run once per month

- **Decision**: `last_month` per item, moved with a conditional `UPDATE … WHERE last_month < ?` inside `withTransactionAsync`; the entry is inserted only when that update changed a row.
- **Rationale**: idempotent even if called twice (React dev double effects, two quick foregrounds); a deleted entry does not come back because `last_month` already says the month is done.
- **Alternatives**: checking whether a linked entry exists in the month (a deleted one would come back, against US2-3); `withExclusiveTransactionAsync` (other reads may fail with "database is locked"; the conditional update already makes the second call a no-op).
- **Docs**: Expo SQLite SDK 58: `withTransactionAsync` is not exclusive; `withExclusiveTransactionAsync` runs on a new connection and other writes may fail while it is active.

## Where the code lives

- **Decision**: in the `entries` feature; My plan (`home`) combines `entries` and `plan`.
- **Rationale**: an item is a template of an entry and shares its kind, categories and validation; features may not import each other, and only `home` combines them.

## Entry ↔ item link

- **Decision**: nullable `entry.recurring_id`; the icon shows for any linked entry, active or stopped.
- **Rationale**: one column; the switch's initial state is "linked to an active item"; stopping keeps the link for history.

## Switch control

- **Decision**: React Native `Switch` wrapped in a shared `SwitchRow` (label + switch, themed, tokens).
- **Rationale**: core component, no library; the styles rule asks for shared controls.
