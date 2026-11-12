# Research: Activity Screen

Guidance: React Native 0.88 docs (`FlatList`, "Optimizing FlatList configuration"); Expo Router (existing routes in `src/app`).

## R1. Virtualized list

- **Decision**: core `FlatList` on the Activity screen with `keyExtractor` = entry id, a `React.memo` row and a `useCallback` `renderItem`. No `getItemLayout`.
- **Rationale**: `FlatList` mounts only the rows near the screen, so 300 entries stay cheap. Rows have a minimum height but grow with the phone's font size, so a fixed `getItemLayout` would be wrong.
- **Alternatives**: FlashList (new dependency, not needed at this scale); `ScrollView` + `map` (what home does today, renders every row).
- **Mobile note**: `FlatList` must be the screen's scroller; it cannot sit inside a `ScrollView` (virtualization stops working and React Native warns).

## R2. Home list

- **Decision**: home keeps `EntryList` (non-virtualized, with its fade animations) for at most 5 rows; a pure rule `firstEntries(entries, HOME_LIST_SIZE)` returns `{ shown, total }`.
- **Rationale**: 5 rows need no virtualization; keeping home's `ScrollView` keeps today's layout.

## R3. Route and params

- **Decision**: `/activity?month=YYYY-MM&kind=income|savings|expense` (no `kind` = All). Invalid or future months fall back to the current month, invalid kinds to All, as home does.
- **Rationale**: matches how `/entry` and `/month-picker` take `month`; the screen can be opened directly in tests.

## R4. Refresh after edits

- **Decision**: reuse `useMonthEntries(month)`, which reloads when the screen gets focus. Returning from the entry form refocuses both Activity and, later, home.
- **Alternatives**: a shared store or events (unneeded).

## R5. Filter state

- **Decision**: the Activity filter is local state, initialised from `kind`. It does not change home's tile (spec Out of Scope).
- **Header**: `Stack.Screen options={{ title: 'Activity · ' + formatMonth(month) }}` inside the screen, as the entry screen sets its title.
