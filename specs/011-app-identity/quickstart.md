# Quickstart: App Identity

```bash
npx jest --maxWorkers=4
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## On the emulator, with the production APK

Build with `npx eas-cli@latest build --platform android --profile production` and install the APK with `adb install <path>.apk`.

1. Launcher and app drawer: the icon is a white open C on green; the label reads "CashMind". (US1-1)
2. Long-press the icon or change the launcher shape if available: the C stays whole. (US1-2)
3. Settings → Wallpaper & style → Themed icons on: the C shows in system colors. (US1-3)
4. Open the app: the start screen is green with the white C, then home appears. (US1-4)
5. Record an invented expense, install the same or a newer production APK over it with `adb install -r`: it installs and the expense is still there. (US2-2)
