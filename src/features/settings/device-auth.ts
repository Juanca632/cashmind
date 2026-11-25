/** The phone's own authentication (fingerprint, face, or its PIN, pattern or password). */
import {
  SecurityLevel,
  authenticateAsync,
  getEnrolledLevelAsync,
  type LocalAuthenticationError,
} from 'expo-local-authentication';

export type AuthOutcome = 'ok' | 'cancelled' | 'lockout' | 'failed';

const CANCELLED: readonly LocalAuthenticationError[] = ['user_cancel', 'system_cancel', 'app_cancel'];

let prompting = false;

/**
 * True while the phone's prompt is open. Its PIN screen can send the app to the background, and
 * that must not count as leaving the app.
 */
export function isPrompting(): boolean {
  return prompting;
}

/** True when the phone has a screen lock or biometrics set up, so it can confirm its owner. */
export async function hasDeviceLock(): Promise<boolean> {
  try {
    return (await getEnrolledLevelAsync()) !== SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/** Shows the phone's unlock prompt. The phone's PIN, pattern or password is offered as a fallback. */
export async function authenticate(): Promise<AuthOutcome> {
  prompting = true;
  try {
    const result = await authenticateAsync({ promptMessage: 'Unlock CashMind' });
    if (result.success) return 'ok';
    if (CANCELLED.includes(result.error)) return 'cancelled';
    if (result.error === 'lockout') return 'lockout';
    return 'failed';
  } catch {
    return 'failed';
  } finally {
    prompting = false;
  }
}
