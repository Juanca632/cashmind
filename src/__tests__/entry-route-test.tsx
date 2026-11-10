import { screen, testRouter } from 'expo-router/testing-library';

import { headerTitles, press, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const TODAY: [number, number, number] = [2026, 10, 7];

describe('Rename: entries are called entries everywhere (route)', () => {
  it('The Add expense button opens the entry form at /entry', async () => {
    await startApp({ today: TODAY });
    await press('Add expense');

    expect(screen).toHavePathname('/entry');
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeOnTheScreen();
  });

  it('/entry opens the entry form', async () => {
    await startApp({ today: TODAY });
    await testRouter.navigate('/entry');

    expect(screen).toHavePathname('/entry');
    expect(headerTitles().at(-1)).toBe('Add expense');
  });

  it('/entry?kind=savings opens the form for savings', async () => {
    await startApp({ today: TODAY });
    await testRouter.navigate('/entry?kind=savings');

    expect(headerTitles().at(-1)).toBe('Add to savings');
    expect(screen.getByRole('button', { name: 'Add to savings' })).toBeOnTheScreen();
  });

  it('The old route /expense no longer exists', async () => {
    await startApp({ today: TODAY });
    await testRouter.navigate('/expense');

    expect(screen).not.toHavePathname('/entry');
    expect(screen.queryByRole('button', { name: 'Add expense' })).not.toBeOnTheScreen();
    expect(screen.queryByText('Left to spend')).not.toBeOnTheScreen();
  });
});
