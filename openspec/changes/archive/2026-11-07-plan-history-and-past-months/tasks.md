# Tasks

## 1. Domain logic

- [x] 1.1 Add `planForMonth`, `isPastMonth`, month/year helpers (previous/next year, months of a year, compare) and verify unit tests for the July → December plan change, same-month replacement and months before the first plan

## 2. Storage

- [x] 2.1 Add schema version 3 (`plan_version`, v2 → v3 migration in a transaction, fresh install creates v3) and update the repo to load all versions and upsert the current month's version, and verify on the phone that the existing plan is still shown after the update

## 3. Screens

- [x] 3.1 Make home show the month from the `month` param (default current month), with a tappable month header, the "no plan this month" state, and read-only mode with "Back to current month", and verify on the phone
- [x] 3.2 Add `src/app/month-picker.tsx` (year selector bounded by first plan year and current year, 12-month grid, current month highlighted, future months disabled) and verify on the phone that picking a month shows it on home
- [x] 3.3 State in the plan editor that changes apply from the current month onwards, and verify on the phone that changing the plan does not change a past month (requires a past-month version; check with the migrated data or a test)

## 4. Final check

- [x] 4.1 Run `npx expo lint`, `npx tsc --noEmit`, `npm test` and the `code-reviewer` subagent, and fix BLOCKER/MAJOR findings

## Workflow follow-up

- Archive the change with `/opsx:archive` after the developer approves it on the phone.
