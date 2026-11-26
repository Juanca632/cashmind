# Feature Specification: Pocket moves only

**Feature Branch**: `feat/031-pocket-moves-only`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Pockets are only savings. Money leaves a pocket only by spending from it or by moving it to another pocket; it never goes back to Main. Moves into Main made before stay as they are."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move only between pockets (Priority: P1)

The user changes what some saved money is for, such as from a cancelled trip to investing, without touching the month.

**Why this priority**: Moving savings back into Main let the month show its goal as reached while the money was spent again; without it, what was saved stays saved.

**Independent Test**: With pockets "Travel" (600,00 €) and "Investing", open Move from Travel.

**Acceptance Scenarios**:

1. *To*: **When** the user opens Move from "Travel", **Then** To offers every other pocket and "New pocket", never "Main", with the first other pocket chosen
2. *Moved*: **When** they move 200,00 € to "Investing", **Then** Travel holds 400,00 €, Investing 200,00 € more, and none of Main's figures or lists change
3. *From changes*: **When** From is changed to the pocket chosen as To, **Then** To becomes the first other pocket
4. *One pocket*: **Given** only one pocket, **When** the user opens Move, **Then** To offers only "New pocket" and Move cannot be saved until another pocket is made and chosen
5. *Spend stays*: "Spend" from a pocket works as before and is the way to use saved money

---

### User Story 2 - Earlier moves into Main stay (Priority: P1)

The user's history does not change.

**Why this priority**: Past months must keep their figures.

**Independent Test**: Seed a move of 300,00 € from "Emergency fund" into Main last month and open both months and the move.

**Acceptance Scenarios**:

1. *Still counted*: that month's left to spend, lists and Activity show the move as before ("From Emergency fund", +300,00 €), and the pocket's list shows "To Main"
2. *Edit*: **When** the user opens it, **Then** To offers "Main" (chosen) and the other pockets; they can change its amount, date or note, or move it to a pocket instead
3. *No way back*: once saved into a pocket, it cannot be set back to Main
4. *Delete*: it can be deleted as before, after the shared confirmation

---

### Edge Cases

- **Refused writes**: a new move with no To pocket, or an edit that sets To to Main on a move that was not into Main, is refused with "Money can only move to another pocket." and nothing changes.
- **New pocket**: making a pocket from To brings the user back to the form, which then lists it.

## Requirements *(mandatory)*

- **FR-001** (To): The move form's To MUST offer only the pockets other than From, plus "New pocket"; "Main" MUST show only when editing a move that is into Main.
- **FR-002** (Default): A new move's To MUST start on the first pocket other than From, or none when there is no other pocket; a move with no To cannot be saved.
- **FR-003** (Service): Recording a move into Main MUST be refused, except keeping an existing move into Main there while editing it.
- **FR-004** (History): Moves into Main already stored MUST keep counting as described by 028 (left to spend of their month, lists, pocket balance); no data changes and no migration.
- **FR-005** (Baseline specs): `specs/001-expenses` FR-013 and `specs/002-income-plan` FR-004 MUST say that money leaves a pocket only by spending or moving it to another pocket, and that moves into Main exist only from earlier versions.

## Success Criteria *(mandatory)*

- **SC-001**: After this change, no action can raise a month's left to spend with money taken from a pocket.
- **SC-002**: Every past month shows the same figures as before the update.

## Assumptions

- The moves table keeps allowing Main (`to_pocket_id` NULL) for the stored moves; only the form and the service stop creating new ones.

## Out of Scope

- Converting or deleting stored moves into Main.
- Category budgets (money of the month with a label to spend), a separate future feature.
