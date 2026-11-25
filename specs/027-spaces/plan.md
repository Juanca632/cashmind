# Implementation Plan: Spaces

**Branch**: `feat/027-spaces` | **Date**: 2026-11-25 | **Spec**: [spec.md](./spec.md)

## Summary

Home shows one space at a time. Which one is chosen by the route param `space`: none or `''` means "Main" (the month), and a pocket id means that pocket. A selector pill centred under the hero card opens a sheet over home. The sheet is a `Modal` like the shared confirmation dialog, with no drag and no route, and lists the spaces. The pocket view is composed in `home` from parts extracted out of home into `src/shared/ui`: `HeroCard`, `HeroFigure` and `KindTile`. Pockets gain an emoji and a palette colour in migration 10. The `/pockets` and `/pocket` routes are removed, and `/pocket-edit` stays. The top row stays as it was.

## Technical Context

**Dependencies**: none new.

**Storage (migration 10)**:
```sql
ALTER TABLE pocket ADD COLUMN emoji TEXT NOT NULL DEFAULT '' CHECK (length(emoji) <= 8);
ALTER TABLE pocket ADD COLUMN color TEXT NOT NULL DEFAULT 'blue'
  CHECK (color IN ('blue','indigo','purple','pink','orange','amber','green','slate'));
UPDATE pocket SET color = CASE (id - 1) % 8 WHEN 0 THEN 'blue' … WHEN 7 THEN 'slate' END;
```

**Testing**:
- **Unit tests**: pocket validation with emoji and colour.
- **Migration test**: from schema 9 to 10.
- **Integration tests**: the selector, the sheet, switching, back, the pocket view and its actions, and the form fields.
- Existing tests of `/pockets` and `/pocket` move to the home pocket view.
- **E2E**: the existing add-entry flow is unaffected. The `e2e-tester` checks the sheet and the colours by eye.

## Constitution Check

| | |
| --- | --- |
| II. Simple | One screen for every space. The sheet holds no drag and no text field. |
| Migrations | Step 10 only adds columns, so data is kept. Schema 10 goes in `released-schemas.ts`, with an upgrade test. |
| Architecture | `home` composes the spaces, which it may do because it combines features. Shared visuals go in `src/shared/ui`. |
| Styles | Moving the hero to shared text types (`heroLabel`, `figure`, `figureFraction`, `tileValue`) removes home's raw font sizes. Pocket colours are theme tokens. |
| Baseline | 001 FR-013 and 003 FR-005 are updated. |

## Design

### Theme (`src/shared/theme/theme.ts`)

- `POCKET_COLORS: Record<PocketColor, { base: string; gradient: string }>` has 8 deep colours that are the same in both themes and readable under `Hero.text`, like the month card.

### Shared UI

- **`hero-card.tsx`**: `HeroCard({ overspent, tone?, children })`. It holds the shadow, the rounded gradient card and the fading red layer. `tone` defaults to the month's green.
- **`hero-figure.tsx`**: `HeroFigure({ label, cents, countKey, detail, accessibilityLabel })`. It holds the count-up, the whole and fraction split, the label and the detail line.
- **`kind-tile.tsx`**: `KindTile` and `GoalBar`, unchanged in behaviour.
- **`ThemedText`** gains the types `heroLabel`, `figure`, `figureFraction` and `tileValue`.

### Entries

- **`Pocket`**: gets `emoji: string` and `color: PocketColor`, and `PocketInput` gets the same two.
- **`validatePocket`**: adds `'pocket-emoji'` (more than 8 characters) and `'pocket-color'`.
- **`Entry` and `RecurringItem`**: get `pocketEmoji: string | null`, read through the join.
- **`PocketChoices` and `PaidFromChoices`**: the label is the emoji plus the name, and the selected fill is the pocket colour.
- **`EntryRow`**: "· from ✈️ Japan trip".
- **Pocket form**:
  - an "Emoji (optional)" `TextField` with `maxLength` 8;
  - a "Colour" radiogroup of 8 circles;
  - the param `show=1`: after creating, go to `dismissTo('/', { space: id })`;
  - delete goes to `dismissTo('/')`.
- **Removed**: `pockets-screen.tsx`, `pocket-screen.tsx` and their routes.

### Home

- **`HomeScreen`**:
  - after recording the month, it reads `space`;
  - a valid pocket id renders `PocketSpace`, otherwise `HomeMonth`;
  - an unknown id falls back to the month.
- **`SpaceSelector`** (`home/components/space-selector.tsx`):
  - the shared `Pill` (same height and shadow as My plan, with new `mark` and `trailingIcon` props) centred under the hero card, with the space's small round mark (`Size.pillMark`) (house on green for Main, emoji or savings icon on the pocket colour), the name alone and "▾";
  - accessibility label "Space: <name>, change";
  - it opens the sheet below, drawn in the same file.
- **The sheet** (in `space-selector.tsx`):
  - a `Modal` with `transparent` and `animationType="fade"`, a scrim that closes it on tap, and `onRequestClose` for back;
  - a bottom card with a `ScrollView`;
  - **rows**: radio rows for Main (house icon) (its left to spend when the month has income) and each pocket (colour circle with emoji or savings icon, name, balance in red when negative), then "In pockets <total>" and "+ New pocket" (`/pocket-edit?show=1`);
  - a pick runs `router.setParams({ space })`, so the screen does not stack.
- **`HomeMonth`**: the top row is unchanged and the selector sits under the hero card. The "See pockets ›" link is removed, and the hero, figure and tiles use the shared parts.
- **`PocketSpace`** (`home/screens/pocket-space.tsx`, rendered by home, not a route):
  - **top row**: the edit `IconButton` (pencil, "Edit <name>") and the gear;
  - **body**: the `HeroCard` (tone from the pocket colour, overspent when below 0) with the `HeroFigure` "Balance", then the selector;
  - **detail line**: "This pocket is X short." when below 0, else "Started with X" when there is a starting amount;
  - **actions**: two `Button`s, "Save into" (`/entry?kind=savings&pocket=id`) and "Spend from" (`/entry?kind=expense&pocket=id`);
  - **Overview**: tiles for Saved ("into it") and Spent ("from it");
  - **Activity**: a `Card` with the `EntryList` of the pocket's entries, filtered by the selected tile, plus the `CategorySplit` when Spent is selected;
  - **back**: a `BackHandler` sets `space` to `''`, so "Main" shows.
- **Entry form**: `kind=savings&pocket=id` preselects the savings pocket (today only an expense does).
