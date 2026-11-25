# CashMind

A privacy-first personal budgeting app for Android. Record what you earn, save and spend each month, set one savings percentage as your plan, and see how much is left to spend.

All data stays on the device: no account, no bank access, no backend. The only copy that leaves the phone is Android's own encrypted backup to your Google account, when Android backup is on.

## Features

- **Entries:** record, edit and delete income, savings and expenses, with an amount, an optional note and a date (picked from Android's calendar), in any month up to today. Income and expenses have a category; savings go into a pocket. All of a month's entries are on the Activity screen.
- **Pockets:** name a pocket for each thing you save for (a trip, emergencies), with an emoji, a colour and what you had saved before the app. Save into it, spend from it, or move money out of it to the month or to another pocket. Each pocket shows its balance, a chart of how it moved this month, what was spent from it by category, and its activity.
- **Spaces:** home shows one space at a time, "Main" (the month's money) or a pocket, picked from the selector under the balance card.
- **Repeat every month:** mark rent, salary or a subscription once; it is recorded on the 1st of every new month. My plan lists them under "Every month" with the month's fixed costs.
- **Plan:** one savings percentage of each month's income (20 % by default). Changing it applies from the current month; past months keep theirs.
- **Left to spend:** income + money moved into Main from pockets − expenses − the larger of the savings goal and what was saved. Expenses paid from a pocket do not count. It can go negative; the month card then turns red.
- **Daily budget:** in the current month, left to spend shared over the days left ("≈ X / day").
- **Spending pace:** a chart of the month's spending day by day against the plan's pace, with one sentence saying whether you are over or under it.
- **Trends:** the last six months of spending, savings or income side by side, against your usual, with each month's categories, a category's own history, and how often the savings goal was reached.
- **By category:** tap Income or Spent on home to see that kind split by category.
- **Savings goal bar:** the savings tile fills up as you save towards the month's goal.
- **Repeat last income:** a new month asks for its income and can repeat last month's in one tap.
- **Past months:** browse any month from a year/month picker; their entries stay editable.
- **Settings:** the currency (EUR, USD or COP; changing it never converts amounts) and an app lock with the phone's fingerprint, face or PIN, on by default.
- **Light and dark theme:** follows the phone's setting.
- **Backup:** Android backs up the app's data automatically and restores it when the app is installed again.

## Tech stack

- [Expo](https://expo.dev) SDK 58 / React Native, TypeScript, Expo Router
- `expo-sqlite` for on-device storage, with versioned migrations
- Code organized by feature in `src/features`, with shared code in `src/shared`
- Jest (`jest-expo`) unit and integration tests, and E2E runs on the Android emulator; all amounts are integer cents
- Specs and features planned with [GitHub Spec Kit](https://github.com/github/spec-kit) (`.specify/`, `specs/`); earlier OpenSpec history is in `docs/openspec-archive/`

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on Android. `npm run demo` starts the same app with six months of invented data in a separate database.

Release APKs are built with EAS: `npx eas-cli@latest build --platform android --profile production`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run demo` | Start the dev server with six months of invented data |
| `npm test` | Unit and integration tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## CI/CD

- **CI** (pushes to `develop` and pull requests into `main`): dependency audit, lint, typecheck, tests and `expo-doctor`.
- **CD** (merges into `main`): version tag from conventional commits and a GitHub release.
