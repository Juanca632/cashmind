# Tasks

## 1. Domain logic

- [x] 1.1 Introduce `Amount`, the new `IncomePlan` shape, `resolve`, plan targets and validation (fit in income with excess), keep `targetsFor` proportional for overrides, and verify updated unit tests: 2000 / 1000 € / 30 % → 400 € leisure, leisure 500 € → savings 500 €, savings 60 % → 200 € over, 2500 € override still 600 / 900, sum-to-income
- [x] 1.2 Add a progress-percentage helper and verify tests for 630 / 900 → 70 %, 200 / 400 → 50 % and a zero target

## 2. Storage

- [x] 2.1 Add schema version 5 (rebuild `plan_version`, migrate existing rows, fresh install) and update the repo, and verify on the phone that the existing plan opens in the editor as fixed €, savings % and leisure automatic

## 3. Screens

- [x] 3.1 Rework the plan editor (unit toggle per field, other unit shown, last edited of leisure/savings kept, typing in the automatic field makes it kept, errors) and verify on the phone the spec scenarios (fixed 1000 € + savings 30 % → leisure 400 €; then leisure 500 € → savings 500 €; savings 60 % blocked)
- [x] 3.2 Show progress percentage instead of share of income in `BucketRows` and verify on the phone "70 % saved" style labels

## 4. Final check

- [x] 4.1 Run `npx expo lint`, `npx tsc --noEmit`, `npm test` and the `code-reviewer` subagent, and fix BLOCKER/MAJOR findings

## Workflow follow-up

- Archive the change with `/opsx:archive` after the developer approves it on the phone.
