# Research: Data Backup

## R1. Is the app's data already backed up by Android?

- **Decision**: Yes. Keep it, and set `android.allowBackup: true` explicitly in `app.json` so the intent is written down and does not depend on a default.
- **Rationale**: Expo's config plugin defaults `allowBackup` to `true` (`@expo/config-plugins/build/android/AllowBackup.js`), and a prebuild of this project produces `android:allowBackup="true"` with no backup rules. With no rules, Android Auto Backup includes everything under `getFilesDir()`. `expo-sqlite` stores its databases in `filesDir/SQLite` (`SQLiteModule.kt`), so `cashmind.db` and its WAL files are included.
- **Alternatives considered**: a custom backup agent or key-value backup (much more code, no benefit for one small database); manual export/import (dropped by the developer: no manual backups).

## R2. Can a backup be half-written (FR-002)?

- **Decision**: No extra work.
- **Rationale**: Android docs: "During Auto Backup, the system shuts down the app to make sure it is no longer writing to the file system", and by default apps in the foreground are not backed up. SQLite's WAL is replayed on the next open, so a restored copy is the database as of the moment the app was stopped.
- **Alternatives considered**: checkpointing the WAL before backup (needs a backup agent; not needed since the app is stopped).

## R3. Is restore done for an APK installed by hand?

- **Decision**: Expected yes; proven by the E2E check in [quickstart.md](./quickstart.md).
- **Rationale**: Android docs: "Data is restored whenever the app is installed, whether from the Play Store, during device setup, or by running adb install." Restore needs the same package name (`com.juancrestrepo.cashmind`). A backup is not restored into an app with a lower `versionCode` than the one that made it; EAS raises the version code on every build, so upgrades are fine.
- **Alternatives considered**: none. If the E2E check fails, the feature is revisited before v1.0.0 (spec Assumptions).

## R4. Restoring a backup from an older app version (FR-003)

- **Decision**: No extra work.
- **Rationale**: The restored file is a normal database at an older `user_version`; `migrateDbIfNeeded` runs on every open and upgrades it, as for any app update. Migration tests already cover each released schema (`src/test-support/released-schemas.ts`).

## R5. Excluding the demo database (FR-004)

- **Decision**: No backup rules needed.
- **Rationale**: Demo mode exists only when Metro runs with `EXPO_PUBLIC_DEMO=1` (`npm run demo`); release builds never set it, so `cashmind-demo.db` is never created by the APK. In development the app runs inside Expo Go, whose backup is not the app's.
- **Alternatives considered**: a config plugin with `dataExtractionRules`/`fullBackupContent` XML excluding the file (extra native config for a file that never exists in a release build).

## R6. How to test it

- **Decision**: E2E on the emulator with an EAS-built APK, using Android's local backup transport: `bmgr enable true`, select `com.android.localtransport/.LocalTransport`, `bmgr backupnow <package>`, uninstall, reinstall, check the data.
- **Rationale**: These are the commands from Android's "Test backup and restore" guide, and they need no Google account on the emulator. Expo Go cannot be used: its backup belongs to Expo Go, not to CashMind. There is no local Java/Android SDK in WSL, so the APK comes from EAS (`preview` profile).
- **Automated tests**: one config test that `app.json` keeps `android.allowBackup` set to `true`, so a later change cannot turn backups off silently.
