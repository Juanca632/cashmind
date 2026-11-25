# Feature Specification: Pockets

**Feature Branch**: `feat/025-pockets`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Savings go into pockets the user creates and names (like Nequi or Bancolombia "bolsillos", or Monzo Pots), instead of the fixed savings categories. A pocket can start with money saved before using the app; that starting amount does not count as this month's savings. "My pockets", opened from home, lists every pocket with its balance and the total; a pocket shows its balance and its savings. Existing savings move into pockets named after their old category, losing nothing. A pocket with savings cannot be deleted, only renamed. Out of scope: spending from a pocket (next step, with a normal category), a budget for a period with its pace, goals per pocket, icons per pocket, moving money between pockets."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create my pockets, with what I already have (Priority: P1)

The user has money saved from before using the app, for trips, the car and emergencies. They want one pocket for each, named their own way, starting from what is already there.

**Why this priority**: Without pockets there is nowhere to put savings.

**Independent Test**: Create pockets with and without a starting amount, then open My pockets and check the balances and that this month's figures did not change.

**Acceptance Scenarios**:

1. *Opening*: **Given** home shows the Overview, **When** the user taps "See pockets ›" next to its title, **Then** "My pockets" opens
2. *No pockets*: **Given** there are none, **Then** My pockets says "No pockets yet. Make one for each thing you save for." with a "New pocket" button
3. *Create*: **When** the user taps "New pocket", types the name "Japan trip" and the starting amount 1 500,00 and saves, **Then** My pockets lists "Japan trip 1 500,00 €" and the total "1 500,00 €"
4. *No starting amount*: the starting amount may be left empty, and the pocket starts at 0,00 €
5. *Not this month's savings*: **Then** home's Savings tile, the savings goal, left to spend and Trends do not change
6. *Name required*: **Given** the name is empty or only spaces, **When** the user saves, **Then** the form says "Give the pocket a name." and saves nothing
7. *Leaving*: leaving the pocket form with unsaved changes asks before discarding, as in the other forms

---

### User Story 2 - Save into a pocket (Priority: P1)

**Why this priority**: It is how a pocket grows month after month.

**Independent Test**: Add a saving choosing a pocket, then check the pocket's balance and the month's savings.

**Acceptance Scenarios**:

1. *Choose a pocket*: **Given** the entry form is set to Savings, **Then** instead of the savings categories it shows the user's pockets to choose from, plus a "New pocket" choice
2. *Saved*: **When** the user saves 200,00 € into "Japan trip", **Then** this month's savings grow by 200,00 € as before, **And** "Japan trip" shows 1 700,00 €
3. *Pocket required*: **Given** no pocket is chosen, **Then** the form shows the hint "Pick a pocket." under the choices and saving is not possible
4. *New pocket from the form*: **When** the user taps "New pocket" in the form, creates "Car" and comes back, **Then** "Car" is among the choices, and what was typed in the form is kept
5. *Titles*: a saving with no note is titled with its pocket's name in every list
6. *Monthly savings*: a saving that repeats every month records into the same pocket each month, **And** the monthly entry form lets the user change its pocket
7. *Moving a saving*: **When** the user edits a saving and picks another pocket, **Then** both balances change accordingly

---

### User Story 3 - See and manage a pocket (Priority: P2)

**Why this priority**: The user wants to check where a balance comes from, and fix names and starting amounts.

**Independent Test**: Open a pocket, check its list, rename it, change its starting amount, and try deleting it.

**Acceptance Scenarios**:

1. *Pocket screen*: **When** the user taps "Japan trip", **Then** a screen titled "Japan trip" shows its balance, "Started with 1 500,00 €" when it has a starting amount, and its savings newest first, each opening the entry form
2. *Edit*: **When** the user taps "Edit" there, **Then** the pocket form opens with its name and starting amount, and saving updates them everywhere
3. *Delete an empty pocket*: **Given** a pocket has no savings and no monthly saving, **When** the user taps "Delete pocket" in its form and confirms, **Then** it is gone and the user is back on My pockets
4. *Cannot delete with savings*: **Given** a pocket has savings or a monthly saving, **Then** its form shows no delete button but the text "A pocket with savings can't be deleted. You can rename it."
5. *Order*: My pockets lists pockets in the order they were created

