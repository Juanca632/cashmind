# cashmind

Personal budgeting app for Android. The user records what they earn, save and spend each month, sets one savings percentage as the plan, and sees how much is left to spend.

## Project rules

- **Privacy first:** all financial data stays on the device; the one exception is Android's encrypted auto backup to the user's Google account (`android.allowBackup`). No bank credentials, no open banking, no backend unless explicitly decided.
- **Keep it simple:** build only what the current change needs. No speculative abstractions, layers or libraries "for later".
- **Android first.** iOS is out of scope for now.
- **Money:** amounts are EUR. Never use floating point for money; store integer cents.
- **Language:** all code, comments, docs, specs and commit messages in English.
- **Planning:** features are planned with GitHub Spec Kit (`.specify/`, `specs/`). For new work use `/speckit-specify`, `/speckit-plan` and `/speckit-tasks`, then `/speckit-implement` and `/speckit-converge`. Project principles are in `.specify/memory/constitution.md`. Keep specs short and state what is out of scope; break work into small tasks that can each be verified on the phone or with a test.
- **Current behavior:** `specs/001-expenses`, `specs/002-income-plan` and `specs/003-month-browsing` are baseline specs. A feature that changes that behavior must update the affected baseline spec in the same change.
- **Architecture:** code lives in `src/features/<feature>` (rules, repository, service, hooks, components, screens), `src/db` and `src/shared`. All writes go through a feature's service. Screens read through hooks, repositories check the format of what they read, and features do not import each other (only `home` combines them). `npx expo lint` enforces these boundaries.
- **Testing:** three levels are required. Unit tests for rules and calculations; integration tests that render the real routes with the real services and repositories on the test database and follow whole journeys across screens; E2E runs of the main journeys on the real app (Android emulator or phone) before any release or APK. Every test, unit tests included, is written by the `test-writer` subagent from the specs, independently of the implementation; the main agent never writes tests. E2E runs are done by the `e2e-tester` subagent, which follows the feature's `quickstart.md`.
- **Code health:** after a large change or before a release, the `quality-auditor` subagent audits the whole repository (unused code, deprecated APIs, outdated names, docs drift). The `code-reviewer` still reviews every feature before commit.
- **Database changes:** every change is a new step in `src/db/migrations.ts`, with its structure added to `src/test-support/released-schemas.ts` and a test that upgrades sample data. A released step is never edited, and a migration must never delete user data to recover from a failure. From v1.0.0 no migration deletes user data; before v1.0.0 a step may drop the data of a removed feature when its spec says so and the developer approved it.
- **History:** the OpenSpec specs and archived changes are kept read-only in `docs/openspec-archive/`.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npm run demo                # same, with six months of invented data in a separate database
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
