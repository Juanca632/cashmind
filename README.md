# cashmind

A privacy-first personal budgeting app for Android. Set your monthly income, split it into fixed expenses, leisure and savings, record what you spend, and see how each month is going against the plan.

All data stays on the device: no account, no bank access, no backend.

## Features

- **Monthly plan:** income plus fixed expenses, leisure and savings, each entered in euros or as a percentage. Of leisure and savings, the one you set is kept and the other gets what's left.
- **Months with a different income:** fixed expenses stay the same and the difference is shared between leisure and savings in the plan's proportion.
- **Plan history:** changing the plan applies from the current month onwards; past months keep their plan.
- **Expenses:** record, edit and delete expenses per bucket, with progress bars and percentages against each target. The previous month stays editable during the first 5 days of a new month.
- **Past months:** browse any past month from a year/month picker, read-only.

## Tech stack

- [Expo](https://expo.dev) SDK 58 / React Native, TypeScript, Expo Router
- `expo-sqlite` for on-device storage, with versioned migrations
- Code organized by feature in `src/features`, with shared code in `src/shared`
- Jest (`jest-expo`) for the money logic; all amounts are integer cents
- Specs and features planned with [GitHub Spec Kit](https://github.com/github/spec-kit) (`.specify/`, `specs/`); earlier OpenSpec history is in `docs/openspec-archive/`

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on Android.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the dev server |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## CI/CD

- **CI** (pull requests into `main`): dependency audit, lint, typecheck, tests and `expo-doctor`.
- **CD** (merges into `main`): version tag from conventional commits and a GitHub release.
