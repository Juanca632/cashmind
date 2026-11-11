# Quickstart: Polish

```bash
npx jest --maxWorkers=4
npx tsc --noEmit
npx expo lint
```

## On the emulator, fresh install (invented amounts)

1. Add an income of 1000 € with the plan at 20 %: the Savings tile shows "0 € of 200 €" and an empty bar. (US1)
2. Add a saving of 50 €: back on home the figure runs down to 750 € and the bar fills a quarter; the new row fades in. (US1-1, US3-1, US3-2, US3-4)
3. Add an expense of 900 €: the figure runs to -150 € and the card fades to red. (US2-1, US3-5)
4. Delete that expense: the row fades out, the card fades back to green. (US2-2, US3-2)
5. Press and hold a tile, a button and a kind option: each shrinks slightly and springs back; an Activity row highlights instead. (US3-3)
6. Tap Spent, then Show all: rows fade and slide into place. (US3-2)
7. Save 150 € more savings so saved ≥ goal: the bar is full and the tile says "Goal reached". (US1-2)
8. Plan at 0 %: "No goal", no bar. (US1-3)
9. Settings → Accessibility → Remove animations on: repeat step 2; everything changes at once. (US3-6)

Vibrations (US4) are checked on a real phone; the emulator has no vibration motor.
