import { fireEvent, screen, testRouter } from 'expo-router/testing-library';

import type { IncomePlan } from '@/features/plan/rules';

import { exactText, partialText, reopenApp, standardPlan, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);
jest.mock('@/global.css', () => ({}));

afterEach(() => {
  jest.useRealTimers();
});

const FIXED = 'Needs';

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
const unit = (label: string, which: 'euros' | 'percent') =>
  fireEvent.press(screen.getByRole('radio', { name: `${label} in ${which}` }));

describe('Recurring monthly income', () => {
  it('Set recurring income', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2500');
    await type(FIXED, '1000');
    await press('Save plan');

    expect(screen.getByText(exactText('2 500,00 €'))).toBeOnTheScreen();

    // The following month, without an override, uses the same income.
    await reopenApp([2026, 11, 2]);
    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('2 500,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText(/this month only/i)).not.toBeOnTheScreen();
  });

  it.each([
    ['zero', '0'],
    ['negative', '-5'],
  ])('Reject invalid income (%s)', async (_label, income) => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2000');
    await type(FIXED, '500');
    await type('Monthly income', income);

    expect(screen.getByText(/income must be greater than 0/i)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();

    await testRouter.back();
    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
  });

  it('Empty income', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2000');
    await type(FIXED, '500');
    await type('Monthly income', '');

    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();

    await testRouter.back();
    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
  });
});

