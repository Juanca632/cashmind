# Tasks: Design Tokens

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: Existing suite must pass unchanged; test-writer adds checks for the See all link and pill touch areas.

## Phase 1: Foundational

- [X] T001 Add `Layout` and `Size` tokens to src/shared/theme/theme.ts (values in plan.md); keep `MIN_TOUCH` as `Size.control`
- [X] T002 [P] Add src/shared/ui/pill.tsx, src/shared/ui/card.tsx, src/shared/ui/link-button.tsx, src/shared/ui/screen-scroll.tsx per plan.md

## Phase 2: User Story 2 - One look per control (P1)

- [X] T003 [US2] src/shared/ui/button.tsx: full buttons at `Size.control`; `variant="pill"` renders `Pill`
- [X] T004 [US2] Kind filter, category options (entry form) and the month card pills use `Pill`
- [X] T005 [US2] text-field, confirm-dialog buttons, icon-button use `Size.control` and layout tokens

## Phase 3: User Story 1 - Same rhythm (P1)

- [X] T006 [US1] Home, plan, entry, month picker, activity, data-error and database-error screens use `ScreenScroll`/`Layout` tokens and `Card`
- [X] T007 [US1] category-split, entry-list and home tiles use `Card`/`Layout`/`Size` tokens

## Phase 4: User Story 3 - Home bottom (P2)

- [X] T008 [US3] "See all (N)" as a `LinkButton` inside the bottom of the Activity card (same label and accessibility label); "Show all" as `LinkButton`; "Back to current month" a secondary `Button` in the block flow

## Phase 5: User Story 4 - Guard (P1)

- [X] T009 [US4] eslint.config.js: literal-spacing selectors added to the existing `no-restricted-syntax` block (plan.md)

## Phase 6: Polish

- [X] T010 [P] specs/001-expenses/spec.md: no change in the end (See all stayed a button below the card, see T017)
- [X] T011 test-writer subagent adds checks from specs/016-design-tokens/spec.md (pill touch area ≥ 48, lint guard, See all, Back to current month)
- [X] T012 Run `npx expo lint`, `npx tsc --noEmit`, `npx jest --maxWorkers=4`
- [X] T013 code-reviewer subagent reviews 016-design-tokens
- [X] T015 Fix ui-auditor findings: shared MessageScreen, dialog on Button, Opacity/IconSize/BORDER_WIDTH/Radius/Size tokens, lint for sizes, vertical-only hit slop, field errors grouped with their field
- [X] T016 code-reviewer re-review after T015 (pill minWidth added for its one finding)
- [X] T017 Developer found regressions on the phone (category pills laid out wrong, wrapped texts in See all and dialogs). Reverted the redesigns (See all link, Activity list card, larger dialog buttons, pill flexShrink) and, after three ui-auditor comparisons against c97486a, restored the old values as tokens (Size.button 56, Size.pill 40, Layout.looseGap, cardPaddingLarge, tilePadding, Opacity.disabledOnHero, Card size, ScreenScroll spacing, MessageScreen plain text)
- [X] T018 Final ui-auditor comparison (Activity rows had picked up a 16 gap from the shared screen padding; fixed with five smaller spacing differences)
- [X] T020 [US5] Elevation levels in theme.ts (`shadow.raised/hero/heroOverspent`, `elevation()`), used by Button, Pill, the kind tiles and the month card (shadow on a wrapper, the card clips its corners); opacities tuned with the developer (raised 0.08, hero 0.18)
- [X] T021 test-writer updates the theme test for the shadow tokens and covers US5
- [X] T022 [US6] Shared EdgeFades (src/shared/ui/edge-fades.tsx) inside ScreenScroll and on the Activity list, exactly as tall as each system bar (a taller fade looked like a white smear)
- [X] T023 test-writer covers US6 and the raised kind tiles
- [ ] T014 Visual check on the phone (light and dark, 3-button and gesture navigation) by the developer

## Dependencies

T001 → T002 → T003–T008 (any order, different files mostly) → T009 (lint passes only after every screen moved) → T010–T014.
