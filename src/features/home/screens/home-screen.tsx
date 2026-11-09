import { Feather } from '@react-native-vector-icons/feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BucketRows } from '@/shared/ui/bucket-rows';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ExpenseList } from '@/features/expenses/components/expense-list';
import { PlanBar } from '@/shared/ui/plan-bar';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { Hero, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { isExpenseMonthEditable, totalsByBucket } from '@/features/expenses/rules';
import { incomeForMonth, planForMonth, targetsFor } from '@/features/plan/rules';
import { BUCKET_LABELS, type Bucket } from '@/shared/buckets';
import { formatEuros } from '@/shared/money';
import { formatMonth, isPastMonth, isValidMonthKey, monthKey } from '@/shared/months';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { useMonthExpenses } from '@/features/expenses/hooks/use-month-expenses';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const state = useIncomePlan();
  const params = useLocalSearchParams<{ month?: string }>();
  const today = new Date();
  const currentMonth = monthKey(today);
  // Ignore invalid or future months in the URL and fall back to the current month.
  const month = isValidMonthKey(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  const expenses = useMonthExpenses(month);
  // Which part of the plan the expense list is showing; null shows all of them.
  const [selected, setSelected] = useState<Bucket | null>(null);

  if (state.status === 'error' || expenses.status === 'error') return <DataError />;
  if (state.status === 'loading' || expenses.status === 'loading') return <ThemedView style={styles.screen} />;

  const { versions, overrides } = state.data;
  const monthExpenses = expenses.data;

  if (versions.length === 0) {
    return (
      <ThemedView style={[styles.screen, styles.centeredScreen]}>
        <ThemedText type="heading">Plan your month</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          Split your income into needs, wants and savings. Then see each month if you stick to it.
        </ThemedText>
        <Button label="Set up my plan" onPress={() => router.push('/plan')} />
      </ThemedView>
    );
  }

  const isPast = isPastMonth(month, currentMonth);
  const canEditExpenses = isExpenseMonthEditable(month, today);
  const plan = planForMonth(versions, month);
  const income = plan ? incomeForMonth(plan, overrides, month) : null;
  const targets = plan && income ? targetsFor(plan, income.incomeCents) : null;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing.five + insets.bottom, paddingTop: Spacing.two + insets.top },
        ]}>
        <PlanCard month={month}>
          {targets && income ? (
            <>
              <View style={styles.income}>
                <ThemedText type="small" style={{ color: Hero.label }}>
                  {income.isOverride ? 'Income for this month only' : 'Monthly income'}
                </ThemedText>
                <ThemedText type="display" numberOfLines={1} adjustsFontSizeToFit style={{ color: Hero.text }}>
                  {formatEuros(income.incomeCents)}
                </ThemedText>
              </View>
              <PlanBar targets={targets} onHero />
            </>
          ) : (
            <ThemedText style={[styles.centeredText, { color: Hero.label }]}>
              There was no plan in {formatMonth(month)}.
            </ThemedText>
          )}
        </PlanCard>

        {targets ? (
          <BucketRows
            targets={targets}
            spent={totalsByBucket(monthExpenses)}
            selected={selected}
            onSelect={(bucket) => setSelected(bucket === selected ? null : bucket)}
          />
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <View style={styles.titleGroup}>
              <ThemedText type="heading">{selected ? BUCKET_LABELS[selected] : 'Expenses'}</ThemedText>
              {selected ? (
                <Pressable accessibilityRole="button" style={styles.showAll} onPress={() => setSelected(null)}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Show all
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            {canEditExpenses ? (
              <Button
                label="Add"
                icon="plus"
                accessibilityLabel="Add expense"
                variant="pill"
                onPress={() => router.push({ pathname: '/expense', params: { month } })}
              />
            ) : null}
          </View>
          <ExpenseList
            expenses={selected ? monthExpenses.filter((expense) => expense.bucket === selected) : monthExpenses}
            onPress={
              canEditExpenses
                ? (expense) => router.push({ pathname: '/expense', params: { id: String(expense.id) } })
                : undefined
            }
          />
        </View>

        {isPast ? (
          <Button label="Back to current month" variant="secondary" onPress={() => router.setParams({ month: currentMonth })} />
        ) : (
          <Button label="Edit plan" variant="secondary" onPress={() => router.push('/plan')} />
        )}
      </ScrollView>
    </ThemedView>
  );
}

/** The screen's focal point: which month it is and how the income is split. */
function PlanCard({ month, children }: { month: string; children: ReactNode }) {
  return (
    <View style={styles.planCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens the month picker"
        onPress={() => router.push({ pathname: '/month-picker', params: { month } })}
        style={({ pressed }) => [styles.month, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={{ color: Hero.text }}>
          Your plan for {formatMonth(month)}
        </ThemedText>
        <Feather name="chevron-down" size={16} color={Hero.text} />
      </Pressable>
      {children}
    </View>
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  planCard: {
    backgroundColor: Hero.background,
    borderRadius: Radius.hero,
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.four,
  },
  month: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'center',
    minHeight: MIN_TOUCH,
  },
  income: {
    alignItems: 'center',
  },
  section: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  showAll: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH,
  },
  pressed: {
    opacity: 0.6,
  },
});
