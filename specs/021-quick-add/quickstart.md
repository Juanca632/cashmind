# Quickstart: Quick add

## Automated

```bash
npx jest --maxWorkers=2 src/features/entries src/__tests__
npx expo lint
npx tsc --noEmit
```

Expect the `quickAddSuggestions` unit tests and the quick-add integration journeys to pass (spec Stories 1–2).

## On the phone

1. `npm run demo` and open the app.
2. Tap Add: under the amount, "Recent" shows "Coffee · 2,50 €" and "Transport pass · 60,00 €".
3. Tap "Coffee": amount 2,50, Eating out selected, note "Coffee"; the date is still today. Tap the add button: home lists the new Coffee.
4. Open Add again and switch to Income: the row disappears; back to Expense: it is back.
5. Open an existing entry: no "Recent" row.
6. Fill from a suggestion and press back: the app asks before discarding.
7. Check dark mode and a long note: pills stay on one line each and wrap to a second row.
