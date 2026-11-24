import { LOCK_AFTER_MS, shouldLockOnReturn } from '../rules';

describe('Only I can open my finances: when the app locks on return', () => {
  it('Short trip away: the lock time is 1 minute', () => {
    expect(LOCK_AFTER_MS).toBe(60_000);
  });

  it('Short trip away: 1 minute or less does not lock', () => {
    expect(shouldLockOnReturn(0)).toBe(false);
    expect(shouldLockOnReturn(30_000)).toBe(false);
    expect(shouldLockOnReturn(60_000)).toBe(false);
  });

  it('Longer trip away: more than 1 minute locks', () => {
    expect(shouldLockOnReturn(60_001)).toBe(true);
    expect(shouldLockOnReturn(61_000)).toBe(true);
    expect(shouldLockOnReturn(3_600_000)).toBe(true);
  });
});
