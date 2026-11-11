# Tasks: Polish

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: Required. Written by the test-writer subagent from the spec.

## Phase 1: Foundational

- [X] T001 Install react-native-reanimated, react-native-worklets and expo-haptics with `npx expo install` (package.json)
- [X] T002 [P] Add src/shared/haptics.ts: `hapticSuccess()` (AndroidHaptics.Confirm), `hapticDelete()` (AndroidHaptics.Long_Press), `hapticTick()` (AndroidHaptics.Clock_Tick), all via `performAndroidHapticsAsync`, errors ignored
- [X] T003 [P] Add src/shared/ui/pressable-scale.tsx: Pressable whose content scales to 0.97 while pressed, Reanimated CSS transition on transform, 120 ms, `cubicBezier(0.23, 1, 0.32, 1)`, duration 0 with reduced motion
- [X] T004 [P] Add src/shared/hooks/use-count-up.ts: pure `countFrame(from, to, progress)` returning integer cents with ease-out; `useCountUp(value, key)` that runs 400 ms only when value changes with the same key, shows the value at once on first render, on key change and with reduced motion

## Phase 2: User Story 1 - Savings bar (P1)

- [X] T005 [US1] In home-screen.tsx the Savings tile shows a bar (track + absolute fill, width = min(saved/goal, 1)) when goal > 0, CSS transition on width 300 ms; no bar when there is no goal

## Phase 3: User Story 2 - Red card (P1)

- [X] T006 [US2] Add a red gradient to `Hero` in src/shared/theme/theme.ts; in home-screen.tsx put an absolute red layer in the month card with opacity 1 when left < 0 and 0 otherwise, CSS transition on opacity 250 ms

## Phase 4: User Story 3 - Motion (P2)

- [X] T007 [US3] Use `useCountUp(summary.left, month)` in LeftToSpend (home-screen.tsx)
- [X] T008 [US3] PressableScale in src/shared/ui/button.tsx, home KindTile and CardPill, entry-screen kind options and month-picker cells
- [X] T009 [US3] src/features/entries/components/entry-list.tsx: each row in an Animated.View with `entering={FadeIn.duration(200)}`, `exiting={FadeOut.duration(150)}`, `layout={LinearTransition.duration(200)}`; list wrapped in `LayoutAnimationConfig skipEntering`; pressed row highlights its background instead of fading

## Phase 5: User Story 4 - Haptics (P3)

- [X] T010 [US4] src/shared/hooks/use-submit.ts: on success call `hapticSuccess()`, or `hapticDelete()` when the write is a delete (option on `submit`); nothing on failure; use the delete option in entry-screen.tsx
- [X] T011 [US4] `hapticTick()` on choosing a kind (entry-screen.tsx) and toggling a tile (home-screen.tsx); `hapticSuccess()` when the repeated income is saved

## Phase 6: Polish

- [X] T012 [P] Update baseline specs/002-income-plan/spec.md: savings bar and red card
- [X] T013 test-writer subagent writes the tests from the spec: unit for countFrame; integration for the bar, the red card, haptic calls on save/delete/choice and none on failure (test setup for Reanimated/haptics if needed)
- [X] T014 Run lint, typecheck and tests
- [X] T015 E2E of quickstart.md by the e2e-tester subagent

## Dependencies

T002–T004 parallel, before stories. T005–T007, T011 all touch home-screen.tsx: in order. T013 after T011.
