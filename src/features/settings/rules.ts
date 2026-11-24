/** The app locks again when it was away from the foreground for longer than this (specs/023). */
export const LOCK_AFTER_MS = 60_000;

/** True when coming back after `awayMs` milliseconds away should ask to unlock again. */
export function shouldLockOnReturn(awayMs: number): boolean {
  return awayMs > LOCK_AFTER_MS;
}
