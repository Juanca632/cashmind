# Quickstart: Trends

## Automated

```bash
npx jest --maxWorkers=2 src/features/home
npx expo lint
npx tsc --noEmit
```

Expect the `trends` unit tests and the Trends integration journey to pass (spec Stories 1–4).

## On the phone

1. `npm run demo` (six months of invented data) and open the app in Expo Go.
2. On home, under "Spending pace", tap "See trends ›": Spent is selected, six bars end at the current month, the sentence starts with "So far,".
3. Tap an earlier bar: the number, sentence and categories change; the screen stays.
4. Tap Saved: goal marks and "Goal reached in X of the last Y months" show.
5. Tap a category: its six months and "Usually X / month"; go back — same pill and month.
6. Tap "Open <Month> ›": home shows that month.
7. Switch the phone to dark mode and check bars, line and text stay readable.
