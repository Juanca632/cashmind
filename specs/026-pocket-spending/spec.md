# Feature Specification: Spending from a pocket

**Feature Branch**: `feat/026-pocket-spending`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "An expense can be paid from a pocket instead of the month: on a trip the user spends what they saved for it. It is recorded from the pocket's screen ("Spend from this pocket") or from the expense form ("Paid from"). It lowers the pocket's balance and keeps its normal category, but counts in no month figure: not in Spent, left to spend, the spending pace, the daily budget or Trends. It still shows in the month's lists, marked with its pocket. A pocket may go below zero, and it then shows in red. Out of scope: a budget for a period with its pace (next step), moving money between pockets, income into a pocket."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pay a trip expense from its pocket (Priority: P1)

The user saved for a trip in a pocket. During the trip they spend from it. Those expenses must not make the month look overspent.

**Why this priority**: It is the reason for pockets.

**Independent Test**: With a pocket holding money, record an expense from it and check the pocket and the month's figures.

**Acceptance Scenarios**:

1. *From the pocket*: **Given** "Japan trip" holds 1 700,00 €, **When** the user opens it and taps "Spend from this pocket", **Then** the expense form opens with kind Expense and "Paid from" set to "Japan trip"
2. *Recorded*: **When** they record a dinner of 35,00 € in Eating out and save, **Then** "Japan trip" shows 1 665,00 €, **And** its screen lists the dinner
3. *Not this month's spending*: **Then** home's Spent tile, left to spend, the daily budget, the spending pace, the "By category" split and Trends are the same as before the dinner
4. *Still in the month's lists*: **Then** home's list and Activity show the dinner on its day, marked "from Japan trip", with its amount
5. *From the expense form*: **Given** the user adds an expense from home, **When** they pick "Japan trip" under "Paid from" and save, **Then** the result is the same as recording it from the pocket
6. *Default*: in the expense form "Paid from" starts on "This month", and an expense paid from the month behaves exactly as before
7. *Change later*: **When** the user edits an expense and switches "Paid from" between "This month" and a pocket, **Then** the month's figures and the pocket's balance change accordingly
8. *No pockets*: **Given** the user has no pocket, **Then** the expense form shows no "Paid from" choice

---

### User Story 2 - See what a pocket spent, and when it runs out (Priority: P2)

**Why this priority**: On a trip the user wants to see where the money went and notice when the pocket is empty.

**Independent Test**: Open a pocket with savings and spending, and overspend another one.

**Acceptance Scenarios**:

1. *Balance*: a pocket's balance is its starting amount plus its savings minus the expenses paid from it
2. *In and out*: the pocket screen shows "Saved <amount> · Spent <amount>" under the balance when anything was spent from it, and lists savings and expenses together, newest first
3. *By category*: when something was spent from the pocket, its screen shows "Spent by category" with each category's amount and share, largest first, like home's split
4. *Overspent*: **Given** "Car" holds 100,00 €, **When** the user pays 150,00 € from it, **Then** it is saved, **And** "Car" shows "-50,00 €" (as the currency formatter writes it) in red on My pockets and on its screen, with "This pocket is 50,00 € short." under the balance
5. *Total*: My pockets' "Total saved" adds up the balances, negative ones included

---

### Edge Cases

- **Monthly expenses from a pocket**: an expense that repeats every month can be paid from a pocket, and each month's entry is paid from it too. The monthly entry form offers the same "Paid from" choice. My plan's "Fixed costs" leaves them out, because they are not the month's money.
- **Quick add** suggestions (021) only learn from expenses paid from the month.
- **Deleting a pocket**: a pocket with savings or with expenses paid from it cannot be deleted. Its form says "A pocket with savings or spending can't be deleted. You can rename it."
- **Income** is never paid from or into a pocket.
- **Accessibility**: an expense paid from a pocket reads "<title>, <day>, <amount>, from <pocket>". The "Paid from" choices are radio buttons.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Paid from): An expense MUST be paid either from the month (the default) or from one pocket. Savings always belong to a pocket (025), and income never has one.
- **FR-002** (Recording): The pocket screen MUST offer "Spend from this pocket", which opens the expense form with that pocket chosen. The expense form MUST show "Paid from" with "This month" and every pocket, when there is at least one pocket.
- **FR-003** (Out of the month): Expenses paid from a pocket MUST NOT count in Spent, left to spend, the daily budget, the spending pace, home's split, Trends, My plan's fixed costs or quick add. Every other figure stays as it was.
- **FR-004** (Lists): They MUST still show in home's list, Activity and the pocket's screen, marked "from <pocket>".
- **FR-005** (Balance): A pocket's balance is its starting amount plus its savings minus its expenses. It may go below zero, and then shows in red with "This pocket is <amount> short.".
- **FR-006** (Pocket screen): It MUST show "Saved … · Spent …" and "Spent by category" when it has spending, and list every entry of the pocket.
- **FR-007** (Storage): An expense paid from a pocket stores that pocket like a saving does. No database change is needed.
- **FR-008** (Baseline specs): `specs/001-expenses` FR-013 and `specs/002-income-plan`, where they define left to spend, MUST say that expenses paid from a pocket are left out.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A week of trip expenses paid from a pocket leaves home's month figures unchanged.
- **SC-002**: A pocket's balance equals starting + savings − spending, to the cent.
- **SC-003**: Paying from a pocket takes the same taps as a normal expense, plus one choice.

## Assumptions

- An overspent pocket is allowed, because the money was really spent. The red balance is the warning.
- The category of a pocket expense only shows inside the pocket, so month and Trends figures always add up.

## Out of Scope

- A budget for a period with its pace (next step).
- Moving money between pockets, and income into a pocket.
