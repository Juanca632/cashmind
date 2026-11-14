# Maestro smoke flows

A small smoke suite run with [Maestro](https://maestro.mobile.dev) on the **release APK** (the same production build that is published). Jest covers behavior and every acceptance scenario; these flows only check what Jest cannot see on a real device: the real database across restarts, the Android calendar, the keyboard and the back button, and the confirm dialogs.

## When to run

Before each release, on the release candidate: after the version is bumped on `develop`, build the production APK from `develop` and run these flows on it. If they pass, merge `develop` into `main` and upload that same APK to the release the CD creates; never rebuild it. If a flow fails, fix it on `develop`, build a new APK and run the flows again.

## Prerequisites

- An Android emulator running (never a real phone: every flow clears the app's data).
- No other build of the app installed. Uninstall it first, on the emulator only: `adb uninstall com.juancrestrepo.cashmind`.
- Install the release APK: `adb install <path-to-apk>`.
- Maestro on the PATH (`$HOME/.maestro/bin`).

## Run

```bash
MAESTRO_OPTS=-Xmx512m maestro test .maestro/
```

One flow: `MAESTRO_OPTS=-Xmx512m maestro test .maestro/03-edit-and-delete.yaml`.

## Notes

- Every flow starts from empty data (`subflows/launch-clean.yaml` clears the app state). The persistence flow restarts the app without clearing it, on purpose.
- Flows use the emulator's real date and no hard-coded dates.
- Amounts use a no-break space before "€" and a narrow no-break space as thousands separator, so the flows match them with `.`.
- `subflows/` holds shared steps; `config.yaml` only picks the top-level files.