describe('Live euro preview while editing', () => {
  it('Preview updates on change', async () => {
    const tenPercent: IncomePlan = { ...standardPlan, keptAmount: { unit: 'pct', pct: 10 } };
    await startApp({ today: [2026, 10, 7], plans: [[tenPercent, '2026-07']] });
    await press('Edit plan');
    expect(screen.getByText('= 200,00 €')).toBeOnTheScreen();
    expect(screen.getByText(exactText("What's left: 800,00 € · 40 %"))).toBeOnTheScreen();

    await type('Savings', '25');

    expect(screen.getByText('= 500,00 €')).toBeOnTheScreen();
    expect(screen.getByText(exactText("What's left: 500,00 € · 25 %"))).toBeOnTheScreen();

    // Nothing was saved: the home screen still shows the old targets.
    await testRouter.back();
    expect(screen.getByText(exactText('200,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('800,00 €'))).toBeOnTheScreen();
  });
});

describe('Per-month income override', () => {
  it('Month with a different income', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('Edit plan');
    await press("Change this month's income");
    await type('Income this month', '2500');
    await press('Save for this month');

    expect(screen).toHavePathname('/');
    expect(screen.getByText(exactText('2 500,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(/this month only/i)).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 000,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('600,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('900,00 €'))).toBeOnTheScreen();

    await reopenApp([2026, 11, 2]);
    expect(screen.getByText(exactText('2 000,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('400,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('600,00 €'))).toBeOnTheScreen();
  });

  it('Remove the override', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      overrides: { '2026-11': 250000 },
    });
    expect(screen.getByText(exactText('2 500,00 €'))).toBeOnTheScreen();

    await press('Edit plan');

    await press("Change this month's income");
    await press('Use my usual income');

    expect(screen.getByText(exactText('2 000,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText(/this month only/i)).not.toBeOnTheScreen();
    expect(screen.getByText(exactText('400,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('600,00 €'))).toBeOnTheScreen();
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
    expect(screen.getByText(exactText('2 000,00 €'))).toBeOnTheScreen();
    expect(screen.getByText('Monthly income')).toBeOnTheScreen();
    for (const [bucket, amount] of [
      ['Needs', '1 000,00 €'],
      ['Wants', '400,00 €'],
      ['Savings', '600,00 €'],
    ]) {
      expect(screen.getByText(bucket)).toBeOnTheScreen();
      expect(screen.getByText(exactText(amount))).toBeOnTheScreen();
    }
  });
});

describe('On-device persistence', () => {
  it('Restart keeps the plan', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2000');
    await type(FIXED, '1000');
    await type('Savings', '30');
    await press('Save plan');
    await press('Edit plan');
    await press("Change this month's income");
    await type('Income this month', '2500');
    await press('Save for this month');

    await reopenApp();

    expect(screen.getByText(exactText('2 500,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(/this month only/i)).toBeOnTheScreen();
    expect(screen.getByText(exactText('900,00 €'))).toBeOnTheScreen();

    await press('Edit plan');
    expect(screen.getByLabelText('Monthly income')).toHaveDisplayValue('2000,00');
    expect(screen.getByLabelText(FIXED)).toHaveDisplayValue('1000,00');
    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('30');
  });
});

describe('Fixed expenses as an amount', () => {
  it('Fixed expenses shown as a share of income', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2000');
    await type(FIXED, '1000');

    expect(screen.getByText(exactText('50 % of your income'))).toBeOnTheScreen();
  });

  it('Fixed expenses above income', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2000');
    await type(FIXED, '2100');

    expect(screen.getByText(/cannot exceed your income/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();
    await testRouter.back();
    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
  });
});

describe('Income below fixed expenses', () => {
  it('Month that does not cover fixed expenses', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('Edit plan');
    await press("Change this month's income");
    await type('Income this month', '800');
    await press('Save for this month');

    expect(screen.getByText(/short of your needs/)).toBeOnTheScreen();
    expect(screen.getByText(/This income is 200,00.€ short/)).toBeOnTheScreen();
    // Leisure and savings targets are 0,00 €.
    expect(screen.getAllByText(exactText('0,00 €'))).toHaveLength(2);
    expect(screen.getByText(exactText('0,00 € left'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € left to save'))).toBeOnTheScreen();
  });
});

describe('Plan changes apply from the current month onwards', () => {
  const savePlan = async (income: string) => {
    await press('Edit plan');
    await type('Monthly income', income);
    await press('Save plan');
  };

  async function monthIncome(shortName: string) {
    await press(/Your plan for/);
    await press(shortName);
  }

  it('Changing the plan in a later month', async () => {
    const twoThousand: IncomePlan = {
      incomeCents: 200000,
      fixed: { unit: 'eur', cents: 100000 },
      kept: 'savings',
      keptAmount: { unit: 'pct', pct: 20 },
    };
    await startApp({ today: [2026, 11, 8], plans: [[twoThousand, '2026-07']] });
    await savePlan('2400');

    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('2 400,00 €'))).toBeOnTheScreen();

    for (const month of ['Jul', 'Aug', 'Sep', 'Oct', 'Nov']) {
      await monthIncome(month);
      expect(screen.getByText(exactText('2 000,00 €'))).toBeOnTheScreen();
      await press('Back to current month');
    }
    expect(screen.getByText(exactText('2 400,00 €'))).toBeOnTheScreen();

    await reopenApp([2027, 1, 3]);
    expect(screen.getByText('February 2027', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('2 400,00 €'))).toBeOnTheScreen();
  });

  it('Saving twice in the same month', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await savePlan('2400');
    await savePlan('2600');

    expect(screen.getByText(exactText('2 600,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText(exactText('2 400,00 €'))).not.toBeOnTheScreen();

    await monthIncome('Oct');
    expect(screen.getByText(exactText('2 000,00 €'))).toBeOnTheScreen();
  });
});

describe('Buckets in euros or percent', () => {
  it('Savings as a percentage', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2000');
    await type(FIXED, '1000');
    await unit('Savings', 'percent');
    await type('Savings', '30');

    expect(screen.getByText('= 600,00 €')).toBeOnTheScreen();
  });

  it('Income edited with a percentage bucket', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('Edit plan');
    expect(screen.getByText('= 600,00 €')).toBeOnTheScreen();
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('400,00');

    await type('Monthly income', '2500');

    expect(screen.getByLabelText('Savings')).toHaveDisplayValue('30');
    expect(screen.getByText('= 750,00 €')).toBeOnTheScreen();
    // Leisure is recomputed from what is left after the fixed expenses and savings.
    expect(screen.getByLabelText('Wants')).not.toHaveDisplayValue('400,00');
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('750,00');
  });
});

describe('Last edited of leisure and savings is kept', () => {
  it('Two fields filled, third automatic', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2000');
    await type(FIXED, '1000');
    await type('Savings', '30');

    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('400,00');
    expect(screen.getByText(/automatic/)).toBeOnTheScreen();
  });

  it('Switching which bucket is kept', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('Edit plan');
    expect(screen.getByLabelText('Wants')).toHaveDisplayValue('400,00');

    await type('Wants', '500');

    expect(screen.getByText('Savings · automatic')).toBeOnTheScreen();
    expect(screen.getByText(exactText("What's left: 500,00 € · 25 %"))).toBeOnTheScreen();
    expect(screen.queryByText('Wants · automatic')).not.toBeOnTheScreen();
  });
});

describe('Plan must fit in the income', () => {
  it('Kept bucket too high', async () => {
    await startApp({ today: [2026, 10, 7] });
    await press('Set up my plan');
    await type('Monthly income', '2000');
    await type(FIXED, '1000');
    await type('Savings', '60');

    expect(screen.getByText(partialText('200,00 € over your income'))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();
    await testRouter.back();
    expect(screen.getByText('Plan your month')).toBeOnTheScreen();
  });
});

describe('The plan at a glance', () => {
  it('Split shown on the home screen', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    expect(screen.getByText(/^Needs 50.%$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Wants 20.%$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Savings 30.%$/)).toBeOnTheScreen();
  });
});

describe('50/30/20 as a starting point', () => {
  it('Suggested amounts', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('Edit plan');
    expect(screen.getByText(/^Suggested 1.000,00.€$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Suggested 600,00.€$/)).toBeOnTheScreen();
    expect(screen.getByText(/^Suggested 400,00.€$/)).toBeOnTheScreen();
    expect(screen.getByLabelText(FIXED)).toHaveDisplayValue('1000,00');
  });
});
