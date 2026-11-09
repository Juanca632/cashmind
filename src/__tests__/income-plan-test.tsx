import { fireEvent, screen, testRouter } from 'expo-router/testing-library';

import type { IncomePlan } from '@/features/plan/rules';

import { answerDialog, exactText, partialText, reopenApp, standardPlan, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);
jest.mock('@/global.css', () => ({}));

afterEach(() => {
  jest.useRealTimers();
});

const FIXED = 'Item 1 amount';
const INCOME = 'Income';

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
const typeFixed = async (amount: string) => {
  await type('Item 1 name', 'House');
  await type(FIXED, amount);
};

describe('Recurring monthly income', () => {
  it('Set recurring income', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type(INCOME, '2500');
    await typeFixed('1000');
    await press('Save plan');

    expect(screen.getByText(exactText('0,00 € of 500,00 €'))).toBeOnTheScreen();

    // The following month, without an override, uses the same income.
    await reopenApp([2026, 11, 2]);
    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € of 500,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText(/this month only/i)).not.toBeOnTheScreen();
  });

  it.each([
    ['zero', '0'],
    ['negative', '-5'],
  ])('Reject invalid income (%s)', async (_label, income) => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type(INCOME, '2000');
    await typeFixed('500');
    await type(INCOME, income);

    expect(screen.getByText(/income must be greater than 0/i)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
  });

  it('Empty income', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type(INCOME, '2000');
    await typeFixed('500');
    await type(INCOME, '');

    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
  });
});

describe('Live euro preview while editing', () => {
  it('Preview updates on change', async () => {
    const tenPercent: IncomePlan = { ...standardPlan, keptAmount: { unit: 'pct', pct: 10 } };
    await startApp({ today: [2026, 10, 7], plans: [[tenPercent, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    expect(screen.getByText('= 200,00 €')).toBeOnTheScreen();
    expect(screen.getByText('= 800,00 €')).toBeOnTheScreen();
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('40');

    await type('Savings', '25');

    expect(screen.getAllByText('= 500,00 €')).toHaveLength(2);
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('25');

    // Nothing was saved: the home screen still shows the old targets.
    await testRouter.back();
    await answerDialog('Discard');
    await testRouter.back();
    expect(screen.getByText(exactText('0,00 € of 200,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € of 800,00 €'))).toBeOnTheScreen();
  });
});

describe('Per-month income override', () => {
  it('Month with a different income', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    await press("Change this month's income");
    await type('Income this month', '2500');
    await press('Save for this month');

    expect(screen).toHavePathname('/');
    expect(screen.getAllByText(exactText('0,00 € of 750,00 €'))).toHaveLength(2);
    expect(screen.getByText(partialText('1 000,00 € · 1 item'))).toBeOnTheScreen();
    await press('My plan');
    expect(screen.getByText(/this month only/i)).toBeOnTheScreen();

    await reopenApp([2026, 11, 2]);
    expect(screen.getByText(exactText('0,00 € of 400,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € of 600,00 €'))).toBeOnTheScreen();
  });

  it('Remove the override', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      overrides: { '2026-11': 250000 },
    });
    expect(screen.getAllByText(exactText('0,00 € of 750,00 €'))).toHaveLength(2);

    await press('My plan');

    await press("Change this month's income");
    await press('Use my usual income');
    await answerDialog('Remove');

    expect(screen.getByText(exactText('0,00 € of 400,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € of 600,00 €'))).toBeOnTheScreen();
  });
});

describe('Current month overview', () => {
  it('First launch', async () => {
    await startApp({ today: [2026, 10, 7] });

    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Set up my plan' })).toBeOnTheScreen();
    expect(screen.queryByText('Monthly income')).not.toBeOnTheScreen();
    expect(screen.queryByText('Wants')).not.toBeOnTheScreen();
  });

  it('Plan exists', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Left to spend')).toBeOnTheScreen();
    expect(screen.getByText(exactText('400,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € of 600,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(partialText('1 000,00 € · 1 item'))).toBeOnTheScreen();
  });
});

describe('On-device persistence', () => {
  it('Restart keeps the plan', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type(INCOME, '2000');
    await typeFixed('1000');
    await type('Savings', '30');
    await press('Save plan');
    await press('My plan');
    await press("Change this month's income");
    await type('Income this month', '2500');
    await press('Save for this month');

    await reopenApp();

    expect(screen.getAllByText(exactText('0,00 € of 750,00 €'))).toHaveLength(2);

    await press('My plan');
    await press('Edit plan');
    expect(screen.getByLabelText(INCOME)).toHaveDisplayValue('2000,00');
    expect(screen.getByLabelText(FIXED)).toHaveDisplayValue('1000,00');
    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('30');
  });
});

describe('Fixed expenses as a list', () => {
  it('Fixed expenses above income', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type(INCOME, '2000');
    await typeFixed('2100');

    expect(screen.getByText(partialText('100,00 € over your income'))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();
    await testRouter.back();
    await answerDialog('Discard');
    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
  });
});

describe('Income below fixed expenses', () => {
  it('Month that does not cover fixed expenses', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    await press("Change this month's income");
    await type('Income this month', '800');
    await press('Save for this month');

    expect(screen.getByText(/short of your fixed expenses/)).toBeOnTheScreen();
    expect(screen.getByText(/This income is 200,00.€ short/)).toBeOnTheScreen();
    // Leisure and savings targets are 0,00 €.
    expect(screen.getAllByText(exactText('0,00 € of 0,00 €'))).toHaveLength(2);
  });
});

