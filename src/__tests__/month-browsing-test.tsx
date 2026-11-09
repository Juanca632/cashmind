import { Alert } from 'react-native';
import { fireEvent, screen } from 'expo-router/testing-library';

import type { IncomePlan } from '@/features/plan/rules';

import { answerDialog, exactText, standardPlan, startApp } from '../test-support/app';

jest.mock('expo-sqlite', () => jest.requireActual('../test-support/fake-sqlite').expoSqliteMock);

const alertSpy = jest.spyOn(Alert, 'alert');

afterEach(() => {
  alertSpy.mockClear();
  jest.useRealTimers();
});

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const openPicker = () => press(/^Month:/);

const threeThousand: IncomePlan = { ...standardPlan, incomeCents: 300000 };

describe('Month picker', () => {
  it('Pick a past month', async () => {
    await startApp({
      today: [2026, 10, 7],
      plans: [
        [standardPlan, '2026-07'],
        [threeThousand, '2026-10'],
      ],
    });
    expect(screen.getByText(exactText('0 / 900'))).toBeOnTheScreen();

    await openPicker();
    expect(screen.getByRole('button', { name: 'Nov' })).toBeSelected();
    await press('Sep');

    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 / 400'))).toBeOnTheScreen();
    expect(screen.getByText(exactText('0 / 600'))).toBeOnTheScreen();
  });
});

describe('No future months', () => {
  it('Future months disabled', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await openPicker();

    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dec' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next year' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nov' })).toBeEnabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Dec' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Next year' }));
    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dec' })).toBeDisabled();
  });
});

describe('Months without a plan', () => {
  it('Month before the first plan', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await openPicker();
    await press('Mar');

    expect(screen.getByText('There was no plan in March 2026.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /March 2026/ })).toBeOnTheScreen();
    // The picker does not go back before the year of the first plan.
    await openPicker();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
    expect(screen.queryByText('Wants')).not.toBeOnTheScreen();
  });
});

describe('The plan of a past month cannot be changed', () => {
  it('Viewing a past month', async () => {
    await startApp({ today: [2026, 10, 7], plans: [[standardPlan, '2026-07']] });
    await openPicker();
    await press('Sep');

    expect(screen.getByText('September 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'My plan' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: "Change this month's income" })).not.toBeOnTheScreen();

    await press('Back to current month');

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'My plan' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Back to current month' })).not.toBeOnTheScreen();
  });

  it('Expenses stay editable', async () => {
    await startApp({
      today: [2026, 11, 2],
      plans: [[standardPlan, '2026-07']],
      expenses: [
        { date: '2026-11-05', bucket: 'leisure', amountCents: 1250, note: 'Cinema' },
        { date: '2026-11-06', bucket: 'leisure', amountCents: 900, note: 'Lunch' },
      ],
    });
    await openPicker();
    await press('Nov');

    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'My plan' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: "Change this month's income" })).not.toBeOnTheScreen();

    // Edit an expense.
    await press(/Cinema/);
    await fireEvent.changeText(screen.getByLabelText('Amount'), '15,00');
    await press('Save changes');
    expect(screen.getByText(exactText('15,00 €'))).toBeOnTheScreen();

    // Delete an expense.
    await press(/Lunch/);
    await press('Delete');
    await answerDialog('Delete');
    expect(screen.queryByText('Lunch')).not.toBeOnTheScreen();

    // Add an expense dated in November.
    await press('Add expense');
    await fireEvent.changeText(screen.getByLabelText('Amount'), '7');
    await fireEvent.changeText(screen.getByLabelText('Note (optional)'), 'Bakery');
    await press('Previous day');
    await press('Previous day');
    await press('Add expense');
    expect(screen.getByText('November 2026', { exact: false })).toBeOnTheScreen();
    expect(screen.getByText('Bakery')).toBeOnTheScreen();
    expect(screen.getByText(exactText('7,00 €'))).toBeOnTheScreen();
  });
});
