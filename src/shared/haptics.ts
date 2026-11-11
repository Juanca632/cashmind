import { AndroidHaptics, performAndroidHapticsAsync } from 'expo-haptics';

/**
 * Short vibrations that confirm an action. They use Android's haptics engine, which follows the
 * phone's touch-feedback setting and needs no vibrate permission. A failure is never shown: the
 * screen already confirms the action.
 */
function play(type: AndroidHaptics) {
  performAndroidHapticsAsync(type).catch(() => {});
}

/** A save worked. */
export const hapticSuccess = () => play(AndroidHaptics.Confirm);

/** A delete was confirmed and done. */
export const hapticDelete = () => play(AndroidHaptics.Long_Press);

/** An option was chosen. */
export const hapticTick = () => play(AndroidHaptics.Clock_Tick);
