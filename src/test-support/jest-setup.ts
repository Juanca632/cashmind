// Haptics cannot run in Jest: replace them by spies so tests can assert which vibration played.
// (Reanimated is set up by the "resolver" entry of the Jest config in package.json.)
jest.mock('expo-haptics', () => ({
  AndroidHaptics: { Confirm: 'Confirm', Long_Press: 'Long_Press', Clock_Tick: 'Clock_Tick' },
  performAndroidHapticsAsync: jest.fn(() => Promise.resolve()),
}));

// The phone's authentication cannot run in Jest. By default the phone has NO screen lock, so the app
// never locks and every other suite opens the app as before. Tests override the jest.fn()s to
// simulate a phone with a lock, and answers of the prompt.
jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  hasHardwareAsync: jest.fn(() => Promise.resolve(false)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(false)),
  getEnrolledLevelAsync: jest.fn(() => Promise.resolve(0)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: false, error: 'not_available' })),
}));
