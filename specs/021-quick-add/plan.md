# Implementation Plan: Quick add

**Branch**: `feat/021-quick-add` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

The entry screen loads the entries of the months that hold the last 60 days with the existing `useEntriesBetween`; a pure `quickAddSuggestions(entries, today)` in `entries/rules.ts` groups the expenses and picks up to four. A small `QuickAddRow` component under the amount field shows them as `Pill`s; tapping one sets the form's amount, category and note. No database change, no new library, home is untouched.

## Technical Context

**Dependencies**: none new.

**Storage**: none; read-only. Reuses `getEntriesBetween` (format-checked) through `useEntriesBetween`.

**Testing**: unit tests for `quickAddSuggestions` (grouping, 60-day window, at least 2, order and ties, max 4, repeats and other kinds left out, titles); integration tests rendering home → Add → tap a suggestion → save, the kind switch hiding the row, editing showing none, and a past month keeping its date. No Maestro flow: nothing native is involved, and the existing add-entry flow keeps covering the form.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Local reads only. |
| II. Keep It Simple | Pass. One pure function, one component, an existing query and hook; nothing stored. |
| IV. Money Is Integer Cents | Pass. Grouping keys use `amountCents`; the form gets `centsToInput(cents)`. |
| Architecture | Pass. All of it lives in `entries`; the screen reads through a hook. |
| Styles rule | Pass. `Pill` for suggestions, `ThemedText` for the title, existing `Layout` gaps; no new token expected. |
| Baseline specs | 001 FR-001 mentions the suggestions. |

Post-design re-check: unchanged.

## Design

### Pure logic — `src/features/entries/rules.ts`

- `entryTitle(entry)` moves here from `entry-list.tsx` (note, else category name, else the kind's name for Other) so rows and suggestions share one rule.
- `QUICK_ADD_DAYS = 60`, `QUICK_ADD_MIN = 2`, `QUICK_ADD_MAX = 4`.
- `quickAddSuggestions(entries, today)` → `QuickAddSuggestion[]` (`{ category, amountCents, note, count, lastDate }`):
  - keeps `kind === 'expense'`, `recurringId === null`, `addDays(todayKey, -59) <= date <= todayKey`;
  - groups by `category` + `amountCents` + `note` (exact);
  - keeps groups with `count >= 2`; sorts by `count` desc, then `lastDate` desc; takes 4.
- `quickAddRange(today)` → `{ from, to }` month keys covering the window (month of `today − 59 days` to today's month), for the hook.

### UI

- **`EntryScreen`**: calls `useEntriesBetween(range.from, range.to)` beside `useEntry`; waits for it while loading (the form already waits for the entry); on error passes no suggestions (the form still works, nothing is changed). Passes `suggestions` to `EntryForm` only when adding (`id === null`).
- **`QuickAddRow`** (`entries/components/quick-add-row.tsx`): title "Recent" (`ThemedText` `small`, `textSecondary`, like field labels), then a wrapping row (`flexWrap`, `Layout.itemGap`) of `Pill`s: icon `categoryIcon('expense', category)` in the expense ink, label `"<title> · <amount>"`, accessibility label `"Fill with <title>, <category name>, <amount>"`. Nothing renders when the list is empty.
- **`EntryForm`**: renders `QuickAddRow` between the amount field and the kind choice while `kind === 'expense'`; `onPick` sets `amountText` (`centsToInput`), `category` and `note`, with `hapticTick()`. The date, the kind and the repeat switch are left alone; the discard guard sees the change as usual.

### Demo data

- `src/db/demo-data.ts`: a few "Coffee" 2,50 € (Eating out) entries last month and this month, so `npm run demo` shows a suggestion beside "Transport pass".

### Baseline spec

- `specs/001-expenses` FR-001: "When adding an expense, the form suggests the expenses recorded most often lately (see 021)."

## Complexity Tracking

None.
