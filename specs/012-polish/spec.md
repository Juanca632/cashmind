# Feature Specification: Polish

**Feature Branch**: `feat/012-polish`

**Created**: 2026-11-11

**Status**: Implemented

**Input**: User description: "Make the app feel polished for v1.0.0: smooth animations (the left-to-spend figure, list rows, presses, filters), short vibrations on key actions, a progress bar for the savings goal, and a clear red state when the month is overspent."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See savings progress at a glance (Priority: P1)

**Why this priority**: "150 € of 400 €" has to be read and worked out; a bar is understood at once.

**Independent Test**: Record savings in a month with a goal and look at the Savings tile.

**Acceptance Scenarios**:

1. *Partly saved*: **Given** a goal of 400,00 € and 100,00 € saved, **Then** the Savings tile shows a bar a quarter full under "of 400 €"
2. *Goal reached*: **Given** 400,00 € or more saved of a 400,00 € goal, **Then** the bar is full and the tile says "Goal reached"
3. *No goal*: **Given** a 0 % plan, **Then** the tile says "No goal" and shows no bar

---

### User Story 2 - Notice when the month is overspent (Priority: P1)

**Why this priority**: A negative figure in the same green looks like good news.

**Independent Test**: Spend more than the month allows and look at home.

**Acceptance Scenarios**:

1. *Overspent*: **Given** 20 % and an income of 1000,00 €, **When** 900,00 € are spent, **Then** the month card turns red and shows -100,00 € left to spend
2. *Back in budget*: **Given** the card is red, **When** the user deletes expenses until left to spend is 0 or more, **Then** the card is green again
3. *Exactly zero*: **Given** left to spend is 0,00 €, **Then** the card is green

---

### User Story 3 - The app feels smooth (Priority: P2)

**Why this priority**: Motion shows what changed and makes the app feel finished.

**Independent Test**: Use home, add and delete entries, filter by kind and change months, on the emulator.

**Acceptance Scenarios**:

1. *Figure changes*: **When** an entry changes left to spend, **Then** on returning home the figure runs from the old amount to the new one in under half a second, ending on the exact amount
2. *Rows*: **When** an entry is added, deleted or the list is filtered by kind, **Then** rows fade in or out and the others slide into place instead of jumping
3. *Presses*: **When** the user presses a button, tile or kind option, **Then** it shrinks slightly while pressed and springs back; an Activity row highlights its background instead
4. *Savings bar*: **When** the saved amount changes, **Then** the bar grows or shrinks smoothly to its new length
5. *Card color*: **When** the month becomes overspent or back in budget, **Then** the card fades between green and red
6. *Reduced motion*: **Given** Android's "Remove animations" setting is on, **Then** every change appears at once, with no animation

---

### User Story 4 - Feel that an action worked (Priority: P3)

**Why this priority**: A short vibration confirms a save without having to look.

**Independent Test**: Save, delete and choose options on a phone with vibration on.

**Acceptance Scenarios**:

1. *Saved*: **When** an entry or the plan is saved, **Then** the phone gives one short success vibration
2. *Deleted*: **When** the user confirms deleting an entry, **Then** the phone gives one short firm vibration
3. *Choice*: **When** the user picks a kind on the entry form or taps a tile on home, **Then** the phone gives a light tick
4. *Failure*: **When** a save fails, **Then** there is no success vibration
5. *Vibration off*: **Given** the phone's touch vibration is off, **Then** the app does not vibrate

---

### Edge Cases

- **Many entries**: animations stay smooth with a full month of entries (around 100).
- **Changing month**: switching month shows the new month's figure at once; only a change within the same month runs the figure.
- **Opening the app**: the first time home appears, the figure is shown at once, not counted up from zero.
- **Very large or very negative amounts**: the running figure never shows more digits than the final one fits.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Savings tile MUST show a progress bar filled to saved ÷ goal, capped at full, when the goal is above 0, and no bar when there is no goal.
- **FR-002**: The month card MUST be red when the month has income and left to spend is below 0, and green otherwise. A month with no income keeps asking for it (green), even if it has expenses. Nothing else on the card changes.
- **FR-003**: The left-to-spend figure MUST animate from its previous to its new value when it changes within the same month, and appear at once otherwise. The final figure is always the exact amount in cents.
- **FR-004**: Activity rows MUST animate when they appear, disappear or move; buttons, tiles and kind options MUST shrink slightly while pressed and Activity rows highlight; the savings bar and the card color MUST animate between states.
- **FR-005**: All motion MUST follow Android's reduced-motion setting.
- **FR-006**: The app MUST vibrate briefly on a successful save (success), on a confirmed delete (firm), and on choosing a kind or a tile (light tick), and never on failures. It MUST follow the phone's vibration setting.
- **FR-007**: Baseline spec 002 MUST be updated with the savings bar and the red card.

### Key Entities

- None. No data changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario above holds on the emulator.
- **SC-002**: Animations run without visible stutter on the emulator with a month of 100 entries.
- **SC-003**: Every animation finishes in under half a second.

## Assumptions

- Vibration follows Android's own touch-feedback setting; the app has no setting of its own.
- The red is the app's existing error red family, readable with white text.

## Out of Scope

- Dark mode (feature 013).
- Screen transition changes beyond Android's defaults.
- Celebrations, confetti or sounds.
- A setting to turn animations or vibration off inside the app.
