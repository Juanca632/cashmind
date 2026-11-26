# Feature Specification: Whole pesos

**Feature Branch**: `fix/032-whole-pesos`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "In Colombian pesos the daily budget and the spending pace sentence show cents; pesos have no cents."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pesos never show cents (Priority: P1)

A user who keeps the app in Colombian pesos sees whole pesos everywhere, as on their bank's app.

**Why this priority**: Figures the app works out (a share of the income, a share of the days) came out with cents, such as "$ 246.913,40".

**Independent Test**: In Colombian peso, with a 20 % plan, record an income of $ 1.234.567 on the 26th of a 30-day month and spend $ 100.000.

**Acceptance Scenarios**:

1. *Goal*: the goal is $ 246.913 (20 % rounded down to the whole peso), on home's Savings block, My plan and Trends
2. *Left to spend*: left to spend is $ 887.654 (1.234.567 − 100.000 − 246.913)
3. *Daily budget*: home says "≈ $ 177.530 / day · 5 days left" (887.654 ÷ 5 = 177.530,8, shown as whole pesos)
4. *Pace*: the spending pace sentence shows whole pesos
5. *Split*: Split's pre-filled shares are whole pesos and still add up to what is to split
6. *Other currencies*: Euro and US dollar keep showing cents exactly as before

---

### Edge Cases

- **Amounts with cents**: an amount stored with cents (typed in Euro before switching to pesos) shows without them, cut towards zero ($ 12,50 shows as $ 12; − $ 100,50 as − $ 100); its stored value does not change, and its form still shows the cents to edit.
- **Savings typed with cents**: if a saving with cents (typed in Euro before switching) leaves cents in what is to split, Split's first pre-filled share keeps them, so the shares still add up exactly; this rare case is accepted.
- **Past months**: goals in pesos are worked out again the same way, so a past month's goal and left to spend may differ from before by less than one peso.

## Requirements *(mandatory)*

- **FR-001** (Display): In Colombian peso every amount MUST be shown in whole pesos, cut towards zero; stored amounts MUST NOT change.
- **FR-002** (Goal): In Colombian peso the savings goal MUST be rounded down to the whole peso (to the cent in other currencies), everywhere it is worked out.
- **FR-003** (Split): In Colombian peso Split's pre-filled shares MUST be whole pesos, with the remainder on the first pocket with a share.
- **FR-004** (Baseline specs): `specs/002-income-plan` FR-003 and `specs/024-currency` FR-003 MUST say this.

## Success Criteria *(mandatory)*

- **SC-001**: No screen shows a peso amount with cents.
- **SC-002**: Nothing changes for Euro and US dollar.

## Assumptions

- No storage change; stored amounts keep their cents.

## Out of Scope

- Rounding stored amounts; other currencies.
