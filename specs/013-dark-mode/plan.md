# Implementation Plan: Dark Mode

**Branch**: `feat/013-dark-mode` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

## Summary

The app follows the system theme. `theme.ts` gets a light and a dark token set ([research.md](./research.md) R2); `useTheme()` picks one with `useColorScheme()`; every screen and shared component reads colors from `useTheme()` instead of fixed constants; the navigation theme, headers and status bar follow. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-router. No new ones.

**Storage**: Not affected.

**Testing**: Jest (unit: contrast of every text pair in both token sets; integration: screens render in dark); E2E visual check.

**Target Platform**: Android

**Project Type**: Mobile app

**Constraints**: light mode unchanged; AA contrast.

**Scale/Scope**: theme.ts, use-theme.ts, _layout.tsx, app.json and the ~10 files that use fixed colors.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. |
| II. Keep It Simple | Pass. One token object per scheme, no theme setting, no library. |
| III. Android First | Pass. |
| IV. Money Is Integer Cents | Not affected. |
| V. English in the Repository | Pass. |
| Migrations preserve data | Not affected. |
| Baseline specs updated | Not affected (no behavior change). |

## Project Structure

```text
app.json                       userInterfaceStyle: automatic
src/shared/theme/theme.ts      LIGHT / DARK token sets, Hero unchanged
src/shared/theme/use-theme.ts  picks the set with useColorScheme()
src/app/_layout.tsx            navigation theme, header, status bar
src/shared/ui/*                button, confirm-dialog, error-text, kind-badge
src/features/**/screens, components  home, plan, entry, month picker, entry list
```
