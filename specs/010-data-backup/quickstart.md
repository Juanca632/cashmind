# Quickstart: Data Backup

```bash
npx jest --maxWorkers=4
npx tsc --noEmit
npx expo lint
```

## Backup and restore on the emulator (invented amounts)

Needs an APK of the app built by EAS (`preview` or `production` profile); Expo Go cannot be used, because its backup is Expo Go's, not CashMind's. Emulator only, never a real phone.

1. Install the APK: `adb install <path>.apk`. Open the app: home asks for this month's income.
2. Record invented data: an income of 2000 €, an expense of 900 € with the note "Backup test", a saving of 150 €, and set the plan to 30 %. Note what home shows (left to spend 500 €).
3. Open the app once and press Home (do not force-stop it: Android does not back up a stopped app and answers "Backup is not allowed"), then back up with Android's local transport:
   ```bash
   adb shell bmgr enable true
   adb shell bmgr transport com.android.localtransport/.LocalTransport
   adb shell bmgr backupnow com.juancrestrepo.cashmind
   ```
   Expected: `Package com.juancrestrepo.cashmind with result: Success`.
4. `adb uninstall com.juancrestrepo.cashmind`, then `adb install <path>.apk` again.
5. Open the app: home shows the same income, expense ("Backup test"), saving and 500 € left; My plan shows 30 %. (Spec User Story 1, scenario 1.)
6. Backup off: `adb shell bmgr enable false`, uninstall, install again. The app starts empty and works. Turn it back on afterwards with `adb shell bmgr enable true`. (Scenario 3.)
