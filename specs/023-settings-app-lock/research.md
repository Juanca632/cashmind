# Research: Settings and app lock

Source: Expo SDK 58 docs, `https://docs.expo.dev/versions/v58.0.0/sdk/local-authentication/`, read 2026-11-24.

## Phone authentication

- **Decision**: `expo-local-authentication`, through one wrapper (`device-auth.ts`).
- **Rationale**: it is the official Expo module and is included in Expo Go. Android needs no config plugin: `USE_BIOMETRIC` comes from the library's manifest. It shows the system prompt, so the app never handles biometric data.
- **Alternatives**: an app PIN of its own was rejected by the spec (FR-006). `react-native-biometrics` was rejected because it is third-party and not needed.

## "Has a phone lock"

- **Decision**: `getEnrolledLevelAsync() !== SecurityLevel.NONE`.
- **Rationale**: `SECRET` (PIN, pattern or password) counts as a lock, so a phone without a fingerprint but with a PIN still locks. `isEnrolledAsync()` only covers biometrics. The docs note that devices older than Android M may report a SIM lock as `SECRET`. The app's minimum SDK is far above that.

## PIN fallback

- **Decision**: call `authenticateAsync` with `disableDeviceFallback` left `false` and `biometricsSecurityLevel` left `'weak'`.
- **Rationale**: the spec wants fingerprint, face or the phone's PIN. The docs do not describe the Android fallback in detail, so it is verified on the emulator with a PIN set (quickstart). If the prompt offers no PIN, the plan is revisited before going on.

## Lock timing

- **Decision**: store `Date.now()` on `AppState` `background` and lock on `active` when more than 60 000 ms passed. A cold start always locks.
- **Rationale**: this is the single fixed rule from the spec. Opening the PIN screen can pause the activity, so changes are ignored while a prompt is open, or the prompt would lock the app behind itself.
- **Alternative**: `inactive` events are iOS-only on React Native, so they are not used.

## Hiding the content while locked

- **Decision**: keep the navigator mounted under a full-screen cover, and hide it from accessibility.
- **Rationale**: FR-007 keeps screens and typed text. Unmounting would lose both. `importantForAccessibility="no-hide-descendants"` keeps TalkBack from reading what is behind the cover.
- **Out of scope**: the recent-apps preview (`FLAG_SECURE`), as stated in the spec.

## Where the setting lives

- **Decision**: a key/value `setting` table in SQLite (migration 8).
- **Rationale**: the data already lives in SQLite, which has the migration discipline and is covered by Android auto backup. No new storage library is needed. A key/value shape fits 024 (currency) without another table.
- **Alternative**: `expo-secure-store` was rejected. It is an extra library, and on/off is not a secret.

## App version

- **Decision**: `Constants.expoConfig?.version` from `expo-constants`, which is already a dependency.
