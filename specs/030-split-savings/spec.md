# Feature Specification: Split savings

**Feature Branch**: `feat/030-split-savings`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Give the month's savings goal a clear place. A card on home says how much of the goal is still to split into pockets, and one screen splits it across the pockets, pre-filled like last month. Repeating savings are removed: this screen is how the month's savings are made."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See what is still to save this month (Priority: P1)

The user records the month's income and wants to know where the money the plan sets aside is meant to go.

**Why this priority**: Today the goal is subtracted from left to spend but lives nowhere; the block gives it a place and a next step.

**Independent Test**: With a 20 % plan, record 2000,00 € of income in the current month and open home.

**Acceptance Scenarios**:

1. *Block*: **Given** a 20 % plan and 2000,00 € of income this month with no savings, **Then** Overview shows the Income and Spent tiles side by side and, under them, one wide Savings block tinted like them: "Savings", "0 € of 400 €", the goal bar, and a strip filled with the savings colour saying "400,00 € to split" and "Split ›"; tapping the block opens Split
2. *Partly saved*: **Given** the same month with 250,00 € saved, **Then** the block says "250 € of 400 €" with the bar a little over half full, and "150,00 € to split"
3. *Done*: **Given** savings this month of 400,00 € or more, in 3 pockets, **Then** the block says "✓ In 3 pockets" (the number of pockets with a saving this month; "1 pocket" when one), with a full bar, and does nothing when tapped
4. *No split offered*: in a past month the block shows saved of goal and the bar only; with a 0 % plan it shows what was saved and "No goal", without a bar; in both it does nothing when tapped. The savings of the month are listed with Activity's Savings filter.

---

### User Story 2 - Split it across pockets (Priority: P1)

The user taps "Split" and puts the amount into one or more pockets in one go, usually just confirming last month's split.

**Why this priority**: It is how the month's savings get a place; without it the card is only a reminder.

**Independent Test**: With pockets Emergency, Travel and Investing and last month's savings of 200 / 100 / 100, open Split this month with 500,00 € to split.

**Acceptance Scenarios**:

1. *Screen*: **When** the user taps "Split", **Then** a screen "Split savings" shows a savings-tinted card with "500,00 € to split", a bar filled to what is typed ÷ what is to split and the counter, then under "Pockets" (with a "New pocket" pill) one row per pocket in the pockets' order (emoji, name, what it already got this month when anything, an amount field)
2. *Same proportions as last month*: **Given** last month's savings were 200 / 100 / 100 (50 % / 25 % / 25 %), **Then** the fields are pre-filled with 250,00 / 125,00 / 125,00
3. *Rounding*: each share is rounded down to the cent and what is left over goes to the first pocket with a share, so the fields always add up to the amount to split
4. *No earlier split*: **Given** no earlier month has savings, **Then** every field is empty and the counter says "Split 0,00 € of 500,00 €"
5. *Change it*: **When** the user changes the fields to 300 / 0 / 200, **Then** the counter says "Split 500,00 € of 500,00 €"
6. *Save*: **When** the user taps Save, **Then** one saving is recorded per pocket with an amount above 0, dated today, without a note; the screen closes and home shows the card's new state
7. *Less than the goal*: **When** the fields add up to less than the amount to split, **Then** saving is allowed and the card then shows what is still to split
8. *More than the goal*: **When** the fields add up to more than the amount to split, **Then** Save asks first in the shared dialog: "You save 50,00 € more than your plan. Your left to spend drops by 50,00 €." and records only after the user confirms
9. *Nothing typed*: **When** every field is empty or 0, **Then** Save is not possible
10. *Leaving*: **Given** the user changed a field, **When** they leave without saving, **Then** the app asks before discarding the changes

---

### User Story 3 - No more repeating savings (Priority: P2)

The month's savings are made with Split, so savings no longer repeat on their own.

**Why this priority**: Two ways of making the month's savings would make the card and the screen ambiguous.

**Independent Test**: Open the entry form for a saving, then open My plan, on a phone that had a repeating saving.

**Acceptance Scenarios**:

