# Quickstart: Recurring Entries

```bash
npx jest --maxWorkers=2
npx tsc --noEmit
npx expo lint
```

## In Expo Go (invented amounts)

1. Add an expense "Rent", Housing, 900,00 € with "Repeat every month" on. Home row shows the repeat icon. (US1-2, US1-5)
2. Open My plan: "Every month" lists Rent 900,00 €, "Fixed costs: 900,00 € a month". (US3-1, US3-2)
3. Add Salary 2 000,00 € from My plan → Add: the form opens with the switch on; after saving, the list shows "+2 000,00 €" and the total is still 900,00 €. (US3-4)
4. Tap Rent in My plan, change it to 950,00 €, save: the list shows 950,00 €; this month's Rent on home still says 900,00 €. (US3-5)
5. Go to a past month and open an entry: no switch. (US1-4)
6. New month: on the emulator, set the date to the 1st of next month (Settings → System → Date & time, automatic off), reopen the app: Rent 950,00 € and Salary 2 000,00 € dated the 1st are on home, and "Add this month's income" is not shown. Reopen: nothing is added twice. Delete Rent, reopen: it does not come back. Set the date back to automatic afterwards. (US2-1, US2-2, US2-3, US2-6)
7. Tap Rent in My plan → "Stop repeating" → confirm: it leaves the list; past entries keep their icon. (US3-6, FR-006)
8. Upgrade: install the v1.2.0 APK with data, then this build: every entry and the plan are unchanged; My plan says "Nothing repeats yet.". (FR-008)
