# Tasks

## 1. Domain logic

- [x] 1.1 Change the plan shape to `{ incomeCents, fixedCents, savingsPct }`, update `validatePlan` (income > 0, 0 ≤ fixed ≤ income, savings whole and ≤ share left) and verify unit tests for the spec's validation scenarios pass
- [x] 1.2 Rewrite `targetsFor` per design decision 2 (shortfall, zero remainder, proportional split) plus a percentage-of-income helper, and verify tests for 2000/1000/30 %, the 2500 € override (600 / 900), the 800 € shortfall and the 1000,01 € sum case

## 2. Storage

- [x] 2.1 Add schema version 2 (fresh install creates the new table; v1 → v2 migration in a transaction) and update the repo, and verify on the phone that the plan saved earlier is migrated and still shown

## 3. Screens

- [x] 3.1 Update the plan editor (income, fixed €, savings %, read-only leisure, live preview with percentages, errors) and verify on the phone that savings 10 % → 25 % on 2000 / 1000 shows 500,00 € savings and 500,00 € leisure
- [x] 3.2 Update the home and month income screens to show each bucket's percentage of the month's income and the shortfall warning, and verify the 2500 € and 800 € override scenarios on the phone

## 4. Final check

- [x] 4.1 Run `npx expo lint`, `npx tsc --noEmit` and `npm test`

## Workflow follow-up

- Archive the change with `/opsx:archive` after the developer approves it on the phone.
