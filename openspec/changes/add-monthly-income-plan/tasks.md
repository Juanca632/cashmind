# Tasks

## 1. Clean template and set up tooling

- [x] 1.1 Remove the template demo screens, components and `scripts/reset-project.js`, replace tabs with a `Stack` in `src/app/_layout.tsx`, and verify the app opens on a blank home screen in Expo Go
- [x] 1.2 Install `jest-expo`, `jest` and `@types/jest` with `npx expo install --dev`, add the `jest-expo` preset and a `test` script, and verify `npm test` runs a placeholder test
- [x] 1.3 Install `expo-sqlite` with `npx expo install` and verify `npx expo-doctor` reports no issues

## 2. Money domain logic

- [x] 2.1 Implement euro parsing (`,` or `.` decimals) and `fr-FR` EUR formatting on integer cents in `src/domain/income-plan.ts`, and verify unit tests for valid, empty, zero and negative inputs pass
- [x] 2.2 Implement plan validation (income > 0, whole percentages 0–100, total = 100, distance from 100) and verify unit tests cover the spec scenarios
- [x] 2.3 Implement `targetsFor` with the remainder-to-fixed rounding rule and verify tests for 50/30/20 on 2500,00 € and the 1000,01 € sum-to-income case
- [x] 2.4 Implement `incomeForMonth` (override vs recurring) and verify tests for the override and remove-override scenarios

## 3. Local persistence

- [x] 3.1 Add `SQLiteProvider` in the root layout with a `user_version` migration creating `plan` and `month_income_override`, and verify the app starts without errors in Expo Go
- [x] 3.2 Implement `src/data/income-plan-repo.ts` (get/save plan, get/set/remove month override) and verify on the phone that a saved plan survives closing and reopening the app

## 4. Screens

- [x] 4.1 Build `src/app/plan.tsx` (income + three percentages, live euro preview and total, save disabled with an explanation when invalid) and verify on the phone that changing savings from 10 % to 25 % on 2000 € shows 500,00 €
- [x] 4.2 Build `src/app/index.tsx` showing the set-up prompt without a plan, and the current month, income and three targets with a plan, and verify both states on the phone
- [x] 4.3 Build `src/app/month-income.tsx` to set or remove the current month's income override, mark overridden income on the home screen, and verify the 3000,00 € override scenario on the phone

## 5. Final check

- [x] 5.1 Run `npx expo lint`, `npx tsc --noEmit` and `npm test`, and do one full pass on the phone: first launch → create plan → override month → remove override → restart app

## Workflow follow-up

- Archive the change with `/opsx:archive` after the developer approves it on the phone.
