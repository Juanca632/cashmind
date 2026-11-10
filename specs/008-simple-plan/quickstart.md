# Quickstart: Simple Plan

```bash
npx jest --maxWorkers=4
npx tsc --noEmit
npx expo lint
```

## On the emulator, fresh install (invented amounts)

Run `npx expo start` (not demo) on the emulator after clearing the app's data, so the database starts empty. Never clear data on a real phone.

1. First launch: home asks for this month's income; no setup screen.
2. Add an income of 2000 €: the card shows 1600 € left to spend, the Savings tile "0 € of 400 €".
3. Add a 900 € expense and a 150 € saving: 700 € left (2000 − 900 − the larger of the 400 € goal and the 150 € saved), Savings "150 € of 400 €".
4. My plan: type 30, see "600 € of this month's 2 000 €", save. Home shows "of 600 €" and 500 € left.
5. Tap Spent: the list is titled Spent and shows only the expense; "Show all" brings everything back.

## In demo mode (`npm run demo`, six invented months)

6. Pick the month two months ago: its left to spend is negative (−100 €).
7. Pick a past month: My plan is not offered; an entry there can be edited and deleted.
8. Set the plan to 0 %: the Savings tile says "No goal".

## Upgrade (optional, emulator only)

9. Install v0.3.0, record invented fixed and leisure entries and a plan, then open this version: every entry is still listed and the fixed and leisure ones show as expenses.
