# Quickstart: Activity Screen

```bash
npx jest --maxWorkers=4
npx tsc --noEmit
npx expo lint
```

## On the emulator (invented amounts)

1. Fresh install, add an income of 1000 € and 4 expenses: home lists 5 rows and no "See all". (US1-2)
2. Add 7 more expenses (12 entries): home lists the 5 newest and "See all (12)". (US1-1, US1-4)
3. Tap Spent: 5 expenses and "See all (11)". Tap "See all": the Activity screen is titled "Activity · <current month>" with Spent selected and 11 expenses. (US1-3, US3-1)
4. Pick All, then Income, then Savings: 12 rows, 1 row, "No savings this month.". (US3-2, US3-3)
5. Pick All, scroll to the oldest row, tap it, change the amount and save: back on Activity with the new amount. Delete another entry: it disappears from Activity. (US2-2)
6. Go back: home still has Spent selected and its figures include both changes. (US2-3, US3-4)
7. `npm run demo`, open a past month with many entries, tap "See all": that month's entries, scrolling smoothly to the bottom. (US2-4, US2-5)
