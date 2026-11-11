# Research: Polish

Guidance: Expo's `expo-animation` skill; Reanimated 4.7.1 docs (CSS transitions, layout animations); Expo SDK 58 `expo-haptics` docs.

## R1. Libraries

- **Decision**: `react-native-reanimated` 4.7.1 + `react-native-worklets` 0.13.0 and `expo-haptics` ~58.0.8, installed with `npx expo install` (approved by the developer 2026-11-11). Both are in Expo Go, so no development build is needed.
- **Rationale**: Reanimated runs animations on the UI thread; `babel-preset-expo` configures the worklets plugin.

## R2. What animates and how (gate: frequency and purpose)

| Element | Purpose | Tool | Timing |
| --- | --- | --- | --- |
| Press on buttons, tiles, card pills, kind options, month cells | feedback | Reanimated CSS transition on `transform: scale 0.97` | 120 ms ease-out |
| Activity rows pressed | feedback | background highlight, no scale (full-width rows) | instant |
| Rows added / removed / filtered | spatial consistency | layout animations `FadeIn` 200 ms, `FadeOut` 150 ms, `LinearTransition` 200 ms; `LayoutAnimationConfig skipEntering` so the first render does not animate | — |
| Savings bar | state indication | absolute, childless fill; CSS transition on `width` | 300 ms ease-out |
| Card green ↔ red | state indication | red gradient layer on top of the green, CSS transition on `opacity` (gradients cannot be interpolated) | 250 ms |
| Left-to-spend figure | state indication | JS count over 400 ms with ease-out, integer cents each frame, exact final value | 400 ms |

- **Figure**: a short JS count (about 24 renders of one text, only after a change) is simpler than an animated `TextInput`, which would lose `adjustsFontSizeToFit`. The value only changes within the same month: the hook keys on the month and skips the first render.
- **Rejected**: custom screen transitions (platform default stays), animating the month change, entrance animations on first render.

## R3. Reduced motion

- **Decision**: layout animations default to `ReduceMotion.System`; for CSS transitions and the figure count, `useReducedMotion()` sets duration 0 / shows the final value at once.

## R4. Haptics

- **Decision**: `Haptics.performAndroidHapticsAsync` with `AndroidHaptics.Confirm` (successful save), `AndroidHaptics.Long_Press` (confirmed delete, firm) and `AndroidHaptics.Clock_Tick` (choosing a kind or a tile), in one module `src/shared/haptics.ts` that ignores errors.
- **Rationale**: SDK 58 docs: this uses the device haptics engine, "does not require VIBRATE permission", and follows the system touch-feedback setting (FR-006). `notificationAsync` on Android is simulated with the Vibrator and ignores that setting.
- **Where**: `useSubmit` fires the success or delete feedback only when the write succeeds; the home "Repeat" income fires success when it is saved.

## R5. Tests

- Jest uses `jest-expo`; Reanimated's own mock or test setup is added if rendering needs it, and `expo-haptics` is mocked in tests where calls are asserted.
- The figure's in-between values come from a pure function (`countFrame(from, to, progress)` → integer cents), unit-tested.
