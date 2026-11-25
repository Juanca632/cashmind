# Feature Specification: Move money

**Feature Branch**: `feat/028-move-money`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Move money out of a pocket, into Main or into another pocket, like taking money out of a "bolsillo" in a banking app. In a pocket's space a third action "Move" opens a move form: From (that pocket, can be changed), To (Main or another pocket), amount, date and an optional note. Main → pocket stays a saving. Pocket → pocket changes no month figure. Pocket → Main gives the move's month that much more left to spend, without being income or negative savings. A move cannot take more than the pocket holds. Moves show in the lists of both sides and can be edited or deleted. A pocket with moves cannot be deleted. A new `move` table (migration 11, approved by the developer). Out of scope: the month-end "save what is left" prompt, moving from Main through the move form, repeating moves, moves in Trends."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Take money out of a pocket for the month (Priority: P1)

The car breaks down and the month's money is not enough. The user has an emergency pocket and wants that money back in the month.

**Why this priority**: Money put aside must be reachable again; today it can only be spent from the pocket, not given back to the month.

**Independent Test**: With a pocket holding money and a month with income, move part of it to Main and check the pocket and the month's figures.

**Acceptance Scenarios**:

1. *Opening*: **Given** home shows "Emergency fund" holding 1 000,00 €, **Then** under the selector there are three neutral round actions (the app's light surface, not the pocket's colour), with an icon and a short name under each, as banking apps put them under a balance: "Save" (read as "Save into"), "Spend" (read as "Spend from") and "Move"; **When** the user taps "Move", **Then** the move form opens titled "Move money", with From set to "Emergency fund" and To set to "Main"
2. *Moved*: **When** they type 300,00 and save, **Then** home shows "Emergency fund" at 700,00 €, **And** its activity lists the move as "To Main" with "-300,00 €"
3. *More left to spend*: **Given** this month has an income of 2 000,00 €, 1 800,00 € spent and a goal of 0, **Then** after the move Main's left to spend is 500,00 € instead of 200,00 €, **And** the daily budget and the spending pace follow it
4. *Not income, not savings*: **Then** Main's Income tile, Saved tile, the savings goal, My plan and Trends are the same as before the move
5. *In Main's list*: **Then** Main's list and Activity show the move on its day as "From Emergency fund" with "+300,00 €"
6. *Date*: the form's date starts on today and can be changed with the same date field as the entry form; a move into Main counts in the month of its date
7. *Note*: an optional note shows as the move's title in the lists instead of "To Main" / "From Emergency fund"

---

### User Story 2 - Move money between pockets (Priority: P1)

The user decides part of the emergency money should go to the trip instead.

**Why this priority**: Plans change; without it the user would have to fake an expense and a saving.

**Independent Test**: Move between two pockets and check both balances and that no month figure changed.

**Acceptance Scenarios**:

1. *To another pocket*: **Given** "Emergency fund" holds 1 000,00 € and "Japan trip" 500,00 €, **When** the user moves 300,00 € from "Emergency fund" to "Japan trip", **Then** they hold 700,00 € and 800,00 €
2. *Both lists*: **Then** "Emergency fund" lists "To Japan trip" with "-300,00 €" and "Japan trip" lists "From Emergency fund" with "+300,00 €"
3. *No month change*: **Then** none of Main's figures or lists change
4. *Choices*: To offers "Main" and every other pocket, never the pocket chosen as From; From offers every pocket; changing From to the pocket chosen as To sets To back to "Main"
5. *Total*: "In pockets" in the spaces sheet is the same before and after a move between pockets, and lower by the amount after a move into Main

---

### User Story 3 - Fix or undo a move (Priority: P2)

**Why this priority**: Typing mistakes happen, as with any entry.

**Independent Test**: Edit a move's amount and pockets, then delete it.

**Acceptance Scenarios**:

