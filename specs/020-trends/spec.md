# Feature Specification: Trends

**Feature Branch**: `feat/020-trends`

**Created**: 2026-11-16

**Status**: Implemented

**Input**: User description: "A Revolut-inspired Trends screen for the last 6 months, opened from a 'See trends ›' link in home's Spending pace section. Pills pick one kind at a time (Spent, Saved, Income); a big number for the selected month with a neutral sentence against the average; 6 bars with a faint average line, tapping a bar selects that month; the selected month's categories as horizontal bars, tapping one opens its 6-month history; on Saved, each month's goal and how many months reached it; a link opens the selected month on home. Read-only, no database change, no new libraries."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the last 6 months of one kind (Priority: P1)

**Why this priority**: Home answers "how am I doing this month"; nothing answers "am I spending or saving more than before". This is the core of the screen.

**Independent Test**: With entries in known months, open Trends on a known day and check the pills, the big number, the sentence and the bars.

**Acceptance Scenarios**:

1. *Entry point*: **Given** the month shown on home has income, **Then** the "Spending pace" section shows a "See trends ›" link; **When** the user taps it, **Then** the Trends screen opens
2. *Opening state*: **When** Trends opens on 16 November 2026, **Then** the "Spent" pill is selected, the six bars are June to November 2026 (oldest left), and November is selected and highlighted
3. *Big number*: **Given** November's expenses add up to 1 240,50 €, **Then** the screen shows "November 2026" and "1 240,50 €"
4. *Average*: **Given** spent June 1 000,00 €, July 1 200,00 €, August 1 400,00 €, September 1 300,00 €, October 1 100,00 € and November 500,00 € so far, **Then** the average is the five complete months' 1 200,00 €, a faint dashed line crosses the bars at that height, a key under the chart says "Avg 1 200,00 €", and the sentence for November says "So far, 700,00 € less than your average"
5. *Past month sentence*: **Given** the same data, **When** the user taps the August bar, **Then** August is highlighted, the big number is 1 400,00 € and the sentence says "200,00 € more than your average"; the screen does not navigate
6. *About the average*: **Given** a month's total is within 5 % of the average (above or below), **Then** the sentence says "About your average"
7. *Other pills*: **When** the user taps "Saved" or "Income", **Then** the bars, big number, sentence and average are those of savings or income, and the selected month stays the same
8. *Neutral*: the sentence and bars never use red, and no wording says "good", "bad" or "over budget"
9. *Open the month*: **When** the user taps "Open August ›", **Then** home opens on August 2026
10. *Unfinished month*: the current month's bar is drawn as unfinished (a dashed outline over a light fill instead of a solid bar) and says "so far" under its month name, whether selected or not
11. *Smooth change*: **When** the pill or the selected month changes, **Then** the bars grow or shrink to their new heights instead of jumping (instantly when the phone asks to reduce motion)

---

### User Story 2 - The selected month by category (Priority: P1)

**Why this priority**: The total says "how much"; the categories say "on what", which is what people act on.

**Independent Test**: With entries in several categories, select a month and kind and check the list.

**Acceptance Scenarios**:

1. *List*: **Given** November has expenses Housing 650,00 €, Groceries 310,00 €, Eating out 180,00 € and Transport 100,00 €, **Then** under the bars a "By category" list shows those four, largest first, each with a horizontal bar proportional to its amount (the largest full) and its amount
5. *Against usual*: **Given** Groceries averaged 250,00 € over the earlier months in use and August is selected with Groceries at 310,00 €, **Then** its row also says "60,00 € more than usual"; within 5 % it says "About usual"; in the current month it starts with "So far, "; a category with no average (FR-003) shows no such line
2. *Hidden empty*: **Then** categories with no amount that month are not listed
3. *Follows selection*: **When** the user selects another month or pill, **Then** the list shows that month's categories of that kind
4. *Empty month*: **Given** the selected month has nothing of the selected kind, **Then** the big number is 0,00 € and under the "By category" title one line says "Nothing recorded this month"

---

### User Story 3 - One category's history (Priority: P2)

**Why this priority**: "Is eating out going up?" needs one category across months; it builds on Story 2.

**Independent Test**: Tap a category and check its detail.

**Acceptance Scenarios**:

1. *Open*: **When** the user taps "Groceries" while November is selected, **Then** a screen titled "Groceries" shows its six months as bars (same months as Trends) with November highlighted, its average as a faint line, and "Usually 290,00 € / month"
2. *Average*: the category's average uses the same months and rule as the kind's average (FR-003)
3. *Sentence*: **Then** under the average one sentence compares the selected month with it, worded as on Trends ("20,00 € more than usual", "About usual", or with "So far," in the current month)
4. *Back*: **When** the user goes back, **Then** Trends shows the same pill and selected month as before

---

### User Story 4 - Savings goals across months (Priority: P2)

**Why this priority**: The plan is the app's one rule; seeing how often its goal was reached closes the loop without judging.

**Independent Test**: With known incomes, plans and savings, open the Saved pill.

**Acceptance Scenarios**:

