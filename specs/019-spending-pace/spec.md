# Feature Specification: Spending Pace

**Feature Branch**: `feat/019-spending-pace`

**Created**: 2026-11-15

**Status**: Implemented

**Input**: User description: "On home, below the tiles, a section with a chart of the month's spending day by day, to see how steep the curve is for the day of the month I'm on, against the pace of my plan. Monthly fixed costs are always there, so they must be handled: both the curve and the pace line start from the fixed costs recorded on the 1st. The tiles get a section title like Activity has."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the month's spending pace (Priority: P1)

**Why this priority**: "Left to spend" says how much is left, not whether spending is going too fast for the day of the month; a curve against the plan's pace shows it at a glance.

**Independent Test**: With a known income, plan, fixed costs and expenses, open home on a known day and check the chart and its sentence.

**Acceptance Scenarios**:

1. *Section*: **Given** the month has income, **Then** home shows a "Spending pace" section below the tiles and above Activity, with a chart and one sentence
2. *Spending curve*: **Given** November has Rent 900,00 € repeating (recorded on the 1st) and expenses of 100,00 € on the 3rd and 240,00 € on the 10th, **When** the user opens home on 14 November, **Then** the curve shows the month's expenses added up day by day: 900,00 € from the 1st, 1 000,00 € from the 3rd, 1 240,00 € from the 10th, ending at today
3. *Pace line*: **Given** income 2 000,00 € and a 20 % plan (goal 400,00 €), **Then** the pace line goes in a straight line from 900,00 € at the start of the 1st (the month's repeating expenses) to 1 600,00 € at the end of the 30th (income minus the goal, the money the plan lets the month spend); at the end of day d it is 900,00 € + 700,00 € × d ÷ 30
4. *Sentence, under*: **Given** the pace on 14 November is 1 226,66 € (900,00 € + 700,00 € × 14 ÷ 30, rounded down to the cent) and 1 240,00 € was spent, **Then** the sentence says "13,34 € over your pace"; **Given** 1 200,00 € was spent instead, **Then** it says "26,66 € under your pace"; **Given** the same amount, **Then** it says "Right on your pace"
5. *Savings above the goal*: **Given** the user saved 500,00 € with a 400,00 € goal, **Then** the line ends at 1 500,00 € (income minus the larger of the goal and what was saved, as "Left to spend" counts it)
6. *No fixed costs*: **Given** nothing repeats, **Then** the pace line starts at 0 € on the 1st
7. *Past month*: **Given** the user is viewing a past month with income, **Then** the chart shows the whole month's curve and line, and no sentence
8. *No income*: **Given** the month has no income, **Then** the section is not shown
9. *Follows changes*: **When** the user adds, edits or deletes an expense, **Then** the curve and the sentence update when home shows again

---

### User Story 2 - Titled sections on home (Priority: P2)

**Why this priority**: Home now has several blocks; a title per block makes them easy to tell apart.

**Independent Test**: Open home with income and check the titles.

**Acceptance Scenarios**:

1. *Titles*: **Given** the month has income, **Then** the tiles have the title "Overview", the chart "Spending pace" and the list "Activity" (as today), in the same style
2. *No income*: **Given** the month has no income, **Then** neither "Overview" nor "Spending pace" is shown

---

### Edge Cases

- **Fixed costs above the budget**: when the month's repeating expenses are more than income minus the goal, the line is flat at the fixed costs.
- **Days with no expenses**: the curve is flat across them; it rises only across a day that has expenses (from that day's start to its end).
- **First day**: the curve is one point; the sentence compares it with the line's start.
- **Savings and income**: never part of the curve; only expenses are.
- **Entries edited to another day**: the curve follows the entries' dates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Curve): For a month with income, home MUST show the month's expenses added up by day, as a line through the total at the end of each day, from the 1st to today in the current month or to the last day in a past month.
- **FR-002** (Pace line): The chart MUST show a straight line from the month's expenses linked to a repeating item (recorded or marked, see 018) at the start of the 1st, to income minus the larger of the goal and what was saved at the end of the month's last day; at the end of day d of an N-day month it is start + (end − start) × d ÷ N, rounded down to the cent. It never goes down: when the start is higher than the end, it is flat at the start.
- **FR-003** (Sentence): In the current month, above the chart, one sentence MUST compare spent so far with the line's value at the end of today: "X over your pace", "X under your pace" or "Right on your pace", in the regular text color, never red.
- **FR-004** (Readable): In the current month the sentence (FR-003) MUST head the chart; the amount spent is not repeated there, since the Spent tile shows it. The chart has no axes or guide lines; under it, the month's first and last day ("1 Nov", "30 Nov"). The curve is drawn as one line through the total at the end of each day, with a soft fill below it; the pace line is faint and dashed. The chart MUST have an accessible description with the amount spent so far and the pace value today (current month) or the month's total and the line's end (past month), and the line's start and end amounts.
- **FR-005** (Titles): Home MUST title the tiles "Overview" and the chart "Spending pace", in the same style as "Activity"; neither shows without income.
- **FR-006** (Baseline specs): `specs/002-income-plan` FR-004 (home's month view) MUST be updated.

### Key Entities

- None stored. The curve and line come from the month's entries and plan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Whether spending is ahead of or behind the plan can be read from home with no tap.
- **SC-002**: The curve's last point always equals the "Spent" tile; the line's end always equals what "Left to spend" counts as spendable.

## Assumptions

- The chart is drawn with `react-native-svg` (included in Expo Go), approved by the developer on 2026-11-15.
- Colors: the curve in the expense kind's color, the line dashed in the secondary text color; no red, also when over the pace.

## Out of Scope

- The "See trends" link and a trends screen with more charts (feature 020).
- Charts for income or savings, other time ranges, or tapping the chart.
- Projections of the month's end.