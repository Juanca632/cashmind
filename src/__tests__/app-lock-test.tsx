import { AppState, type AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { act, fireEvent, screen } from 'expo-router/testing-library';

import { press, reopenApp, startApp, typeNote } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

// In Jest the app config is empty: give it the installed version the scenario names.
jest.mock('expo-constants', () => {
  const actual = jest.requireActual('expo-constants');
  const constants = new Proxy(actual.default, {
    get: (target, key) => (key === 'expoConfig' ? { name: 'cashmind', slug: 'cashmind', version: '1.6.0' } : target[key]),
  });
  return { __esModule: true, ...actual, default: constants };
});

const level = LocalAuthentication.getEnrolledLevelAsync as jest.Mock;
const authenticate = LocalAuthentication.authenticateAsync as jest.Mock;
const TODAY: [number, number, number] = [2026, 10, 24];
const ENTRIES = [
  { date: '2026-11-01', kind: 'income' as const, amountCents: 200000, note: 'Salary' },
  { date: '2026-11-03', kind: 'expense' as const, amountCents: 4200, note: 'Groceries' },
];

const phoneWithLock = () => level.mockResolvedValue(LocalAuthentication.SecurityLevel.SECRET);
const unlockWith = (result: unknown) => authenticate.mockResolvedValue(result);
const passes = () => unlockWith({ success: true });
const cancels = () => unlockWith({ success: false, error: 'user_cancel' });
const lockedOut = () => unlockWith({ success: false, error: 'lockout' });

let listeners: ((state: AppStateStatus) => void)[] = [];
beforeEach(() => {
  level.mockReset().mockResolvedValue(LocalAuthentication.SecurityLevel.NONE);
  authenticate.mockReset().mockResolvedValue({ success: false, error: 'not_available' });
  listeners = [];
  // The test plays the part of Android: it keeps the app's "change" listeners and calls them.
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((type: any, handler: any) => {
    if (type === 'change') listeners.push(handler);
    return { remove: () => (listeners = listeners.filter((l) => l !== handler)) };
  }) as any);
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const emit = (state: AppStateStatus) =>
  act(async () => {
    listeners.forEach((l) => l(state));
  });
const awayFor = async (ms: number) => {
  await emit('background');
  await act(async () => {
    jest.setSystemTime(Date.now() + ms);
  });
  await emit('active');
};
const settle = () => act(async () => {});
const expectLocked = async () => {
  expect(await screen.findByRole('button', { name: 'Unlock' })).toBeOnTheScreen();
  expect(screen.getByText('CashMind')).toBeOnTheScreen();
  expect(screen.queryByText('Groceries')).not.toBeOnTheScreen();
  expect(screen.queryByLabelText(/^Left to spend: /)).not.toBeOnTheScreen();
};
const expectHome = async () => {
  expect(await screen.findByText('Groceries')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Unlock' })).not.toBeOnTheScreen();
};
const flip = () => fireEvent(toggle(), 'valueChange', !toggle().props.value);
const toggle = () => screen.getByRole('switch', { name: 'Lock with fingerprint' });

describe('Only I can open my finances', () => {
  it('Opening: the locked screen shows no data and the phone prompt appears by itself', async () => {
    phoneWithLock();
    cancels();
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectLocked();
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Too many attempts. Try again in a moment.')).not.toBeOnTheScreen();
  });

  it('Unlocked: passing the prompt shows the home screen', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectHome();
    expect(screen.getByLabelText(/^Left to spend: /)).toBeOnTheScreen();
  });

  it('Cancelled or failed: the locked screen stays and Unlock shows the prompt again', async () => {
    phoneWithLock();
    cancels();
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectLocked();
    expect(authenticate).toHaveBeenCalledTimes(1);

    unlockWith({ success: false, error: 'authentication_failed' });
    await press('Unlock');
    await expectLocked();
    expect(authenticate).toHaveBeenCalledTimes(2);

    passes();
    await press('Unlock');
    await expectHome();
    expect(authenticate).toHaveBeenCalledTimes(3);
  });

  it('Too many attempts: the locked screen explains and Unlock stays available', async () => {
    phoneWithLock();
    lockedOut();
    await startApp({ today: TODAY, entries: ENTRIES });
    expect(await screen.findByText('Too many attempts. Try again in a moment.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Unlock' })).toBeOnTheScreen();
    expect(screen.queryByText('Groceries')).not.toBeOnTheScreen();

    passes();
    await press('Unlock');
    await expectHome();
    expect(screen.queryByText('Too many attempts. Try again in a moment.')).not.toBeOnTheScreen();
  });

  it('Short trip away: 1 minute or less does not ask again', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectHome();
    authenticate.mockClear();

    await awayFor(30_000);
    await expectHome();
    await awayFor(60_000);
    await expectHome();
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('Longer trip away: locks, asks again, and returns to the same screen with typed text kept', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectHome();
    await press('Add expense');
    await typeNote('Birthday gift');
    expect(screen).toHavePathname('/entry');
    authenticate.mockClear();
    cancels();

    await awayFor(61_000);

    expect(await screen.findByRole('button', { name: 'Unlock' })).toBeOnTheScreen();
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(screen.queryByDisplayValue('Birthday gift')).not.toBeOnTheScreen();

    passes();
    await press('Unlock');
    await settle();
    expect(screen.queryByRole('button', { name: 'Unlock' })).not.toBeOnTheScreen();
    expect(screen).toHavePathname('/entry');
    expect(screen.getByDisplayValue('Birthday gift')).toBeOnTheScreen();
  });

  it('Lock off: the app never shows the locked screen', async () => {
    phoneWithLock();
    cancels();
    await startApp({ today: TODAY, entries: ENTRIES, raw: ["INSERT INTO setting (key, value) VALUES ('app_lock', 'off')"] });
    await expectHome();
    await awayFor(120_000);
    await expectHome();
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('Unreadable setting: the app treats the lock as on', async () => {
    phoneWithLock();
    cancels();
    await startApp({ today: TODAY, entries: ENTRIES, raw: ["INSERT INTO setting (key, value) VALUES ('app_lock', 'banana')"] });
    await expectLocked();
  });
});

describe('Settings screen and turning the lock off or on', () => {
  const openSettings = async () => {
    await expectHome();
    await press('Settings');
  };

  it('Opening Settings: the gear opens Settings with Security and About sections', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    expect(await screen.findByLabelText(/^Left to spend: /)).toBeOnTheScreen();
    await press('Settings');
    expect(screen).toHavePathname('/settings');
    expect(screen.getByText('Security')).toBeOnTheScreen();
    expect(screen.getByText('About')).toBeOnTheScreen();
    expect(toggle()).toBeOnTheScreen();
    const version = '1.6.0';
    expect(screen.getByText(`Version ${version}`)).toBeOnTheScreen();
  });

  it('Opening Settings: the gear is there in a past month too', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    await screen.findByLabelText(/^Left to spend: /);
    await press(/^Month:/);
    await press('Sep');
    expect(screen.getByRole('button', { name: 'Month: September 2026' })).toBeOnTheScreen();
    await press('Settings');
    expect(screen).toHavePathname('/settings');
  });

  it('On by default: the switch is on when nothing is stored', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    await openSettings();
    expect(await screen.findByRole('switch', { name: 'Lock with fingerprint' })).toBeChecked();
  });

  it('Turning off: passing the prompt turns it off and the app opens without lock after a restart', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    await openSettings();
    await screen.findByRole('switch', { name: 'Lock with fingerprint' });
    authenticate.mockClear();

    await flip();
    await settle();
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(toggle()).not.toBeChecked();

    // Remembered: reopening from scratch shows no locked screen, even though the prompt would fail.
    cancels();
    authenticate.mockClear();
    await reopenApp();
    await expectHome();
    expect(authenticate).not.toHaveBeenCalled();
    await press('Settings');
    expect(await screen.findByRole('switch', { name: 'Lock with fingerprint' })).not.toBeChecked();
  });

  it('Turning off: cancelling or failing keeps the switch on', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    await openSettings();
    await screen.findByRole('switch', { name: 'Lock with fingerprint' });

    cancels();
    await flip();
    await settle();
    expect(toggle()).toBeChecked();

    unlockWith({ success: false, error: 'authentication_failed' });
    await flip();
    await settle();
    expect(toggle()).toBeChecked();

    // Still on after a restart: the app locks.
    await reopenApp();
    await expectLocked();
  });

  const startWithLockOff = async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES, raw: ["INSERT INTO setting (key, value) VALUES ('app_lock', 'off')"] });
    await openSettings();
    await screen.findByRole('switch', { name: 'Lock with fingerprint' });
  };

  it('Turning on: passing the prompt once turns it on and the app locks after a restart', async () => {
    await startWithLockOff();
    expect(toggle()).not.toBeChecked();
    authenticate.mockClear();

    await flip();
    await settle();
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(toggle()).toBeChecked();

    cancels();
    await reopenApp();
    await expectLocked();
  });

  it('Turning on: cancelling or failing keeps the switch off', async () => {
    await startWithLockOff();
    cancels();
    await flip();
    await settle();
    expect(toggle()).not.toBeChecked();

    await reopenApp();
    await expectHome();
  });

  it('Remembered: with the lock off the app opens without the locked screen', async () => {
    await startWithLockOff();
    await reopenApp();
    await expectHome();
  });
});

describe('A phone with no screen lock', () => {
  it('No lock: the app opens without the locked screen, whatever the switch says', async () => {
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectHome();
    await awayFor(120_000);
    await expectHome();
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('Explained: Settings shows the switch off, disabled, with the hint', async () => {
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectHome();
    await press('Settings');
    expect(await screen.findByText('Set up a screen lock on your phone to use this.')).toBeOnTheScreen();
    expect(toggle()).not.toBeChecked();
  });

  it('Explained: the stored setting does not change, so setting up a lock later locks the app', async () => {
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectHome();
    await press('Settings');
    await screen.findByText('Set up a screen lock on your phone to use this.');

    phoneWithLock();
    cancels();
    await reopenApp();
    await expectLocked();
  });

  it('Phone lock removed later: the app stops locking on return', async () => {
    phoneWithLock();
    passes();
    await startApp({ today: TODAY, entries: ENTRIES });
    await expectHome();

    level.mockResolvedValue(LocalAuthentication.SecurityLevel.NONE);
    authenticate.mockClear();
    await awayFor(120_000);
    await expectHome();
    expect(authenticate).not.toHaveBeenCalled();
  });
});
