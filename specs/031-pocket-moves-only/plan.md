# Implementation Plan: Pocket moves only

**Branch**: `feat/031-pocket-moves-only` | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

## Summary

The move form's To becomes a pocket choice (other pockets + "New pocket"), except when editing a move already into Main, which keeps today's Main-or-pocket choice. The entries service refuses new moves into Main. Stored moves are untouched; every rule that counts moves into Main stays.

## Technical Context

**Dependencies**: none new. **Storage**: no change.

**Testing**: service refusals (add into Main, edit into Main from a pocket, edit keeping Main); integration: To choices, default, From change, one pocket + New pocket, old Main move edit/delete, past month figures unchanged.

## Constitution Check

| Principle | Result |
| --- | --- |
| II. Simple | Pass. One fewer way to move money; no new screen. |
| Database | Pass. No migration; stored moves kept. |
| Architecture | Pass. The rule is enforced in the entries service. |

## Design

- **Service** (`src/features/entries/service.ts`): `MOVE_TO_POCKET_ONLY = 'Money can only move to another pocket.'`; `addMove` refuses `toPocketId === null`; `editMove` refuses it unless the stored move's `toPocketId` is null.
- **Move form** (`src/features/entries/screens/move-screen.tsx`):
  - `toId: number | null`; a new move starts on the first pocket ≠ From, or null;
  - a move stored into Main keeps `PaidFromChoices` (Main + others);
  - every other move uses `PocketChoices` (others, `allowNew`, label "To");
  - valid needs a To unless the move stays into Main; changing From to To picks the first other pocket.
- **Baselines**: 001 FR-013, 002 FR-004.
