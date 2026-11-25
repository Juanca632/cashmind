# Feature Specification: Pocket balance chart

**Feature Branch**: `feat/029-pocket-balance-chart`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "In each pocket, a small chart like the spending pace chart, showing how the pocket's money moved this month: how it went up and down."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how a pocket moved this month (Priority: P1)

The user opens a pocket and wants to see at a glance whether it grew or shrank this month, and when.

**Why this priority**: The balance alone does not say how it got there.

**Independent Test**: Give a pocket savings, expenses and moves on different days of this month and open its space.

**Acceptance Scenarios**:

1. *Section*: **Given** home shows "Japan trip", **Then** right after its round actions (Save, Spend, Move) a section "This month" holds a card with a sentence and a chart, in the same quiet style as Main's spending pace (one line with a soft fill, a dot on the last point, no axes, "1 Nov" and "30 Nov" under it)
2. *Line*: the line starts on the 1st at what the pocket held at the end of last month, and after each day of this month up to today it shows the pocket's balance at the end of that day: savings into it raise it, expenses paid from it and moves out lower it, moves in raise it
3. *Reference*: a faint dashed flat line marks where the month started, so going up or down reads at a glance
4. *Sentence*: the card says "Up 250,00 € this month", "Down 50,00 € this month" or "No change this month", from the start of the month to today
5. *Below zero*: when the balance goes below zero the line goes below the start as for any other value; the chart's range covers every value drawn
6. *Nothing this month*: with no savings, expenses or moves this month, the line is flat at the start and the sentence says "No change this month"

---

### Edge Cases

- **Starting amount**: a pocket's starting amount was there before the app, so it counts in what the pocket held before this month.
- **New pocket this month**: it starts the month at its starting amount (0 when none).
- **Accessibility**: the chart reads "Balance this month: from <start> on the 1st to <today's balance> today. <sentence>".
- **Only the current month**: the chart always shows the current month; a pocket has no month to pick.

## Requirements *(mandatory)*

- **FR-001** (Chart): A pocket's space MUST show the "This month" card with the sentence and the chart described in Story 1, right after its round actions.
- **FR-002** (Values): The value at the end of day d is the pocket's balance counting its starting amount and every saving, expense paid from it and move dated up to day d; the start is the balance counting everything dated before this month.
- **FR-003** (Look): The chart uses the same style, sizes and colours as the spending pace chart, with the savings colour for the line.

## Success Criteria *(mandatory)*

- **SC-001**: The chart's last point always equals the balance shown on the pocket's card, to the cent.
- **SC-002**: The user can tell from the pocket's space alone whether it grew or shrank this month.

## Assumptions

- The chart is drawn with the app's existing chart library; no new dependency.

## Out of Scope

- Picking another month, a longer range, tapping or scrubbing the chart, a goal line.
