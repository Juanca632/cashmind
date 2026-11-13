# Feature Specification: Design Tokens

**Feature Branch**: `feat/016-design-tokens`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Styles are scattered: every screen picks its own padding, gaps and control sizes, and the same pill style is copied in several places. Centralize the styles so the whole app looks symmetric and coherent, building new screens is easier, and a style changes in one place. The home Add pill looks too padded, and the See all / Back to current month buttons and the gaps around them do not match the rest."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every screen has the same rhythm (Priority: P1)

**Why this priority**: Different margins and gaps between screens are what makes the app look uneven.

**Independent Test**: Open home, Activity, the entry form, My plan, the month picker and the "data could not be read" screen and compare their side margins and the gaps between blocks.

**Acceptance Scenarios**:

1. *Side margin*: **Then** every screen has the same side margin
2. *Between blocks*: **Then** the space between blocks (month card, tiles, a section, a button row) is the same on every screen, and the space inside a block (a title and its content, list rows, a label and its value) is the same everywhere
3. *Cards*: **Then** every card (Activity list, By category, My plan's percentage, the kind tiles) has the same inner padding and corner radius

---

### User Story 2 - One look for each kind of control (Priority: P1)

**Why this priority**: The same control must look the same wherever it appears.

**Independent Test**: Compare the Add pill and the month pill on home, the Activity filters, the category options in the form and the pills on the month card.

**Acceptance Scenarios**:

1. *Pills*: **Then** every pill (Add, month, My plan, Show all filters, category options, Add income / Repeat on the month card) has the same height, inner padding, text size and icon size; they differ only in colors
2. *Compact but easy to tap*: **Then** pills look more compact than today, **And** each one still reacts to a touch anywhere in an area of at least 48 × 48 points
3. *Buttons*: **Then** every full-width button (Add expense, Save plan, Delete, Back to current month, dialog buttons) has the same height and text style
4. *Links*: **Then** small text actions (Show all, See all) look the same and sit at the same distance from what they refer to

---

### User Story 3 - Home's bottom actions fit the layout (Priority: P2)

**Why this priority**: The developer pointed at these as the most visibly off.

**Independent Test**: Open a month with more than 5 entries, then a past month, and look at the bottom of home.

**Acceptance Scenarios**:

1. *See all*: **Given** more than 5 entries, **Then** "See all (N)" is the standard full-width secondary button right below the Activity card, at the same distance as any title from its content; tapping it opens the Activity screen as today
2. *Back to current month*: **Given** a past month, **Then** "Back to current month" is a standard button separated from the Activity section by the same space as any other block

---

### User Story 4 - Styles change in one place (Priority: P1)

**Why this priority**: This is what keeps the app coherent from now on.

**Independent Test**: Change the side-margin value in the shared theme and check every screen follows; run lint on a screen with a hard-coded padding.

**Acceptance Scenarios**:

1. *One value, every screen*: **When** a developer changes a spacing or size value in the shared theme, **Then** every screen that uses it changes, with no screen keeping its own copy
2. *Guard*: **When** a screen or component sets a padding, margin, gap or minimum height with a plain number or by adding spacing values together, **Then** lint reports it and points to the shared values

---

### User Story 5 - One rule for shadows (Priority: P2)

**Why this priority**: Shadows were decided one component at a time; the month card, the most important element, had none.

**Independent Test**: Look at home in light mode: the month card, a button, an action pill, a filter, a card and a tile.

**Acceptance Scenarios**:

1. *Three levels*: **Then** information surfaces (cards, filter and category pills) are flat; things you press (buttons, the Add / month / My plan pills, the kind tiles on home) are raised with a soft shadow; the month card has its own, stronger shadow, and the pills on it (Add income, Repeat) are flat because the whole card already floats and they are see-through on its gradient
2. *Month card*: **Then** the month card casts a soft green shadow, **And** while the month is overspent the shadow is red like the card
3. *Dark mode*: **Then** shadows are dark and subtle, and surfaces stand apart by their color
4. *One place*: **When** a developer changes a level's shadow in the shared theme, **Then** every element at that level changes

---

### User Story 6 - Content fades before the system bars (Priority: P3)

**Why this priority**: The app draws behind Android's status and navigation bars; without a fade, scrolling content mixes with the bars' buttons.

**Independent Test**: Scroll a long screen with 3-button navigation, and scroll home up under the status bar.

**Acceptance Scenarios**:

1. *Bottom*: **When** content scrolls under the navigation bar on any scrolling screen, **Then** it fades into the background over the bar itself, the fade exactly as tall as the bar
2. *Top*: **When** home's content scrolls under the status bar, **Then** it fades the same way; screens with a header need no top fade
3. *Themes*: **Then** the fade uses the background color of the current theme
4. *Touch*: **Then** the fades never block a tap on what is under them

---

### Edge Cases

- **Larger phone font size**: pills and buttons grow with their text instead of cutting it.
- **Dark mode**: unchanged colors; only spacing and sizes move.
- **Month card**: keeps its own large look (its size and big figure are part of its identity), but its padding and pills use the shared values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Shared layout values): The app MUST define, in one shared place, the side margin of screens, the space between blocks, the space inside a block, the card padding and the control sizes, and every screen MUST use them.
- **FR-002** (One pill): All pills MUST be one shared control with one height, padding, text and icon size, varying only by colors and selected state. Its visible height MAY be under 48 points but its touch area MUST be at least 48 × 48.
- **FR-003** (One button and one link): Full-width buttons and small text links MUST each be one shared control with one size.
- **FR-004** (Home bottom): "See all (N)" MUST be a standard secondary button below home's Activity card, separated from it by the inside-a-block spacing; "Back to current month" a standard button, separated by the block spacing.
- **FR-005** (Guard): Lint MUST reject plain numbers and sums of spacing values for padding, margin, gap and minimum height in screens and components, outside the shared theme.
- **FR-007** (Elevation): Shadows MUST come from three shared levels (flat, raised, hero) defined once per theme: flat for information surfaces, raised for buttons, action pills and the kind tiles, hero for the month card (green, red while overspent). Pills on the month card are flat: the card carries the shadow.
- **FR-008** (Edge fades): Every scrolling screen MUST fade its content into the background before the navigation bar, and home also before the status bar, with one shared component exactly as tall as each bar.
- **FR-006** (Same look, standardized): Every action, text, accessibility label and flow MUST stay as today, and every screen MUST look as before apart from unifying values that differed by a few points, the less padded pills and the same side margin everywhere. Values that a screen needs on purpose (larger gaps on calm screens, a larger card for one big figure, tighter tiles) MUST be named tokens, not removed.

### Key Entities

- None. No data changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every screen uses the same side margin and block spacing (one value each).
- **SC-002**: Zero hard-coded spacing or minimum-height numbers in screens and components (lint passes).
- **SC-003**: Every existing test passes without changing what it asserts.

## Assumptions

- Values: side margin 16, between blocks 16 (24 on calm screens), inside a block 8, tight (label to value) 4, card padding 16 (24 for one big figure, 12 for the kind tiles), pill visible height 40, button 56, field and compact button 48, list row 62.
- Font sizes are already shared (text types) and stay as they are.

## Out of Scope

- New colors, fonts or a visual redesign.
- New screens or features.
- A component library beyond what the current screens use.