---

### User Story 4 - My savings so far move into pockets (Priority: P1)

**Why this priority**: The developer and other users already have savings in categories. Nothing may be lost.

**Independent Test**: Update from a version with savings in several categories and check the pockets created.

**Acceptance Scenarios**:

1. *Update*: **Given** before the update the user saved in Travel and Emergency fund, and a monthly saving in Investments, **When** the app updates, **Then** My pockets lists "Emergency fund", "Investments" and "Travel" in that order, each with every saving of its old category and a starting amount of 0
2. *Unused categories*: categories never used for savings become no pocket
3. *Nothing changes elsewhere*: every entry keeps its date, amount and note, and every month's figures stay the same

---

### Edge Cases

- **No income this month**: home hides the Overview, and so the link, until the month has income. My pockets never depends on the month.
- **Two pockets with the same name** are allowed. Each is its own pocket.
- **Home's savings split**: with the Savings tile selected, home shows no "By category" split, because savings have pockets, not categories. Trends shows the savings chart and goals with no category list for savings.
- **Unreadable data**: the usual "Some of your data could not be read" message shows and nothing is changed.
- **Accessibility**: each pocket row is a button reading "<name>, <balance>". The pocket choices in the form are radio buttons named after each pocket.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Pocket): A pocket has a name (required, trimmed, at most 40 characters) and a starting amount (0 or more, within the app's amount limit).
- **FR-002** (Balance): A pocket's balance is its starting amount plus every saving recorded in it, of every month.
- **FR-003** (Starting amount is not savings): The starting amount MUST NOT count in any month's savings, goal, left to spend or Trends.
- **FR-004** (Savings need a pocket): Every saving belongs to exactly one pocket. Income and expenses never do. The entry and monthly entry forms show pocket choices instead of savings categories for savings.
- **FR-005** (My pockets): Home's Overview title MUST link to "My pockets" ("See pockets ›"). It shows "Total saved" (the sum of all balances), one row per pocket in creation order, and "New pocket".
- **FR-006** (Pocket screen): It shows the balance, the starting amount when there is one, the pocket's savings newest first, and "Edit".
- **FR-007** (Delete): Only a pocket with no saving and no monthly saving can be deleted, after the shared confirmation dialog.
- **FR-008** (Migration): Updating MUST create one pocket per savings category used by any saving or monthly saving, in the categories' order (Emergency fund, Investments, Travel, Goal, Other), named after the category, with a starting amount of 0. Each saving and monthly saving goes into its category's pocket. No data may be lost or changed otherwise.
- **FR-009** (Baseline spec): `specs/001-expenses` FR-010 and FR-013 MUST describe pockets for savings.

### Key Entities

- **Pocket**: a name, a starting amount and its order of creation. Savings and monthly savings point to it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with money saved before the app sees all of it in pockets after creating them once, without entering old months.
- **SC-002**: After the update, every saving is in a pocket and every month's figures are unchanged.
- **SC-003**: A pocket's balance always equals its starting amount plus its savings, to the cent.

## Assumptions

- "Pockets" is the English name in the app, after the "bolsillos" of Colombian banking apps and Monzo's Pots.
- Pockets have no icon of their own yet; every pocket uses the savings icon.
- A saving's old category is kept in the database but no longer shown.
- Spending from a pocket is the next step. Until then a balance only grows, or changes when savings are edited or deleted.

## Out of Scope

- Spending from a pocket.
- A budget for a period with its daily pace.
- Goals per pocket, icons per pocket, moving money between pockets, and reordering pockets.
