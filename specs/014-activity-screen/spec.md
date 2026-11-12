# Feature Specification: Activity Screen

**Feature Branch**: `feat/014-activity-screen`

**Created**: 2026-11-12

**Status**: Implemented

**Input**: User description: "Home's Activity list shows every entry of the month inside the home scroll, so with many entries home becomes an endless scroll. Home shows only the 5 most recent entries and a See all link; See all opens an Activity screen with the full month list and the same kind filter."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Home stays short (Priority: P1)

**Why this priority**: With many entries home becomes an endless scroll, and the month card and tiles are what the user opens the app for.

**Independent Test**: Record 12 entries in one month and open home.

**Acceptance Scenarios**:

1. *Five newest*: **Given** a month with 12 entries, **When** the user opens home, **Then** the Activity list shows only the 5 newest (same order as today), **And** below them a "See all (12)" link
2. *Few entries*: **Given** a month with 5 entries or fewer, **Then** home lists all of them and shows no "See all" link
3. *Filtered*: **Given** a month with 8 expenses and the Spent tile selected, **Then** home lists the 5 newest expenses and "See all (8)"; **Given** 3 savings and the Savings tile selected, **Then** it lists the 3 and no link
4. *New entry*: **Given** home lists 5 entries, **When** the user adds a new one dated today, **Then** it appears at the top and the oldest of the 5 leaves the list, **And** the count in "See all" goes up by one

---

### User Story 2 - See the whole month (Priority: P1)

**Why this priority**: Older entries in the month must still be reachable and editable.

**Independent Test**: From a month with 30 entries, tap "See all", scroll to the oldest entry and edit it.

**Acceptance Scenarios**:

1. *Open*: **Given** home shows "See all (30)", **When** the user taps it, **Then** an Activity screen opens titled with the month (for example "Activity · November 2026") listing all 30 entries, newest first, with the same rows and day names as home
2. *Edit from Activity*: **When** the user taps an entry on the Activity screen, **Then** the entry form opens; **When** they save or delete it, **Then** they return to the Activity screen and the list shows the change
3. *Back*: **When** the user goes back from the Activity screen, **Then** home shows the same month with figures that include any changes made
4. *Past month*: **Given** the user is viewing a past month on home, **When** they tap "See all", **Then** the Activity screen lists that past month's entries
5. *Smooth*: **Given** a month with 300 entries, **Then** the Activity screen opens and scrolls without visible stutter on the phone

---

### User Story 3 - Filter by kind on the Activity screen (Priority: P2)

**Why this priority**: Looking inside one kind already works on home; the full list needs the same.

**Independent Test**: Open the Activity screen from home with the Spent tile selected, then switch filters.

**Acceptance Scenarios**:

1. *Starts on the home filter*: **Given** the Spent tile is selected on home, **When** the user taps "See all", **Then** the Activity screen opens with the Spent filter selected and only expenses listed; with no tile selected it opens on All
2. *Switch filter*: **When** the user picks All, Income, Spent or Savings on the Activity screen, **Then** the list shows only those entries (All shows every entry)
3. *Empty filter*: **Given** the month has no savings, **When** the user picks Savings, **Then** the screen says "No savings this month." (the same texts as home)
4. *Home unchanged*: **When** the user changes the filter on the Activity screen and goes back, **Then** home keeps the tile selection it had

---

### Edge Cases

- **All entries of the month deleted from the Activity screen**: the screen stays open and shows the empty text.
- **Month without income**: home shows no tiles and so no filter, but the Activity list and "See all" work the same; the Activity screen still offers the four filters.
- **Unreadable data**: the Activity screen shows the same "some data could not be read" screen as home and changes nothing.
- **Exactly 5 entries**: all 5 are listed and there is no link.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Short list on home): Home's Activity list MUST show at most the 5 newest entries of the month (in the order of 001 FR-006), after applying the selected tile filter.
- **FR-002** (See all): When the filtered list has more than 5 entries, home MUST show a "See all (N)" link below it, where N is the number of entries in that filtered list.
- **FR-003** (Activity screen): "See all" MUST open an Activity screen for the month shown on home, listing all of that month's entries with the same rows, order and day names as home, titled with the month.
- **FR-004** (Filter): The Activity screen MUST offer All, Income, Spent and Savings filters, MUST start on the filter selected on home (All when none), and MUST show the home empty texts when a filter has no entries.
- **FR-005** (Edit from Activity): Tapping an entry on the Activity screen MUST open the entry form; after saving or deleting, the Activity screen and home MUST show the change.
- **FR-006** (Large months): The Activity screen MUST stay smooth with hundreds of entries in a month.
- **FR-007** (Baseline spec): `specs/001-expenses` (FR-006, FR-009, User Stories 6 and 8) MUST be updated to describe the short home list and the Activity screen.

### Key Entities

- None. No new data; the Activity screen reads the same month entries as home.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Home never lists more than 5 entries, whatever the number of entries in the month.
- **SC-002**: Any entry of the month can be reached and opened in at most 2 taps plus scrolling from home.
- **SC-003**: With 300 entries in a month, the Activity screen opens in under 1 second and scrolls smoothly on the phone.

## Assumptions

- 5 entries is enough on home to see what was recorded lately; the number is fixed, not a setting.
- The Activity screen has no Add button; entries are added from home as today.

## Out of Scope

- Search, date ranges and sorting options.
- Lists that span several months.
- Changing the selected tile on home from the Activity screen.
- New data or database migrations.
