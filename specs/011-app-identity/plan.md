# Implementation Plan: App Identity

**Branch**: `feat/011-app-identity` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

## Summary

Replace Expo's template icon and splash with the CashMind open "C", rename the launcher label to "CashMind", and add an EAS `production` profile that builds an APK. Configuration and image assets only; no app logic, no new dependencies.

## Technical Context

**Language/Version**: TypeScript 6, React Native 0.88

**Primary Dependencies**: Expo SDK 58, expo-splash-screen (installed). No new ones.

**Storage**: Not affected. See [data-model.md](./data-model.md).

**Testing**: Jest config tests; E2E on the emulator with the production APK.

**Target Platform**: Android

**Project Type**: Mobile app

**Performance Goals**: None.

**Constraints**: package name, slug and signing key must not change.

**Scale/Scope**: 5 PNGs, 5 SVG sources, app.json, eas.json, one title.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. No data handling. |
| II. Keep It Simple | Pass. Assets and config only; no generator script or dependency. |
| III. Android First | Pass. Android icon layers only. |
| IV. Money Is Integer Cents | Not affected. |
| V. English in the Repository | Pass. |
| Migrations preserve data | Not affected. |
| Baseline specs updated | Not affected. |

Post-design re-check: unchanged.

## Project Structure

```text
specs/011-app-identity/  spec, plan, research, data-model, quickstart, tasks, checklists/
assets/images/           icon.png, android-icon-{foreground,background,monochrome}.png, splash-icon.png (replaced)
assets/icon-source/      SVG source of each layer (new)
app.json                 name, adaptive icon colors, splash plugin
eas.json                 production profile
src/app/_layout.tsx      home title "CashMind"
```

No contracts: the feature adds no interface.

**Structure Decision**: assets and config only.
