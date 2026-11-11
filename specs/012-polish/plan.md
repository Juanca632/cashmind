# Implementation Plan: Polish

**Branch**: `feat/012-polish` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

## Summary

Add a savings progress bar, a red month card when overspent, motion (press scale, row layout animations, bar and card transitions, a counting figure) with Reanimated 4, and Android haptics on saves, deletes and choices. UI only; no data changes.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58; new: react-native-reanimated 4.7.1, react-native-worklets 0.13.0, expo-haptics ~58.0.8 (approved).

**Storage**: Not affected.

**Testing**: Jest (unit for the count frames; integration for bar, red card and haptics calls); E2E on the emulator.

**Target Platform**: Android

**Project Type**: Mobile app

**Performance Goals**: no visible stutter with 100 entries in a month; every animation under 500 ms.

**Constraints**: follow reduced motion and the system touch-feedback setting.

**Scale/Scope**: ~4 new small shared files, changes in home, entry form, entry list, button, month picker, useSubmit.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. No data handling. |
| II. Keep It Simple | Pass. Two approved libraries; one press component, one haptics module, one count hook. |
| III. Android First | Pass. Android haptics API. |
| IV. Money Is Integer Cents | Pass. The counting figure uses integer cents each frame. |
| V. English in the Repository | Pass. |
| Migrations preserve data | Not affected. |
| Baseline specs updated | Pass. 002 gets the bar and the red card (FR-007). |

## Project Structure

```text
src/shared/ui/pressable-scale.tsx      Pressable that scales to 0.97 while pressed (new)
src/shared/haptics.ts                  success / delete / tick (new)
src/shared/hooks/use-count-up.ts       countFrame() + useCountUp(value, key) (new)
src/shared/theme/theme.ts              Hero red gradient, savings bar colors
src/shared/ui/button.tsx               uses PressableScale
src/shared/hooks/use-submit.ts         haptic on success; 'delete' feedback option
src/features/home/screens/home-screen.tsx   bar, red card layer, count-up, tile haptic, PressableScale
src/features/entries/components/entry-list.tsx  layout animations, row highlight
src/features/entries/screens/entry-screen.tsx   kind options PressableScale + tick, delete feedback
src/features/entries/screens/month-picker-screen.tsx  cells PressableScale
specs/002-income-plan/spec.md          baseline update
```

**Structure Decision**: shared UI pieces in `src/shared`, feature screens updated in place.
