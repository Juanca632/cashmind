# Feature Specification: Entry form redesign

**Feature Branch**: `feat/022-entry-sheet`

**Created**: 2026-11-20

**Status**: Implemented

**Input**: User description: "The add/edit entry form shows too much at once. Like professional budgeting apps: amount first, a clear kind choice, categories easy to scan, suggestions, date, repeat and note as quieter details, keyboard closed by default, in the same style as the rest of the app."

**History (2026-11-20)**: the form was first built as a bottom sheet. Android's own sheet dragged from anywhere (scrolling closed it) and could not ask before discarding; an app-drawn sheet fixed that but kept bringing keyboard and animation problems, so the developer chose a normal page again with the new layout. What was tried and learned is in [bottom-sheet-attempt.md](./bottom-sheet-attempt.md). The layout came from a UI audit against the app's own style and a review of Cashew, Wallet, Monefy and Material 3.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The form opens with the keyboard closed (Priority: P1)

**Why this priority**: With the keyboard open on arrival, half the form was hidden; the user should first see the whole form, including the suggestions.

**Independent Test**: Tap Add and an existing entry; check the keyboard and the ways out.

**Acceptance Scenarios**:

1. *Page*: **When** the user taps Add (or an entry in a list), **Then** the form opens as its own page with its title in the header ("Add expense", "Add income", "Add to savings" or "Edit entry") and the back arrow, as before
2. *Keyboard closed*: **Then** the keyboard is closed; the amount shows "0,00 €" (or the entry's amount when editing)
3. *Typing the amount*: **When** the user taps the amount (the number or "€"), **Then** the number keyboard opens
4. *Leaving*: **Given** something was changed, **When** the user goes back, **Then** the app asks before discarding, as before; with nothing changed it goes back at once
5. *Saving*: **When** the user taps the add (or "Save changes") button, **Then** the entry is saved as before and the form closes

---

### User Story 2 - Less on the form at once, in the app's style (Priority: P1)

**Why this priority**: The form showed nine blocks of the same weight. Each kind of control now has its own shape, grouped the way the rest of the app groups things (a small title, or a card).

**Independent Test**: Open the form to add an expense and check what shows, in order, and that each control works.

**Acceptance Scenarios**:

1. *Order*: the form shows, top to bottom: the kind control; the amount, large (as big as My plan's percentage) and alone in a card tinted with the kind's color; "Category" and the kind's categories; "Often recorded" and the suggestions (021); a card with the Date, "Repeat every month" and Note rows; the add button; and, when editing, Delete
2. *Kind*: the kind is one segmented control (Expense, Income, Savings), the selected segment filled with its kind's color; **When** the user picks another kind, **Then** the card's tint, the categories (with Other selected), the title and the add button follow it
3. *Categories*: the kind's categories show all at once as a grid of four per line, each an icon in a circle with its name under it; the selected one is filled with the kind's color
4. *Suggestions*: under the small title "Often recorded", one sideways row of flat pills ("Coffee · 2,50 €"); title and row are hidden when there are none
5. *Date row*: reads "Date" with "Today" or the day ("Fri 13 Nov") on the right; tapping it opens Android's calendar, limited as before to the entry's month and to today
6. *Repeat row*: in the current month a "Repeat every month" row with a switch; in a past month it is not shown
7. *Note row*: a text field in the card with the placeholder "Note, e.g. Cinema" (the kind's example); tapping it opens the keyboard
8. *Delete*: **When** editing, a Delete button under the save button asks before deleting, as before

---

### Edge Cases

- **Many suggestions**: their row scrolls sideways; categories never need more than two lines of four.
- **Small phones and big text**: the page scrolls; long category names shrink to fit one line.
- **Dark mode**: cards, tint and grid follow the theme's colors.
- **Errors**: the amount error shows under the amount, the date error under the Date row.
- **Screen readers**: kind and category are radio groups; every control is at least 48 dp to touch.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Page): The entry form (add and edit) stays a page of the app's stack with its header title and back arrow.
- **FR-002** (Keyboard): The form MUST open with the keyboard closed; tapping the amount opens the number keyboard.
- **FR-003** (Leaving): Going back with unsaved changes MUST ask before discarding (the shared dialog), as before.
- **FR-004** (Layout): The form MUST show a segmented kind control, then the amount, large and alone in a kind-tinted card; the categories as a grid of four per line under "Category"; the suggestions in one sideways-scrolling row under "Often recorded"; a card with the Date row, the "Repeat every month" switch row (current month only) and the Note field row; then the add or save button, and Delete when editing.
- **FR-005** (Date): The date MUST be chosen only through Android's calendar, opened from the Date row, within the entry's month and up to today; the one-day arrows are removed.
- **FR-006** (Same rules): Validation, saving, repeating, suggestions and the data stored MUST not change.
- **FR-007** (Baseline and earlier specs): `specs/001-expenses` FR-001 (date picked from the calendar only, keyboard closed) and `specs/021-quick-add` (the "Often recorded" title, one sideways row) MUST be updated.

### Key Entities

- None. No data change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the keyboard closed, the add form shows the amount, the categories and the suggestions on a 6-inch phone without scrolling.
- **SC-002**: An expense from a suggestion is still added in 3 taps from home.
- **SC-003**: Every scenario of 001 and 021 still holds except the ones this spec changes on purpose.

## Assumptions

- No new library; existing components (`Card`, `Pill`, `Button`, `ThemedText`, `ScreenScroll`) and two new ones in `entries` (`KindSegmented`, the category grid).
- The monthly entry screen (`/recurring`) keeps its own form.

## Out of Scope

- A bottom sheet (tried and dropped, see the history above).
- A custom number keypad.
- Changes to home, Activity or My plan.
- Any data or rule change.
