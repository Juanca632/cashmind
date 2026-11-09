# Quickstart: Recorded Income

```bash
npx jest --maxWorkers=4
npx tsc --noEmit
npx expo lint
npm run demo
```

On the phone, with invented data:

1. A new month asks for income and offers repeating the last one. Tap repeat and the card fills in.
2. Earn adds an income; the card and tiles update.
3. Edit plan: type a trial income, see the split, save. Home does not change because of the trial.
4. My plan shows the ring for this month's income.
5. Install over a version with real plans: each past month keeps its figures.