describe('Plan changes apply from the current month onwards', () => {
  const savePlan = async (income: string) => {
    await press('My plan');
    await press('Edit plan');
    await type(INCOME, income);
    await press('Save plan');
    await testRouter.back();
  };

  async function monthIncome(shortName: string) {
    await press(/^Month:/);
    await press(shortName);
  }

  it('Changing the plan in a later month', async () => {
    const twoThousand: IncomePlan = {
      incomeCents: 200000,
      fixedItems: [{ name: 'House', amountCents: 100000 }],
      kept: 'savings',
      keptAmount: { unit: 'pct', pct: 20 },
    };
    await startApp({ today: [2026, 11, 8], plans: [[twoThousand, '2026-07']] });
    await savePlan('2400');

    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € of 480,00 €'))).toBeOnTheScreen();

    for (const month of ['Jul', 'Aug', 'Sep', 'Oct', 'Nov']) {
      await monthIncome(month);
      expect(screen.getByText(exactText('0,00 € of 400,00 €'))).toBeOnTheScreen();
      await press('Back to current month');
    }
    expect(screen.getByText(exactText('0,00 € of 480,00 €'))).toBeOnTheScreen();

    await reopenApp([2027, 1, 3]);
    expect(screen.getByText('February 2027', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € of 480,00 €'))).toBeOnTheScreen();
  });

  it('Saving twice in the same month', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await savePlan('2400');
    await savePlan('2600');

    expect(screen.getByText(exactText('0,00 € of 780,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText(exactText('0,00 € of 720,00 €'))).not.toBeOnTheScreen();

    await monthIncome('Oct');
    expect(screen.getByText(exactText('0,00 € of 600,00 €'))).toBeOnTheScreen();
  });
});

describe('Savings and wants as a percentage of the income', () => {
  it('Savings as a percentage', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type(INCOME, '2000');
    await typeFixed('1000');
    await type('Savings', '30');

    expect(screen.getByText('= 600,00 €')).toBeOnTheScreen();
  });

  it('Income edited with a percentage bucket', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    expect(screen.getByText('= 600,00 €')).toBeOnTheScreen();
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('20');

    await type(INCOME, '2500');

    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('30');
    // Wants is recomputed from what is left after the fixed expenses and savings.
    expect(screen.getAllByText('= 750,00 €')).toHaveLength(2);
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('30');
  });
});

describe('Last edited of leisure and savings is kept', () => {
  it('Two fields filled, third automatic', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type(INCOME, '2000');
    await typeFixed('1000');
    await type('Savings', '30');

    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('20');
    expect(screen.getByText(/automatic/)).toBeOnTheScreen();
  });

  it('Switching which bucket is kept', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('20');

    await type('Wants', '25');

    expect(screen.getByText('Savings · automatic')).toBeOnTheScreen();
    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('25');
    expect(screen.queryByText('Wants · automatic')).not.toBeOnTheScreen();
  });
});

describe('Plan must fit in the income', () => {
  it('Kept bucket too high', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type(INCOME, '2000');
    await typeFixed('1000');
    await type('Savings', '60');

    expect(screen.getByText(partialText('200,00 € over your income'))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();
    await testRouter.back();
    await answerDialog('Discard');
    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
  });
});

describe('The plan at a glance', () => {
  it('Split shown on the home screen', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    expect(screen.getByText(/^Fixed 50.%$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Wants 20.%$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Savings 30.%$/)).toBeOnTheScreen();
  });
});

describe('50/30/20 as a starting point', () => {
  it('Suggested amounts', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('My plan');
    await press('Edit plan');
    expect(screen.getByText(/^Suggested 20.%$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Suggested 30.%$/)).toBeOnTheScreen();
    expect(screen.getByLabelText(FIXED)).toHaveDisplayValue('1000,00');
  });
});
