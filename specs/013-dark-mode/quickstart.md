# Quickstart: Dark Mode

```bash
npx jest --maxWorkers=4
npx tsc --noEmit
npx expo lint
```

## On the emulator (demo mode, `npm run demo`)

Switch with `adb shell cmd uimode night yes` / `adb shell cmd uimode night no`.

1. Dark: home (card, tiles with bar, Activity, Show all), an entry form (kind options selected and not, date row, Delete dialog), My plan, the month picker (selected and current month): dark backgrounds, readable text, kind colors distinct. (US1-1, US1-4, US1-5)
2. Status bar icons light, headers dark. (US1-6)
3. While on home, switch to light: the app follows without restarting and looks as before. (US1-2, US1-3)
4. An overspent month (two months ago in demo) is red in both themes. (US1-5)
