import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BucketRows } from '@/components/bucket-rows';
import { Button } from '@/components/button';
import { ExpenseList } from '@/components/expense-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { isExpenseMonthEditable, totalsByBucket } from '@/domain/expenses';
import {
  formatEuros,
  formatMonth,
  incomeForMonth,
  isPastMonth,
  isValidMonthKey,
  monthKey,
  planForMonth,
  targetsFor,
  type Bucket,
  type IncomePlan,
} from '@/domain/income-plan';
import { useIncomePlan } from '@/hooks/use-income-plan';
import { useMonthExpenses } from '@/hooks/use-month-expenses';

export default function HomeScreen() {
  const state = useIncomePlan();
  const params = useLocalSearchParams<{ month?: string }>();
  const today = new Date();
  const currentMonth = monthKey(today);
  // Ignore invalid or future months in the URL and fall back to the current month.
  const month = isValidMonthKey(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  const expenses = useMonthExpenses(month);

  if (state.status === 'loading' || expenses === null) return <ThemedView style={styles.screen} />;

  const { versions, overrides } = state;

  if (versions.length === 0) {
    return (
      <ThemedView style={[styles.screen, styles.centeredScreen]}>
        <ThemedText type="subtitle">Plan your month</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          Set your monthly income, your fixed expenses and how much of the rest you want to save.
        </ThemedText>
        <Button label="Set up my plan" onPress={() => router.push('/plan')} />
      </ThemedView>
    );
  }

  const isPast = isPastMonth(month, currentMonth);
  const canEditExpenses = isExpenseMonthEditable(month, today);
  const plan = planForMonth(versions, month);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Opens the month picker"
          onPress={() => router.push({ pathname: '/month-picker', params: { month } })}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold">{formatMonth(month)} ▾</ThemedText>
        </Pressable>

        {plan ? (
          <MonthPlan {...incomeForMonth(plan, overrides, month)} plan={plan} spent={totalsByBucket(expenses)} />
        ) : (
          <ThemedText themeColor="textSecondary">There was no plan in {formatMonth(month)}.</ThemedText>
        )}

        {canEditExpenses ? (
          <Button label="Add expense" onPress={() => router.push({ pathname: '/expense', params: { month } })} />
        ) : null}

        <View style={styles.section}>
          <ThemedText type="smallBold">Expenses</ThemedText>
          <ExpenseList
            expenses={expenses}
            onPress={
              canEditExpenses
                ? (expense) => router.push({ pathname: '/expense', params: { id: String(expense.id) } })
                : undefined
            }
          />
        </View>

        <View style={styles.actions}>
          {isPast ? (
            <Button label="Back to current month" variant="secondary" onPress={() => router.setParams({ month: currentMonth })} />
          ) : (
            <>
              <Button
                label="Change this month's income"
                variant="secondary"
                onPress={() => router.push('/month-income')}
              />
              <Button label="Edit plan" variant="secondary" onPress={() => router.push('/plan')} />
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type MonthPlanProps = { plan: IncomePlan; incomeCents: number; isOverride: boolean; spent: Record<Bucket, number> };

function MonthPlan({ plan, incomeCents, isOverride, spent }: MonthPlanProps) {
  const targets = targetsFor(plan, incomeCents);
  return (
    <>
      <View style={styles.header}>
        <ThemedText type="subtitle">{formatEuros(incomeCents)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {isOverride ? 'Income for this month only' : 'Monthly income'}
        </ThemedText>
      </View>
      <BucketRows targets={targets} spent={spent} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centeredScreen: {
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  centeredText: {
    textAlign: 'center',
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
