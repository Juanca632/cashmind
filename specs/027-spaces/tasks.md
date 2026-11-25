# Tasks: Spaces

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

Tests are written by the `test-writer` subagent from the spec (project rule), not by the implementation tasks.

- [X] T001 migration 10 (pocket emoji and color) and released schema 10
- [X] T002 theme `POCKET_COLORS`; ThemedText types `heroLabel`, `figure`, `figureFraction`, `tileValue`
- [X] T003 shared ui `HeroCard`, `HeroFigure`, `KindTile`/`GoalBar` extracted from home; home uses them (no visual change)
- [X] T004 entries: `Pocket` emoji/color, validation, repository reads/writes, `pocketEmoji` on entries; choices and `EntryRow` show emoji and colour
- [X] T005 pocket form: emoji field, colour choice, `show=1`, delete to home
- [X] T006 home: `space` param, `SpaceSelector`, `/spaces` sheet route
- [X] T007 home: `PocketSpace` view (hero, actions, tiles, activity, split, edit, back)
- [X] T008 remove `/pockets`, `/pocket` and "See pockets ›"; entry form savings pocket param
- [X] T009 baseline specs 001 FR-013, 003 FR-005
- [X] T010 Tests by the `test-writer` subagent for 027-spaces
- [X] T011 lint, tsc, jest; `code-reviewer`; fix BLOCKER/MAJOR

## Changes after review on the phone

- [X] T012 The selector becomes the shared `Pill` (round mark with the emoji, the name alone) centred under the hero card, the top row stays as before (month pill, My plan, gear), and the month's space is named "Main" (also in "Paid from")
- [X] T013 Tests updated by the `test-writer` subagent for T012
- [X] T014 lint, tsc, jest
