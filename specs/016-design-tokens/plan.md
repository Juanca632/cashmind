# Implementation Plan: Design Tokens

**Branch**: `feat/016-design-tokens` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

## Summary

Add layout and size tokens to `src/shared/theme/theme.ts`, build the shared controls that were copied around (`Pill`, `Card`, `LinkButton`, `ScreenScroll`), move every screen and component onto them, and add a lint rule that rejects literal spacing in screens and components. No behavior, data or dependency changes.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: none new.

**Storage**: not affected.

**Testing**: the existing suite must pass unchanged (SC-003); no new tests are needed for spacing beyond the lint rule. A small integration check for "See all" inside the card and the pill touch area is written by test-writer.

**Target Platform**: Android

**Constraints**: touch areas ≥ 48 × 48 (`hitSlop` on 36-point pills); text grows with the phone's font size.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Not affected. |
| II. Keep It Simple | Pass. Four small shared components replace five copies; no styling library. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Not affected. |
| V. English in the Repository | Pass. |
| Baseline specs updated | Only 001 FR-006 wording for where "See all" sits. |
| Architecture boundaries | Pass. Everything new lives in `src/shared`. |

## Design

### Tokens (`src/shared/theme/theme.ts`)

```text
Layout.screenPadding  16   side margin of every screen
Layout.sectionGap     16   between blocks
Layout.itemGap         8   inside a block
Layout.tightGap        4   label to value
Layout.cardPadding    16   every card
Layout.dialogPadding  24   modal dialog
Layout.pillPadding    12   pill side padding
Layout.rowGap         12   icon, text and amount in a list row
Size.control          48   buttons, fields, date row, touch minimum (MIN_TOUCH)
Size.pill             36   visible pill height (touch area padded to 48 with hitSlop)
Size.row              62   list row
Size.choice           72   kind choice in the form
Size.hero            168   month card minimum height
```

Mobile note: `hitSlop` enlarges the area that reacts to touch beyond a view's visible bounds, so a 36-point pill still reacts in a 48-point area as Android recommends.

Added after the ui-auditor pass: `Radius.dialog`, `Opacity { disabled 0.4, pressed 0.6 }`, `IconSize { small 16, medium 18, large 24 }`, `BORDER_WIDTH` 1.5, `Size.badge/progress/dialog/amountInput/percentInput/percentColumn`, `Layout.rowGap/screenBottom/buttonPadding`, and a `button` text type (16 bold).

### Shared components (`src/shared/ui`)

- `pill.tsx`: label, optional icon, `selected`, colors `{ fill, ink, border }`, `accessibilityRole` (`button` / `radio`), `accessibilityLabel`, `accessibilityState`, `disabled`, `onPress`. Height `Size.pill`, horizontal padding `Layout.pillPadding` (12), icon 16, `smallBold` text, `hitSlop` so the touch area reaches 48. Replaces `Button variant="pill"`, the kind filter pills, the category options, the month card pills.
- `card.tsx`: `backgroundElement`, `Radius.card`, `Layout.cardPadding`, `gap: Layout.itemGap`; optional `style`.
- `link-button.tsx`: accent-ink small bold text, `Size.control` touch height.
- `screen-scroll.tsx`: `ScrollView` with `Layout.screenPadding`, `gap: Layout.sectionGap`, safe-area bottom padding, `keyboardShouldPersistTaps`; `useScreenContent()` gives the same padding to lists that scroll themselves (Activity).
- `message-screen.tsx`: the one full-screen message (`DataError`, `DatabaseError`, entry no longer exists), with `topInset` for screens without a header.
- `button.tsx`: variants primary, secondary, destructive, danger (filled red), quiet (dialog's safe choice), `stretch` for button rows; the dialog uses it. `variant="pill"` removed: pills are `Pill`.
- Pills and links pad their touch area only vertically (`hitSlop` top/bottom), and wrapped pill rows use `rowGap: Layout.rowGap`, so neighbours' touch areas never overlap.
- Activity's rows draw one card together, like home's list.

### Lint (`eslint.config.js`)

Extend the existing `no-restricted-syntax` block for `src/app`, `src/features/*/screens`, `src/features/*/components`, `src/shared/ui` (flat config replaces the option list per block, so both selectors live in the same block): reject `Property[key.name=/^(padding|margin|gap|minHeight|rowGap|columnGap)/]` whose value is a non-zero number literal or a `+` binary expression.

## Project Structure

```text
src/shared/theme/theme.ts              Layout, Size tokens
src/shared/ui/{pill,card,link-button,screen-scroll}.tsx
src/shared/ui/{button,text-field,confirm-dialog,data-error,database-error,icon-button}.tsx   use tokens
src/features/home/screens/{home-screen,plan-screen}.tsx
src/features/entries/screens/{entry-screen,activity-screen,month-picker-screen}.tsx
src/features/entries/components/{kind-filter,category-split,entry-list}.tsx
eslint.config.js
specs/001-expenses/spec.md             FR-006 "See all" placement
```
