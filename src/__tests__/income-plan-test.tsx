import { fireEvent, screen, testRouter } from 'expo-router/testing-library';

import { answerDialog, exactText, partialText, reopenApp, standardPlan, startApp, type TestPlan } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const FIXED = 'Item 1 amount';
const INCOME = 'Income';
const TODAY: [number, number, number] = [2026, 10, 7];

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
const typeFixed = async (amount: string) => {
  await type('Item 1 name', 'House');
  await type(FIXED, amount);
};
/** A first-time setup, up to choosing the split. */
const setUpPlan = async (fixedAmount: string) => {
  await startApp({ today: TODAY });
  await press('Set up my plan');
  await typeFixed(fixedAmount);
  await press('Next');
};

describe('Live euro preview while editing', () => {
  it('Preview updates on change', async () => {
    const tenPercent: TestPlan = { ...standardPlan, keptAmount: { unit: 'pct', pct: 10 } };
    await startApp({ today: TODAY, plans: [[tenPercent, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    expect(screen.getByText('200,00 €')).toBeOnTheScreen();
    expect(screen.getByText('800,00 €')).toBeOnTheScreen();
    expect(screen.getByLabelText('Leisure')).toHaveDisplayValue('40');

    await type('Savings', '25');

    expect(screen.getAllByText('500,00 €')).toHaveLength(2);
    expect(screen.getByLabelText('Leisure')).toHaveDisplayValue('25');

    // Nothing was saved: the home screen still shows the old targets.
    await testRouter.back();
    await answerDialog('Discard');
    await testRouter.back();
    expect(screen.getByText(exactText('200 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('800 € left'))).toBeOnTheScreen();
  });

  it('The trial income changes the preview and nothing else', async () => {
    await startApp({ today: TODAY, plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    await type(INCOME, '2500');

    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('30');
    expect(screen.getAllByText('750,00 €')).toHaveLength(2);
    expect(screen.getByLabelText('Leisure')).toHaveDisplayValue('30');

    await testRouter.back();
    expect(screen.queryByTestId('confirm-dialog')).not.toBeOnTheScreen();
    await testRouter.back();
    expect(screen.getByText(exactText('600 € to go'))).toBeOnTheScreen();
  });
});

describe('Current month overview', () => {
  it('First launch', async () => {
    await startApp({ today: TODAY });

    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Set up my plan' })).toBeOnTheScreen();
    expect(screen.queryByText('Leisure')).not.toBeOnTheScreen();
  });

  it('Plan exists', async () => {
    await startApp({ today: TODAY, plans: [[standardPlan, '2026-07']] });

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Spent this month')).toBeOnTheScreen();
    expect(screen.getByText(exactText('600 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 000'))).toBeOnTheScreen();
  });
});

describe('On-device persistence', () => {
  it('Restart keeps the plan', async () => {
    await setUpPlan('1000');
    await type('Savings', '30');
    await press('Save plan');

    await reopenApp();
    await press('My plan');
    await press('Edit plan');
    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('30');

    await testRouter.back();
    await press('Edit fixed expenses');
    expect(screen.getByLabelText(FIXED)).toHaveDisplayValue('1000,00');
  });
});

describe('Fixed expenses as a list', () => {
  it('Fixed expenses above income', async () => {
    await setUpPlan('2100');
    await type(INCOME, '2000');

    expect(screen.getByText(partialText('100,00 € over this income'))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeEnabled();
  });
});

describe('Income below fixed expenses', () => {
  it('Month that does not cover fixed expenses', async () => {
    await startApp({ today: TODAY, plans: [[standardPlan, '2026-07']], overrides: { '2026-11': 80000 } });

    expect(screen.getByText(/short of your fixed expenses/)).toBeOnTheScreen();
    expect(screen.getByText(/This income is 200,00.€ short/)).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 € left'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 € to go'))).toBeOnTheScreen();
  });
});

describe('Plan changes apply from the current month onwards', () => {
  const setSavings = async (percent: string) => {
    await press('My plan');
    await press('Edit plan');
    await type('Savings', percent);
    await press('Save plan');
    await testRouter.back();
  };
  const openMonth = async (shortName: string) => {
    await press(/^Month:/);
    await press(shortName);
  };

  it('Changing the plan in a later month', async () => {
    await startApp({ today: [2026, 11, 8], plans: [[standardPlan, '2026-07']] });
    await setSavings('40');
    expect(screen.getByText(exactText('800 € to go'))).toBeOnTheScreen();

    await openMonth('Nov');
    expect(screen.getByText(exactText('600 € to go'))).toBeOnTheScreen();
  });

  it('Saving twice in the same month', async () => {
    await startApp({ today: TODAY, plans: [[standardPlan, '2026-07']] });
    await setSavings('40');
    await setSavings('50');
    expect(screen.getByText(exactText('1 000 € to go'))).toBeOnTheScreen();

    await openMonth('Oct');
    expect(screen.getByText(exactText('600 € to go'))).toBeOnTheScreen();
  });
});

describe('Savings and leisure as a percentage of the income', () => {
  it('Savings as a percentage', async () => {
    await setUpPlan('1000');
    await type(INCOME, '2000');
    await type('Savings', '30');

    expect(screen.getByText('600,00 €')).toBeOnTheScreen();
  });
});

describe('Last edited of leisure and savings is kept', () => {
  it('Two fields filled, third automatic', async () => {
    await setUpPlan('1000');
    await type(INCOME, '2000');
    await type('Savings', '30');

    expect(screen.getByLabelText('Leisure')).toHaveDisplayValue('20');
  });

  it('Switching which bucket is kept', async () => {
    await startApp({ today: TODAY, plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    await type('Leisure', '25');

    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('25');
  });
});

describe('A plan that does not fit a trial income', () => {
  it('Kept bucket too high', async () => {
    await setUpPlan('1000');
    await type(INCOME, '2000');
    await type('Savings', '60');

    expect(screen.getByText(partialText('200,00 € over this income'))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeEnabled();
  });
});

describe('The plan at a glance', () => {
  it('Split shown on the plan screen', async () => {
    await startApp({ today: TODAY, plans: [[standardPlan, '2026-07']] });
    await press('My plan');

    expect(screen.getByText(/^50.%$/)).toBeOnTheScreen();
    expect(screen.getByText(/^20.%$/)).toBeOnTheScreen();
    expect(screen.getByText(/^30.%$/)).toBeOnTheScreen();
  });
});