1. *Switch*: **When** the entry form's kind is Savings, **Then** it does not show "Repeat every month"; for income and expenses it shows as before
2. *Add from My plan*: **When** the user taps Add under "Every month", **Then** the entry form offers only Expense and Income
3. *Existing repeating savings*: **Given** a repeating saving from an earlier version, **When** a new month starts, **Then** it is not recorded, and My plan's "Every month" section does not list it
4. *History kept*: savings recorded earlier by a repeat stay as they are, with their repeat icon
5. *Empty pocket*: **Given** a pocket with no saving, expense or move but an old repeating saving, **When** the user deletes it, **Then** it is deleted, together with that repeating saving

---

### Edge Cases

- **Which month is "last month"**: the most recent earlier month with savings, as home already does to offer repeating the last income. Its proportions use each pocket's total savings in that month.
- **No pockets**: the screen shows only "New pocket"; after creating one the user comes back to the screen and it lists it.
- **A pocket created this month**: it shows with an empty field (it had no share last month).
- **Savings made elsewhere**: savings recorded from a pocket's "Save" or the entry form count in the card like any other; the screen never changes or deletes existing savings. Correcting a saving is done on the saving itself, as today.
- **Income changes later**: if income goes up after splitting, the card shows what is now still to split; if it goes down, the card says the goal is done.
- **Amounts**: each field takes 0 or more in the chosen currency, within the app's amount limit; the counter and the dialog use the currency's format.
- **Accessibility**: each field reads "<pocket> amount"; the counter reads as text.

## Requirements *(mandatory)*

- **FR-001** (Savings block): When the month has income, home's Overview MUST show the Income and Spent tiles and, under them, one wide Savings block replacing the Savings tile: what was saved against the goal (only what was saved, and "No goal", with a 0 % plan), the goal bar when the goal is above 0, and, in the current month, "<to split> to split" and "Split ›" in a strip filled with the savings colour while to split = goal − the month's savings is above 0, or "✓ In <N> pockets" once saved reaches the goal. Only while something is left to split does tapping it open Split.
- **FR-002** (Split screen): "Split" MUST open a screen with the amount to split, one amount field per pocket in the pockets' order (with what the pocket already got this month), a "New pocket" pill, the live counter "Split <sum of fields> of <to split>" and a bar filled to that ratio.
- **FR-003** (Pre-fill): The fields MUST be pre-filled with the amount to split shared out in the proportions of each pocket's savings in the most recent earlier month with savings, each rounded down to the cent, with the remainder added to the first pocket that has a share; pockets with no share, or no such month, start empty.
- **FR-004** (Save): Saving MUST record one saving per pocket with an amount above 0, dated today with no note, and MUST NOT change or delete any existing entry. It needs a sum above 0; a sum above the amount to split MUST first ask in the shared dialog with the extra amount; leaving with changes MUST ask before discarding them.
- **FR-005** (No repeating savings): The "Repeat every month" switch MUST show only for income and expenses, and adding from My plan's "Every month" MUST offer only Expense and Income. Repeating savings that already exist MUST NOT be recorded in any new month or listed in My plan, and their stored data MUST stay unchanged, except that one no entry points to MUST NOT keep its pocket from being deleted and is deleted with it (developer approved, 2026-11-26).
- **FR-006** (Baseline specs): `specs/002-income-plan` FR-004 (the Savings block on home) and FR-005 (My plan lists repeating income and expenses only), and `specs/001-expenses` FR-001/FR-009/FR-011 (only income and expenses repeat) and FR-013 (the month's savings are split from home) MUST be updated.

## Success Criteria *(mandatory)*

- **SC-001**: On a normal month the user makes the month's savings with two taps from home (Split, Save) when last month's split still fits.
- **SC-002**: The pre-filled fields always add up exactly, to the cent, to the amount to split.
- **SC-003**: Home always says whether the month's goal is still to split or done, and how much.

## Assumptions

- Savings stay normal saving entries in their pocket; no database change and no migration. The only data removed is an unused old repeating saving, when its empty pocket is deleted.
- Left to spend, the goal, Saved and Trends keep their current rules (002 FR-004); the card only shows them differently.
- The card uses the existing shared components (`Card`, `Button`/`Pill`) and the dialog is the shared confirmation dialog.

## Out of Scope

- Moving real money or connecting to a bank.
- Removing "Move to Main" (a later step).
- Past months, and splitting from a pocket's space.
- Saving automatically without the user tapping Save; editing or merging existing savings from the Split screen.
- Saved split templates or per-pocket goals.