1. *Edit*: **When** the user taps a move in any list, **Then** the move form opens with its From, To, amount, date and note, and saving updates every balance and figure
2. *Delete*: **When** they tap "Delete move" and confirm in the shared dialog, **Then** it is gone and every balance and figure is as before it
3. *Leaving*: leaving the form with unsaved changes asks before discarding, as the other forms do

---

### Edge Cases

- **Not enough in the pocket**: a move cannot take more than the From pocket's balance; the form shows "Emergency fund holds only 700,00 €." and saves nothing. When editing a move, its own amount counts as still in the pocket. A pocket at 0 or below cannot be moved from. Later edits elsewhere (deleting a saving, spending) may still take a pocket below zero, as today.
- **Only one pocket**: To offers only "Main".
- **Deleting a pocket**: a pocket that any move comes from or goes to cannot be deleted; its form says "A pocket with savings, spending or moves can't be deleted. You can rename it."
- **Month without income**: the card keeps asking for income as today; money moved into that month counts in left to spend once the month has income.
- **Pocket tiles**: a pocket's Saved and Spent tiles stay savings and expenses only; moves show in its Activity (the unfiltered list) and in its balance.
- **Main's tiles**: filtering Main's list by a kind does not show moves; the unfiltered list does.
- **Amount**: required, above 0, within the app's amount limit, with the same amount field and messages as the entry form.
- **Accessibility**: a move row reads "<title>, <day>, <amount with sign>"; From and To are radio groups named "From" and "To".
- **Quick add** (021) and monthly entries (repeats) ignore moves.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Move): A move takes an amount from one pocket (From) to Main or to another pocket (To), on a date, with an optional note. It always starts from a pocket; Main → pocket stays a saving (025).
- **FR-002** (Recording): A pocket's space MUST offer "Move" beside "Save into" and "Spend from", opening the move form with From set to that pocket and To set to "Main".
- **FR-003** (Balance): A pocket's balance is its starting amount + its savings − the expenses paid from it − what was moved out of it + what was moved into it.
- **FR-004** (Into Main): Money moved into Main adds to the left to spend of the move's month: left to spend = income + moved into Main − expenses − the larger of the goal and what was saved. The daily budget and the spending pace use this left to spend, and the pace line ends at it. Income, Saved, the goal, My plan and Trends do not count moves.
- **FR-005** (Limit): A move MUST NOT take more than its From pocket's balance (its own amount included when editing).
- **FR-006** (Lists): Moves show in the From pocket ("To <space>", minus), the To pocket ("From <pocket>", plus) and, when into Main, in Main's list and Activity on their day ("From <pocket>", plus). A note replaces that title. Lists stay in time order with entries: newest day first, and within a day what was recorded last first, so a move made after an expense of the same day lists above it. Tapping one opens it to edit or delete.
- **FR-007** (Delete pocket): A pocket used by any move cannot be deleted.
- **FR-008** (Storage): Moves are stored in their own table, added by a new migration step that keeps all user data.
- **FR-009** (Baseline specs): `specs/002-income-plan` FR-004 (left to spend) and `specs/001-expenses` FR-013 (pocket balance) MUST describe moves.

### Key Entities

- **Move**: a date, an amount, a From pocket, a To that is Main or another pocket, and an optional note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Taking money out of a pocket for the month takes two taps ("Move" and save) plus typing the amount, from the pocket's space.
- **SC-002**: After any moves, the sum of all pocket balances plus the money moved into Main equals what it was before them, to the cent.
- **SC-003**: A move between pockets leaves every month figure unchanged.

## Assumptions

- Moving from Main to a pocket is not offered in the move form, because "Save into" already does it and counts as the month's savings.
- A move into Main is not income: the month's income stays what the user earned, so Trends and the savings goal are not inflated.
- Pockets have no dates of their own; the limit is checked against the pocket's balance when the move is saved.

## Out of Scope

- The month-end "save what is left" prompt.
- Moving from Main through the move form, repeating moves, moves in Trends, moves between currencies.
