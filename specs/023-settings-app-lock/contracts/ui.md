# UI Contract: Settings and app lock

## Home

- A gear button at the top, after "My plan", in every month (past months too). Its accessible name is "Settings", and it opens the Settings screen.

## Settings (`/settings`, header title "Settings")

- **Section "Security"**: a switch "Lock with fingerprint", whose accessible name is "Lock with fingerprint" with its on/off state.
  - **Phone with a lock**: the switch shows the stored setting, which is on when none is stored. Changing it opens the phone's prompt. On success the setting is saved and the switch moves. On cancel or failure it stays as it was.
  - **Phone without a lock**: the switch is off and disabled, with the hint under it: "Set up a screen lock on your phone to use this."
- **Section "About"**: "Version X.Y.Z", the installed version.

## Locked screen

- It covers the whole app. It shows "CashMind" and a button "Unlock", whose accessible name is "Unlock". No amount, entry, month or header is visible or readable by TalkBack.
- The phone's prompt ("Unlock CashMind") opens by itself when the lock starts, and on each "Unlock" tap.
- After too many attempts it shows "Too many attempts. Try again in a moment.".
- Back leaves the app.
- Unlocking removes the cover. The screen, scroll and typed text underneath are as they were.

## When it locks

- **Cold start**: it locks if the setting is on and the phone has a lock.
- **Return to the foreground**: it locks if the app was away more than 60 s, the setting is on and the phone has a lock. It never locks after 60 s or less.
