# Quickstart: Currency

## Automated

```bash
npx jest --maxWorkers=2
npx expo lint
npx tsc --noEmit
```

## On the phone

1. `npm run demo`, then open Settings with the gear.
   - **Expected**: Currency shows Euro selected, and every amount looks as before.
2. Pick US dollar and go back.
   - **Expected**: home, the tiles, the lists, Activity, My plan and Trends all show "$1,234.56"-style amounts.
3. Tap Add.
   - **Expected**: "$" is before the amount, "0.00" is the placeholder, and you can save "12.50".
4. Pick Colombian peso.
   - **Expected**: amounts show "$ 1.234"-style. The form has a digits keyboard, and "45000" saves as $ 45.000.
5. Pick Euro again.
   - **Expected**: every amount is back to what it was, and nothing was converted.
6. Close the app fully and reopen it.
   - **Expected**: the last currency picked is still used.
7. Check dark mode, and that a long peso amount fits the home tiles and the big figure.
