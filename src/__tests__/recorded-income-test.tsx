import { fireEvent, screen, testRouter } from 'expo-router/testing-library';

import { answerDialog, exactText, partialText, startApp, type TestPlan } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

afterEach(() => {
  jest.useRealTimers();
});

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const amount = (text: string) => fireEvent.changeText(screen.getByLabelText('Amount'), text);
const TODAY: [number, number, number] = [2026, 10, 7];

const plan: TestPlan = {
  incomeCents: 200000,
  fixedItems: [{ name: 'House', amountCents: 103000 }],
  kept: 'savings',
  keptAmount: { unit: 'pct', pct: 20 },
};
const noIncome = { today: TODAY, plans: [[plan, '2026-11']] as [TestPlan, string][], noIncome: true };

async function openIncome() {
  await press('Add expense');
  await fireEvent.press(screen.getByRole('radio', { name: 'Income' }));
}

async function earn(text: string) {
  await openIncome();
  await amount(text);
  await press('Add income');
}

describe('Record what I earn', () => {
  it('Add income', async () => {
    await startApp(noIncome);
    await earn('2000');

    expect(screen.getByText(exactText('400 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('570 € left'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 030'))).toBeOnTheScreen();
  });

  it('Several incomes', async () => {
    await startApp(noIncome);
    await earn('2000');
    await earn('500');

    expect(screen.getByText(exactText('500 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('970 € left'))).toBeOnTheScreen();
  });

  it('Change an income', async () => {
    await startApp(noIncome);
    await earn('2000');
    await fireEvent.press(screen.getByText('Income'));
    await amount('3000');
    await press('Save changes');

    expect(screen.getByText(exactText('600 € to go'))).toBeOnTheScreen();
  });

  it('Delete an income after confirming', async () => {
    await startApp(noIncome);
    await earn('2000');
    await fireEvent.press(screen.getByText('Income'));
    await press('Delete');
    await answerDialog('Delete');

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
  });

  it.each([['empty', ''], ['zero', '0'], ['negative', '-5']])('Invalid amount (%s)', async (_label, text) => {
    await startApp(noIncome);
    await openIncome();
    await amount(text);

    expect(screen.getByRole('button', { name: 'Add income' })).toBeDisabled();
  });

  it('In the list', async () => {
    await startApp(noIncome);
    await earn('2000');

    expect(screen.getByText(partialText('+2 000,00 €'))).toBeOnTheScreen();
  });
});

describe('A month with no income yet', () => {
  it('Asks for income', async () => {
    await startApp(noIncome);

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
    expect(screen.queryByText(/short of your fixed expenses/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Leisure')).not.toBeOnTheScreen();
  });

  it('Repeat the last income', async () => {
    await startApp({
      today: TODAY,
      plans: [[plan, '2026-10']],
      noIncome: true,
      expenses: [
        { date: '2026-10-01', bucket: 'income', amountCents: 150000, note: 'Salary' },
        { date: '2026-10-15', bucket: 'income', amountCents: 50000, note: 'Bonus' },
      ],
    });
    await press('Repeat last income');

    expect(await screen.findByText(exactText('400 € to go'))).toBeOnTheScreen();
    expect(screen.queryByText("Add this month's income")).not.toBeOnTheScreen();
  });

  it('Nothing to repeat', async () => {
    await startApp(noIncome);

    expect(screen.queryByRole('button', { name: 'Repeat last income' })).not.toBeOnTheScreen();
  });

  it('A past month repeats on its last day', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[plan, '2026-08']],
      noIncome: true,
      expenses: [{ date: '2026-08-01', bucket: 'income', amountCents: 200000, note: 'Salary' }],
    });
    await press(/^Month:/);
    await press('Sep');
    await press('Repeat last income');

    expect(await screen.findByText('Wed 30 Sept', { exact: false })).toBeOnTheScreen();
  });
});

describe('The plan is a simulator', () => {
  it('See the split', async () => {
    await startApp(noIncome);
    await press('My plan');
    await press('Edit plan');
    await fireEvent.changeText(screen.getByLabelText('Income'), '2000');

    expect(screen.getByText('400,00 €')).toBeOnTheScreen();
    expect(screen.getByLabelText('Leisure')).toHaveDisplayValue('28,5');
    expect(screen.getByText('570,00 €')).toBeOnTheScreen();
  });

  it('Trial income is not saved', async () => {
    await startApp(noIncome);
    await press('My plan');
    await press('Edit plan');
    await fireEvent.changeText(screen.getByLabelText('Income'), '2000');
    await press('Save plan');
    await testRouter.back();

    expect(screen.getByText("Add this month's income")).toBeOnTheScreen();
  });

  it('No trial income', async () => {
    await startApp(noIncome);
    await press('My plan');
    await press('Edit plan');

    expect(screen.getByRole('button', { name: 'Save plan' })).toBeEnabled();
  });

  it("Starts from this month's income", async () => {
    await startApp({ today: TODAY, plans: [[plan, '2026-11']] });
    await press('My plan');
    await press('Edit plan');

    expect(screen.getByLabelText('Income')).toHaveDisplayValue('2000,00');
  });
});

describe('One rule for every month', () => {
  it('Higher income', async () => {
    await startApp({ today: TODAY, plans: [[plan, '2026-11']], overrides: { '2026-11': 300000 } });

    expect(screen.getByText(exactText('600 € to go'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 370 € left'))).toBeOnTheScreen();
  });

  it('Income below fixed', async () => {
    await startApp({ today: TODAY, plans: [[plan, '2026-11']], overrides: { '2026-11': 80000 } });

    expect(screen.getByText(/This income is 230,00.€ short/)).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 € left'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 € to go'))).toBeOnTheScreen();
  });
});

describe('See the current plan', () => {
  it('With income', async () => {
    await startApp({ today: TODAY, plans: [[plan, '2026-11']] });
    await press('My plan');

    expect(screen.getByText(exactText('2 000 €'))).toBeOnTheScreen();
    expect(screen.getByText(/^28,5.%$/)).toBeOnTheScreen();
  });

  it('Without income', async () => {
    await startApp(noIncome);
    await press('My plan');

    expect(screen.getByText(/Add this month's income to see the split/)).toBeOnTheScreen();
    expect(screen.getByText(exactText('1 030 €'))).toBeOnTheScreen();
    expect(screen.getByText(/^20.%$/)).toBeOnTheScreen();
    expect(screen.getByText('The rest')).toBeOnTheScreen();
    await testRouter.back();
  });
});
