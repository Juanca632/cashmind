# Feature Specification: Spaces

**Feature Branch**: `feat/027-spaces`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Home becomes the one screen for every space, like Revolut: "This month" and each pocket. A selector button under the top row names the current space ("This month ▾", "✈️ Japan trip ▾") and opens a sheet that lists every space with its figure, plus "New pocket". A pocket shown on home reuses home's parts: the hero card with its big figure (the balance, in the pocket's colour), "Save into" and "Spend from" actions, Saved and Spent tiles that filter the list, the activity card and the split by category. Each pocket has an optional emoji and one colour from a fixed palette, shown wherever it appears. The separate My pockets and pocket screens and the "See pockets ›" link go away. Out of scope: goals per pocket, moving money between pockets, reordering pockets, a draggable sheet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch between my spaces in one place (Priority: P1)

**Acceptance Scenarios**:

1. *Selector*: **Given** home is open, **Then** the top row is as before (the month pill, My plan, the gear), and centred right under the hero card a pill, styled like My plan, shows the space's round mark and "Main" with a down arrow, in every month, with or without income. "Main" is the month's money, as Revolut names its main account and switches accounts under the balance, so the selector does not read as a date
2. *Sheet*: **When** the user taps it, **Then** a sheet lists "Main" with its left to spend, then every pocket in creation order with its emoji, colour and balance, the line "In pockets <total>", and "New pocket"; the current space is marked
3. *Switch*: **When** the user taps "✈️ Japan trip", **Then** the sheet closes and home shows that pocket; the button reads "✈️ Japan trip ▾"
4. *Back*: **Given** a pocket is shown, **When** the user presses Android back, **Then** home shows "Main" again; from "Main" back leaves the app as today
5. *Opening the app*: the app always opens on "Main"
6. *Closing*: tapping outside the sheet or back closes it without changing the space
7. *New pocket*: "New pocket" in the sheet opens the pocket form; after creating it home shows the new pocket

---

### User Story 2 - A pocket looks like home (Priority: P1)

**Acceptance Scenarios**:

1. *Hero*: **Given** "Japan trip" holds 1 665,00 €, **Then** home's hero card, in the pocket's colour, shows "Balance" and "1 665,00 €" with the same big figure as "Left to spend", and under it "Started with 1 500,00 €" when it has a starting amount
2. *Overdrawn*: **Given** a pocket holds -50,00 €, **Then** the hero shows the red overspent look of home and "This pocket is 50,00 € short."
3. *Top row*: the month pill and "My plan" are not shown for a pocket; an edit button (pencil, "Edit Japan trip") and the gear are, on the right; under the hero the selector shows the pocket's mark with ✈️ and "Japan trip"
4. *Actions*: under the hero, "Save into" opens the form as Savings into that pocket, and "Spend from" opens it as an Expense paid from that pocket
5. *Tiles*: an Overview with two tiles, "Saved" (everything saved into it, starting amount excluded) and "Spent" (everything paid from it); tapping one filters the activity list as on home, and with Spent selected "By category" shows its split
6. *Activity*: the activity card lists the pocket's savings and expenses of every month, newest first; with none it says "Nothing saved in or spent from this pocket yet."
7. *Not month-bound*: a pocket shows every month's entries; spending pace, daily budget and Trends are not shown for it

---

### User Story 3 - Recognise each pocket (Priority: P2)

**Acceptance Scenarios**:

1. *Form*: the pocket form has an optional "Emoji" field (one emoji) and a "Colour" choice of the fixed palette, one selected
2. *Everywhere*: the emoji and colour show in the selector, the sheet, the hero, and the form's pocket choices. The emoji shows once: where a round mark holds it (the selector and the sheet rows), the name next to it goes without it
3. *No emoji*: a pocket without emoji shows the savings icon on its colour
4. *Update*: pockets made before this update get colours from the palette in turn and no emoji

---

### Edge Cases

- **Forms**: the expense form's "Paid from" and the savings form's pocket choice use the same look as the sheet rows: emoji, colour dot, name.
- **Deleted pocket while shown**: home falls back to "Main".
- **Paid from**: the expense form's month choice reads "Main" too (026 called it "This month").
- **Selected pocket pill**: a selected pill filled with a pocket's colour (or the month's green) is ringed with a lighter shade of that colour, never white.
- **Many pockets**: the sheet scrolls; the selector button truncates a long name.
- **Sheet figure for Main**: the row always shows the current month's left to spend, even while home browses a past month.
- **Emoji check**: the app checks only the length (at most 8 characters), not that the text is an emoji; the field is meant for one emoji.
- **Accessibility**: the selector reads "Space: <name>, change"; sheet rows are radio buttons "<name>, <figure>"; colour is never the only cue (names always show).
- **Dark mode**: each palette colour has a dark-mode shade with readable hero text.

## Requirements *(mandatory)*

- **FR-001** (Spaces): Home shows one space at a time: "Main", the month (as today), or one pocket. The space is a route parameter; switching does not stack screens; Android back from a pocket returns to "Main".
- **FR-002** (Selector and sheet): as Story 1. The sheet is drawn by the app over home (like the shared confirmation dialog), fades in and out, and is closed by a tap outside, back, or a choice. It is not draggable. Picking a space changes home's `space` parameter; the month parameter is kept.
- **FR-003** (Pocket view): as Story 2, reusing home's hero, tiles, activity card and split, extracted as shared components.
- **FR-004** (Identity): a pocket has an optional emoji (at most one emoji, up to 8 characters) and a colour from a fixed palette of 8.
- **FR-005** (Removed): the My pockets screen, the pocket screen and "See pockets ›" are removed; the pocket form stays and adds emoji and colour.
- **FR-006** (Migration): a new step adds `emoji` and `color` to pockets, giving existing pockets palette colours in turn; nothing else changes.
- **FR-007** (Baseline specs): 001 FR-013 and 003 describe spaces and the selector.

## Success Criteria *(mandatory)*

- **SC-001**: From any home view, any space is 2 taps away.
- **SC-002**: The user always sees the current space's name at the top.
- **SC-003**: "Main" looks and behaves exactly as before, except for the selector under its hero card.

## Assumptions

- The sheet is the app's own, with no drag, so the problems of 022's sheet (drag, keyboard, scrolling form) do not apply: it holds a short list and no text field.
- No new library.

## Out of Scope

- Goals per pocket, moving money between pockets, reordering, hiding pockets, a draggable sheet, custom colours.
