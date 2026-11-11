// Haptics cannot run in Jest: replace them by spies so tests can assert which vibration played.
// (Reanimated is set up by the "resolver" entry of the Jest config in package.json.)
jest.mock('expo-haptics', () => ({
  AndroidHaptics: { Confirm: 'Confirm', Long_Press: 'Long_Press', Clock_Tick: 'Clock_Tick' },
  performAndroidHapticsAsync: jest.fn(() => Promise.resolve()),
}));
