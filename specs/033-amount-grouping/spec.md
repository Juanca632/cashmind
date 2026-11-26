# Feature Specification: Amount grouping

**Feature Branch**: `feat/033-amount-grouping`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "When I type a big amount, the field shows no separator for thousands or millions, so it is hard to read."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a big amount while typing it (Priority: P1)

The user types an amount and sees it grouped by thousands, as the app shows amounts everywhere else.

**Why this priority**: "1500000" is easy to mistype by a zero; "1.500.000" is not.

**Independent Test**: In each currency, type 1500000 into the entry form's amount.

**Acceptance Scenarios**:

1. *Pesos*: typing 1500000 shows "1.500.000"
2. *Euro*: typing 1500000,5 shows "1 500 000,5"; typing "." as the decimal mark shows "," instead ("12.5" → "12,5")
3. *Dollar*: typing 1500000.5 shows "1,500,000.5"
4. *As you type*: each digit regroups the amount ("1 234", then "12 345"), and deleting a digit regroups it too
5. *Two decimals*: a third decimal is not added ("12,345" in Euro stays "12,34")
6. *Leading zeros*: "007" shows "7"; ",5" shows "0,5"
7. *Editing*: an existing amount opens grouped ("1 234,50", "$1,234.50" as "1,234.50", "1.234.567")
8. *Saved value*: what is saved is the amount typed, whatever the separators
9. *Never cut*: **When** the user types digit after digit in the entry form's big amount, **Then** the whole amount stays in view: no digit is cut off on either side, and past 9 characters the figure gets smaller so it still fits
10. *Everywhere*: the entry form, the monthly entry form, a pocket's starting amount, Move and each of Split's fields behave the same

---

### Edge Cases

- **Dollar comma**: in US dollar "," only separates thousands and is never read as the decimal mark (so deleting a digit of "12,345" gives "1,234", not 12.34); the decimal mark is ".".
- **Not an amount**: text that is not an amount stays as typed and the field says so, as today.
- **Limit**: the field leaves room for 900 000 000,00 with its separators; larger amounts show "This amount is too large." as today.

## Requirements *(mandatory)*

- **FR-001** (Grouping): Every amount field MUST rewrite what is typed with the currency's thousands separator (Euro " ", US dollar ",", Colombian peso ".") and its own decimal mark (Euro ",", US dollar ".", Colombian peso ","), at most two decimals and no leading zeros.
- **FR-002** (Reading): The amount read MUST be the same with or without separators. Euro also reads "." as the decimal mark when it is followed by at most two digits at the end; US dollar reads "," only as a thousands separator.
- **FR-003** (Editing): An existing amount MUST open grouped the same way.
- **FR-004** (Baseline spec): `specs/024-currency` FR-004 MUST describe this.
- **FR-005** (In view): The big amount field MUST be as wide as its text, and past 9 characters its font MUST shrink in proportion (full size × 9 ÷ length), so no part of the amount is ever scrolled out of view.

## Success Criteria *(mandatory)*

- **SC-001**: Any amount up to 900 000 000 reads at a glance in every amount field.
- **SC-002**: No stored amount changes.

## Assumptions

- No storage change.

## Out of Scope

- Grouping the percentage on My plan; changing the keyboards.
