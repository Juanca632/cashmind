# Feature Specification: Quick add

**Feature Branch**: `feat/021-quick-add`

**Created**: 2026-11-20

**Status**: Implemented

**Input**: User description: "Quick-add suggestions in the entry form. When the user opens the form to add a new expense, a short row of suggestions appears at the top: the expenses they record most often lately, each shown as a small pill with its category icon, its note (or category name) and its amount. Suggestions are built automatically from recent entries (same note, category and amount counted as the same thing); nothing to configure, pin or edit. Tapping a suggestion fills the form's amount, category and note with those values, keeping the form's date; the user can still change anything and must tap Save as usual (nothing is saved by the tap itself). Out of scope: changes to the home screen, income and savings suggestions, pinning or editing favourites, saving with one tap / undo, suggestions when editing an existing entry. Keep it simple and predictable."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fill a new expense from one I often record (Priority: P1)

Most daily expenses repeat (a coffee, the bus, the supermarket). Typing the same amount, category and note again takes about six taps; a suggestion fills all three in one.

**Why this priority**: It is the whole feature.

**Independent Test**: With known recent expenses, open the form to add an expense on a known day, check the suggestions shown, tap one and save.

**Acceptance Scenarios**:

1. *Shown*: **Given** today is 20 November 2026 and the user recorded the expense "Café", Eating out, 2,50 € on 3, 10 and 18 November, **When** they open the form to add an expense, **Then** under the kind and categories a row shows a suggestion with the Eating out icon, "Café" and "2,50 €"
2. *Fill*: **When** the user taps that suggestion, **Then** the amount is 2,50, the category is Eating out and the note is "Café"; the kind stays Expense, and the date and the "Repeat every month" switch keep their values
3. *Nothing saved by the tap*: **Then** nothing is recorded until the user taps the add button, and the entry saved then is an ordinary expense with the form's date
4. *Still editable*: **Given** the form was filled from a suggestion, **When** the user changes the amount to 3,00 and saves, **Then** the expense is recorded with 3,00 €
5. *Overwrites the three fields*: **Given** the user had already typed an amount, a category or a note, **When** they tap a suggestion, **Then** those three fields take the suggestion's values
6. *Leaving*: **Given** the form was filled from a suggestion and not saved, **When** the user leaves, **Then** the app asks before discarding, as with any unsaved change
7. *Past month*: **Given** the user adds an expense in October from the month view, **Then** the same suggestions show and tapping one keeps the October date

---

### User Story 2 - Which suggestions show (Priority: P1)

**Why this priority**: The row must only show what the user really repeats, in an order they can predict, or it is noise.

**Independent Test**: With a known set of recent expenses, check which suggestions show and in what order.

**Acceptance Scenarios**:

1. *Same thing*: expenses with the same note, category and amount count as the same suggestion; a different amount ("Café" 2,50 € and "Café" 3,00 €) or note makes another one
2. *At least twice*: **Given** "Cinema" 12,00 € was recorded only once in the last 60 days, **Then** it is not suggested
3. *Last 60 days*: only expenses dated from 59 days before today up to today count; older ones do not
4. *Order and count*: suggestions are ordered by how many times they were recorded in that period, most first, ties by the most recent date first; at most 4 show
5. *Repeats left out*: entries recorded by a monthly repeat (see 018) do not count, since the app records them by itself
6. *Expenses only*: income and savings entries never count; **When** the user switches the form's kind to Income or Savings, **Then** the row is hidden, and it shows again when they switch back to Expense
7. *No note*: a suggestion whose expenses have no note reads the category name ("Groceries"), or "Expense" for Other, as in the lists
8. *Nothing to suggest*: **Given** no expense was recorded at least twice in the last 60 days, **Then** the row and its title are not shown at all
9. *Editing*: **When** the user opens an existing entry to edit it, **Then** no suggestions show

---

### Edge Cases

- **Unreadable data**: if the recent entries cannot be read, no suggestions show and the form works as usual; nothing is changed or deleted.
- **Long notes**: a long note is cut with an ellipsis so each suggestion stays short; the row scrolls sideways (see 022).
- **Changes**: an expense saved, edited or deleted counts the next time the form opens.
- **Accessibility**: each suggestion is a button whose name reads "Fill with Café, Eating out, 2,50 €".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Where): The form to add a new entry MUST show, only while the kind is Expense, one sideways-scrolling row of suggestions under the title "Often recorded" (placed by 022). It MUST NOT show when editing an entry or when there is no suggestion.
- **FR-002** (Which): A suggestion is a group of expenses with the same note, category and amount, dated from 59 days before today up to today, not recorded by a monthly repeat, with at least 2 expenses. At most 4 show, ordered by number of expenses, most first, then by most recent date.
- **FR-003** (Looks): Each suggestion MUST show its category icon, its title (the note, else the category name, else "Expense" for Other, as FR-006 of 001) and its amount.
- **FR-004** (Fill): Tapping a suggestion MUST set the form's amount, category and note to its values and change nothing else. It MUST NOT save; the form saves, validates and asks before discarding as before.
- **FR-005** (Read-only): Suggestions are worked out from existing entries each time the form opens; nothing new is stored.
- **FR-006** (Baseline spec): `specs/001-expenses` FR-001 MUST mention the suggestions.

### Key Entities

- None stored. A suggestion is computed from expenses: note, category, amount, how many times and the latest date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An expense the user records often is added in 3 taps from home (Add, the suggestion, the add button), instead of about 6.
- **SC-002**: The home screen does not change.
- **SC-003**: A suggestion never saves anything by itself: the number of entries changes only when the user taps the add button.

## Assumptions

- 60 days and "at least twice" keep one-off purchases out while daily and weekly habits show; 4 suggestions fit in about one or two lines.
- Notes are matched exactly as saved (they are trimmed when saved), so "Café" and "café" are two suggestions. One predictable rule over fuzzy matching.
- "Today" is the phone's date, not the form's month, so a past month's form shows the same suggestions.
- No database change and no new library.

## Out of Scope

- Any change to the home screen.
- Income and savings suggestions.
- Pinning, hiding, renaming or editing suggestions; any setting.
- Saving with one tap, undo.
- Suggestions while editing an entry.
- Fuzzy matching of notes or amounts.
