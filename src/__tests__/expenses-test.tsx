import { Alert } from 'react-native';
import { fireEvent, screen, testRouter } from 'expo-router/testing-library';

import type { IncomePlan } from '@/features/plan/rules';

import { answerDialog, exactText, standardPlan, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);
jest.mock('@/global.css', () => ({}));

const alertSpy = jest.spyOn(Alert, 'alert');

afterEach(() => {
  alertSpy.mockClear();
  jest.useRealTimers();
});

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

async function openMonth(shortName: string) {
  await press(/^Month:/);
  await press(shortName);
}

describe('Record an expense', () => {
  it('Add a leisure expense', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    expect(screen.getByText(exactText('0,00 € of 400,00 €'))).toBeOnTheScreen();

    await press('Add expense');
    await fireEvent.changeText(screen.getByLabelText('Amount'), '12,50');
    await fireEvent.press(screen.getByRole('radio', { name: 'Wants' }));
    await fireEvent.changeText(screen.getByLabelText('Note (optional)'), 'Cinema');
    expect(screen.getByText(/Today/)).toBeOnTheScreen();
    await press('Add expense');

    expect(screen).toHavePathname('/');
    expect(screen.getByText('Cinema')).toBeOnTheScreen();
    expect(screen.getByText(exactText('12,50 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('12,50 € of 400,00 €'))).toBeOnTheScreen();
  });

  it.each([
    ['zero', '0'],
    ['negative', '-5'],
  ])('Invalid amount (%s)', async (_label, amount) => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('Add expense');
    // The user types something, then clears or replaces it.
    await fireEvent.changeText(screen.getByLabelText('Amount'), '5');
    await fireEvent.changeText(screen.getByLabelText('Amount'), amount);

    expect(screen.getByText(/greater than 0/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled();

    await testRouter.back();
    await answerDialog('Discard');
    expect(screen.getByText('No expenses recorded this month.')).toBeOnTheScreen();
  });

  it('Empty amount', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await press('Add expense');
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled();

    // Typing something and clearing it again leaves the action disabled.
    await fireEvent.changeText(screen.getByLabelText('Amount'), '5');
    await fireEvent.changeText(screen.getByLabelText('Amount'), '');
    expect(screen.getByRole('button', { name: 'Add expense' })).toBeDisabled();

    await testRouter.back();
    expect(screen.getByText('No expenses recorded this month.')).toBeOnTheScreen();
  });
});

describe('Savings entries count towards the savings goal', () => {
  it('Saving after payday', async () => {
    const plan: IncomePlan = {
      incomeCents: 300000,
      fixedItems: [{ name: 'House', amountCents: 100000 }],
      kept: 'savings',
      keptAmount: { unit: 'eur', cents: 90000 },
    };
    await startApp({ today: [2026, 10, 7], plans: [[plan, '2026-07']] });
    expect(screen.getByText(exactText('0,00 € of 900,00 €'))).toBeOnTheScreen();

    await press('Add expense');
    await fireEvent.changeText(screen.getByLabelText('Amount'), '600');
    await fireEvent.press(screen.getByRole('radio', { name: 'Savings' }));
    await press('Add to savings');

    expect(screen.getByText(exactText('600,00 € of 900,00 €'))).toBeOnTheScreen();
  });
});

describe('Edit and delete an expense', () => {
  const cinema = { date: '2026-11-05', bucket: 'leisure', amountCents: 1250, note: 'Cinema' } as const;

  it('Correct an amount', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']], expenses: [cinema] });
    await press(/Cinema/);
    await fireEvent.changeText(screen.getByLabelText('Amount'), '15,00');
    await press('Save changes');

    expect(screen.getByText(exactText('15,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText(exactText('12,50 €'))).not.toBeOnTheScreen();
    expect(screen.getByText(exactText('15,00 € of 400,00 €'))).toBeOnTheScreen();
  });

  it('Delete an expense', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']], expenses: [cinema] });
    await press(/Cinema/);
    await press('Delete');
    await answerDialog('Delete');

    expect(screen).toHavePathname('/');
    expect(screen.queryByText('Cinema')).not.toBeOnTheScreen();
    expect(screen.getByText(exactText('0,00 € of 400,00 €'))).toBeOnTheScreen();
  });
});

describe('Editable period for expenses', () => {
  it('Forgotten expense at the start of the month', async () => {
    await startApp({ today: [2026, 11, 3], plans: [[standardPlan, '2026-07']] });
    await press('Add expense');
    await fireEvent.changeText(screen.getByLabelText('Amount'), '20');
    for (let i = 0; i < 3; i++) await press('Previous day');
    expect(screen.getByText(/Mon 30 Nov/)).toBeOnTheScreen();
    await press('Add expense');

    // Counts towards November, not December.
    expect(screen.getByText('December 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('No expenses recorded this month.')).toBeOnTheScreen();
    await openMonth('Nov');
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('20,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('20,00 € of 400,00 €'))).toBeOnTheScreen();
  });

  it('Grace period over', async () => {
    const forgotten = { date: '2026-11-30', bucket: 'leisure', amountCents: 2000, note: 'Taxi' } as const;
    await startApp({ today: [2026, 11, 6], plans: [[standardPlan, '2026-07']], expenses: [forgotten] });
    await openMonth('Nov');

    expect(screen.getByText('Taxi')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Add expense' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Taxi/ })).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Taxi'));
    expect(screen).toHavePathname('/');
  });
});

describe('Month progress against targets', () => {
  it('Leisure over its limit', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      expenses: [
        { date: '2026-11-02', bucket: 'leisure', amountCents: 30000, note: 'Concert' },
        { date: '2026-11-03', bucket: 'leisure', amountCents: 15000, note: 'Dinner' },
      ],
    });
    expect(screen.getByText(exactText('450,00 € of 400,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(/50,00.€ over/i)).toBeOnTheScreen();
  });

  it('Within the limit', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      expenses: [{ date: '2026-11-02', bucket: 'leisure', amountCents: 10000, note: 'Dinner' }],
    });
    expect(screen.getByText(exactText('100,00 € of 400,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('300,00 €'))).toBeOnTheScreen();
  });

  it('Progress percentage', async () => {
    const plan: IncomePlan = {
      incomeCents: 200000,
      fixedItems: [{ name: 'House', amountCents: 70000 }],
      kept: 'savings',
      keptAmount: { unit: 'eur', cents: 90000 },
    };
    await startApp({
      today: [2026, 10, 7],
      plans: [[plan, '2026-07']],
      expenses: [
        { date: '2026-11-02', bucket: 'savings', amountCents: 63000, note: 'Payday' },
        { date: '2026-11-03', bucket: 'leisure', amountCents: 20000, note: 'Trip' },
      ],
    });
    expect(screen.getByText(exactText('630,00 € of 900,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('200,00 € of 400,00 €'))).toBeOnTheScreen();
  });
});

describe('Month expense list', () => {
  it('Lists the newest date first (FR-006)', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      expenses: [
        { date: '2026-11-02', bucket: 'leisure', amountCents: 1000, note: 'Middle' },
        { date: '2026-11-05', bucket: 'fixed', amountCents: 2000, note: 'Newest' },
        { date: '2026-11-01', bucket: 'savings', amountCents: 3000, note: 'Oldest' },
      ],
    });

    const notes = screen.getAllByText(/^(Newest|Middle|Oldest)$/).map((row) => row.props.children);
    expect(notes).toEqual(['Newest', 'Middle', 'Oldest']);
  });

  it('Viewing a past month', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      expenses: [
        { date: '2026-09-10', bucket: 'leisure', amountCents: 8000, note: 'Concert' },
        { date: '2026-11-02', bucket: 'leisure', amountCents: 1000, note: 'Coffee' },
      ],
    });
    await openMonth('Sep');

    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Concert')).toBeOnTheScreen();
    expect(screen.getByText(exactText('80,00 €'))).toBeOnTheScreen();
    expect(screen.queryByText('Coffee')).not.toBeOnTheScreen();
    expect(screen.getByText(exactText('80,00 € of 400,00 €'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('320,00 €'))).toBeOnTheScreen();
  });
});

describe('Look inside one part of the plan', () => {
  it('Tapping a part lists only its expenses', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [[standardPlan, '2026-07']],
      expenses: [
        { date: '2026-11-02', bucket: 'savings', amountCents: 70000, note: 'Payday' },
        { date: '2026-11-03', bucket: 'leisure', amountCents: 1500, note: 'Dinner' },
      ],
    });
    expect(screen.getByText('Payday')).toBeOnTheScreen();
    expect(screen.getByText('Dinner')).toBeOnTheScreen();

    await press(/^Wants/);
    expect(screen.getByText('Dinner')).toBeOnTheScreen();
    expect(screen.queryByText('Payday')).not.toBeOnTheScreen();

    await press('Show all');
    expect(screen.getByText('Payday')).toBeOnTheScreen();
  });
});
