# Quickstart: Settings and app lock

## Automated

```bash
npx jest --maxWorkers=2 src/features/settings src/db src/__tests__
npx expo lint
npx tsc --noEmit
```

Expect these to pass:
- the `shouldLockOnReturn` and setting read-check unit tests;
- the migration 7 → 8 upgrade test, with every entry, repeat and plan kept;
- the integration journeys for spec Stories 1–3.

## On the emulator (PIN fallback check)

1. Set a PIN on the emulator: `adb shell locksettings set-pin 1234`.
2. `npx expo start` and open the app.
   - **Expected**: the locked screen, then the system prompt "Unlock CashMind" with a PIN option.
3. Enter 1234.
   - **Expected**: home shows.
4. Press Home and come back within 30 s.
   - **Expected**: no prompt.
5. Press Home, wait more than 1 minute and come back.
   - **Expected**: the locked screen and the prompt. After unlocking, the same screen shows.
6. Open an entry form, type an amount, leave for more than 1 minute and come back.
   - **Expected**: after unlocking, the amount is still there.
7. Cancel the prompt.
   - **Expected**: the locked screen stays. Tap Unlock and the prompt is back.
8. Open the gear and then Settings.
   - **Expected**: "Lock with fingerprint" is on and "Version" shows.
9. Turn the switch off.
   - **Expected**: the prompt opens; enter the PIN and the switch is off.
10. Close the app fully and reopen it.
    - **Expected**: no lock.
11. Clear the PIN: `adb shell locksettings clear --old 1234`. Open Settings.
    - **Expected**: the switch is disabled with the hint.
12. Check dark mode, and TalkBack on the locked screen (only "CashMind" and "Unlock" are read).

## Upgrade

Install the 1.5.0 APK with data, then install this build over it.
- **Expected**: all data is still there, the app locks (when a PIN is set) and Settings shows the switch on.
