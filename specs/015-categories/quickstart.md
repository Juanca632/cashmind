# Quickstart: Categories

```bash
npx jest --maxWorkers=4
npx tsc --noEmit
npx expo lint
```

## On the emulator (invented amounts)

1. Install the previous APK or build (v1.1.0), record an income, an expense with a note and one without, then update to this build: every entry is still there with the same amount, date and note; rows look as before ("Expense" for the one without a note). (US4-1)
2. Tap Add: the form shows the expense categories with Other selected. Switch to Income and to Savings: their lists show, Other selected each time. (US1-1, US1-2, US1-4)
3. Record 650 € in Housing, 320 € in Groceries (no note) and 230 € in Other. Home rows: "Groceries" with the cart icon, "Expense" for the Other one. (US1-3, US3-1, US3-2)
4. Tap Spent: "By category" shows Housing 650,00 € 54 %, Groceries 320,00 € 27 %, Other 230,00 € 19 %. Tap Spent again: the split disappears. (US2-1, US2-5)
5. Open the Other expense, change it to Health, try to leave: the app asks; save it. Spent split now shows Health instead of Other. (US1-5, US1-6, US2-6)
6. Record 2000 € Salary and 300 € Freelance income, tap Income: Salary 87 %, Freelance 13 %. (US2-2)
7. In a past month with no income, use "Repeat …": the new income row reads "Monthly income" and the Income split shows Other. (US4-2)
8. Dark mode: the form options and the split follow it. `npm run demo`: demo months show categories in the splits.