1. *Goal marks*: **Given** the Saved pill, **Then** each month that has income shows a mark at its savings goal (that month's plan percentage of that month's income, as home shows it), wider than the bar and visible whether the bar reaches it or not, and the key under the chart says "Goal"; a month with no income or a 0 % plan has no mark
2. *Count*: **Given** June to October have income and the goal was reached in June, August and October, and November's goal is not reached yet, **Then** the screen says "Goal reached in 3 of the last 6 months"
3. *Months that count*: the second number counts the months shown that have income and a goal above 0; a month counts as reached when what was saved is at least its goal, the same rule as home's "Goal reached"
4. *No goals*: **Given** no month shown has a goal above 0, **Then** the count line is not shown
5. *Only on Saved*: the marks and the count show only on the Saved pill

---

### Edge Cases

- **New user**: months before the first entry show empty bars. The average uses only months with at least one entry of any kind (months in use) before the current month; with no such month there is no average line and no sentence.
- **Only the current month in use**: no average, no sentence; the bars and categories still show.
- **Average of zero**: when the kind's average is 0,00 € (e.g. no savings in earlier months), there is no line and no sentence.
- **All bars zero**: a faint baseline runs under the six columns, so empty months read as zero, not as missing; the list says "Nothing recorded this month".
- **Bar heights**: the tallest of the six months (or the average, if higher) fills the chart height; the others are proportional.
- **Future months**: never shown; the newest bar is always the current month.
- **Changes**: after adding, editing or deleting an entry, Trends shows the new values when it is shown again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Entry point): Home's "Spending pace" section MUST show a "See trends ›" link that opens Trends; it shows only when that section shows.
- **FR-002** (Months and kinds): Trends MUST show the current month and the five months before it, as one bar per month, for one kind at a time picked with pills "Spent", "Saved", "Income" (Spent on open). The current month is selected on open; tapping a bar selects that month without navigating.
- **FR-003** (Average): The average of a kind (or of one category) MUST be its total over the months in use among the five months before the current month, divided by their count, rounded down to the cent. A month is in use when it has at least one entry of any kind. The same average is used whichever month is selected. It shows as a faint dashed line drawn over the bars, named in a key under the chart ("Avg X"); with no month in use or an average of 0 there is no line and no key.
- **FR-004** (Big number and sentence): Trends MUST show the selected month with its year ("November 2026") and its total of the selected kind, and, when there is an average, one sentence: "X more than your average", "X less than your average", or "About your average" when the difference is at most 5 % of the average; in the current month it starts with "So far, " (with a lowercase continuation). Never red, never judging words.
- **FR-005** (By category): Under the bars, a "By category" section (titled like home's sections) MUST list the selected month's categories of the selected kind that have an amount, largest first, each with a horizontal bar proportional to the largest and its amount, and, when that category has an average (FR-003), the selected month against it in the words of FR-006 ("X more than usual", "X less than usual", "About usual", with "So far, " in the current month); with none, the line "Nothing recorded this month".
- **FR-006** (Category detail): Tapping a category MUST open a screen titled with the category name, with its six months of that category within the selected kind ("Other" is separate per kind), as bars, the same selected month highlighted, its average as a faint line and as "Usually X / month", and a sentence like FR-004 using "usual" ("X more than usual", "X less than usual", "About usual"). Going back returns to Trends as it was.
- **FR-007** (Savings goals): On the Saved pill, each month with income and a goal above 0 MUST show a mark at its goal, wider than the bar and outlined so it shows on top of a filled bar, named "Goal" in the chart's key (only while at least one mark shows), and the screen MUST say "Goal reached in X of the last Y months", Y being those months and X those where saved ≥ goal; not shown when Y is 0.
- **FR-008** (Open month): Trends MUST show an "Open <Month> ›" link (the month's name only, "Open August ›") that opens home on the selected month.
- **FR-009** (Readable): Bars have no axes or grid, only a faint baseline; under each, the month's short name ("Jun"), and "so far" under the current month, whose bar is drawn unfinished (dashed outline, light fill). The highlighted bar is in the kind's color, the others are the same color faded, with at least 3:1 contrast against the card. Bars change height smoothly when the pill or month changes, instantly with reduced motion. Big amounts stay on one line, shrinking if needed. Each bar and category row MUST have an accessible label with its month or category, amount and, when there is one, the average or "usual" sentence; each bar is a button; the pills form a group; a screen reader announces the new number and sentence when the selection changes.
- **FR-010** (Read-only): Trends only reads existing entries and plans; nothing is stored.
- **FR-011** (Baseline specs): `specs/002-income-plan` FR-004 (home's month view) MUST mention the "See trends ›" link.

### Key Entities

- None stored. Month totals, category totals, averages and goals come from the entries and the plan of each month.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From home, the user sees whether this month's spending is above or below their usual in two taps or fewer.
- **SC-002**: Each bar's amount equals what home shows for that month and kind; each category's amount equals the By category view on home for that month.
- **SC-003**: The user can find which category changed most in a month against its usual without leaving Trends or opening any category (one tap per month).

## Assumptions

- The average leaves out the current month because it is not finished; months before the user started (no entries) are left out so they do not pull it down.
- "Months in use" counts any kind of entry, so a month with income but no savings counts as 0 for Saved.
- The 5 % band for "About your average" keeps the sentence from flipping on cents.
- Bars are plain views; the dashed average line uses `react-native-svg` and the height changes use `react-native-reanimated`, both already installed; no database change.

## Out of Scope

- Pie charts, Sankey diagrams, custom or longer periods, a date picker.
- Per-category budgets, forecasts of the month's end, merchants, export.
- Streaks, scores or any judging of the user.
- Tapping inside the category detail's bars to navigate.
