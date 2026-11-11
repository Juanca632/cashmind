# Tasks: App Identity

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: Required by the constitution. Config tests by the test-writer subagent; E2E with the production APK.

## Phase 1: User Story 1 - Recognize the app (P1)

**Independent test**: quickstart.md steps 1–4.

- [X] T001 [US1] Export the chosen open-C drawing (research R1) to assets/images/icon.png, android-icon-background.png, android-icon-foreground.png, android-icon-monochrome.png and splash-icon.png (1024 px), and save each layer's SVG in assets/icon-source/
- [X] T002 [US1] In app.json set `expo.name` to "CashMind", `android.adaptiveIcon.backgroundColor` to "#065F52", and the expo-splash-screen plugin to `backgroundColor: "#065F52"`, `imageWidth: 200`; keep slug, scheme and package unchanged
- [X] T003 [P] [US1] Set the home route's title to "CashMind" in src/app/_layout.tsx and the matching example in src/test-support/app.tsx's comment
- [X] T004 [US1] Remove assets/images/favicon.png and assets/expo.icon (Expo template leftovers for web and iOS, referenced nowhere)

## Phase 2: User Story 2 - Release APK (P1)

- [X] T005 [US2] Add a `production` profile to eas.json: `"autoIncrement": true`, `"android": { "buildType": "apk" }`

## Phase 3: Polish

- [X] T006 test-writer subagent writes config tests from the spec: name is "CashMind", package `com.juancrestrepo.cashmind` and slug `cashmind` unchanged, splash background #065F52, production profile builds an APK with auto-increment
- [X] T007 Run lint, typecheck, tests and `npx expo-doctor`
- [ ] T008 E2E of quickstart.md by the e2e-tester subagent with the production APK (done in the release step, together with 010's backup journey)

## Dependencies

T001 before T002. T003–T005 independent. T006 after T002 and T005. T008 needs the production build.
