# Feature Specification: Dark Mode

**Feature Branch**: `feat/013-dark-mode`

**Created**: 2026-11-11

**Status**: Implemented

**Input**: User description: "The app follows the phone's light or dark theme, so it is comfortable at night and looks finished for v1.0.0."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The app follows the phone's theme (Priority: P1)

**Why this priority**: A bright white app at night is uncomfortable, and a v1.0.0 should match the phone.

**Independent Test**: Switch Android between light and dark theme and walk through every screen.

**Acceptance Scenarios**:

1. *Dark phone*: **Given** the phone uses the dark theme, **When** the user opens the app, **Then** every screen (home, entry form, plan, month picker, confirmation dialog, error screens) has dark backgrounds and light text
2. *Light phone*: **Given** the phone uses the light theme, **Then** the app looks as it does today
3. *Switching*: **Given** the app is open, **When** the user changes the phone's theme, **Then** the app follows it without restarting
4. *Readable*: **Given** either theme, **Then** all text, amounts, icons and kind colors are readable on their backgrounds (WCAG AA contrast, 4.5:1 for text)
5. *Same meaning*: **Given** either theme, **Then** income, savings and expense keep their own colors, the month card stays green (red when overspent), and the savings bar, selection borders and "Show all" stay visible
6. *System bars*: **Given** the dark theme, **Then** the status bar icons are light and the navigation header is dark

---

### Edge Cases

- **Start screen**: the green start screen stays the same in both themes.
- **Unsaved-changes and delete dialogs**: follow the theme like the screens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST follow the phone's light or dark theme, live, with no setting of its own.
- **FR-002**: Every color on screen MUST come from the current theme; no screen keeps light-only colors in dark mode.
- **FR-003**: Text and amounts MUST meet 4.5:1 contrast on their backgrounds in both themes.
- **FR-004**: Light mode MUST look as it does before this change, except the v1.0.0 audit fixes in FR-005 and the month card's green gradient, which ends slightly darker (#065F52 → #08705E → #0A7A66) so its text meets 4.5:1 at every point, the savings bar's empty track, which is stronger (30 % instead of 18 % of the savings color) so the bar reads at a glance, and Income, which turns blue (ink and fill #1D4ED8, tint #DBE7FE) so it no longer looks like Savings (all from the v1.0.0 audits, 2026-11-11).

- **FR-005** (v1.0.0 audit fixes, 2026-11-11): the Delete button on the entry form has red (error) text; a pressed Activity row shows a clearly darker highlight (#E4E7EB light, #2A3135 dark); in dark mode the primary button and the selected month cell have a thin light-green outline that takes no space (none in light); "Show all" dims while pressed; amounts in the home tiles shrink to fit but never below 70 % of their size; validation errors are announced by screen readers when they appear.

### Key Entities

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every screen passes a visual check in both themes on the emulator.
- **SC-002**: No text pair in either theme falls below 4.5:1 contrast, including the month card's text at every point of its green and red gradients.

## Assumptions

- The month card's green and red gradients and white text read well on a dark screen, so the card is the same in both themes.

## Out of Scope

- An in-app theme switch.
- A different start screen for dark mode.
- Other color themes.
