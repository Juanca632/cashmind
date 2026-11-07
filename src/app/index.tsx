import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BucketRows } from '@/components/bucket-rows';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  formatEuros,
  formatMonth,
  incomeForMonth,
  isPastMonth,
  isValidMonthKey,
  monthKey,
  planForMonth,
  targetsFor,
  type IncomePlan,
} from '@/domain/income-plan';
import { useIncomePlan } from '@/hooks/use-income-plan';

export default function HomeScreen() {
  const state = useIncomePlan();
  const params = useLocalSearchParams<{ month?: string }>();

  if (state.status === 'loading') return <ThemedView style={styles.screen} />;

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

  const currentMonth = monthKey(new Date());
  // Ignore invalid or future months in the URL and fall back to the current month.
  const month = isValidMonthKey(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  const isPast = isPastMonth(month, currentMonth);
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
          <MonthPlan {...incomeForMonth(plan, overrides, month)} plan={plan} />
        ) : (
          <ThemedText themeColor="textSecondary">There was no plan in {formatMonth(month)}.</ThemedText>
        )}

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

function MonthPlan({ plan, incomeCents, isOverride }: { plan: IncomePlan; incomeCents: number; isOverride: boolean }) {
  const targets = targetsFor(plan, incomeCents);
  return (
    <>
      <View style={styles.header}>
        <ThemedText type="subtitle">{formatEuros(incomeCents)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {isOverride ? 'Income for this month only' : 'Monthly income'}
        </ThemedText>
      </View>
      <BucketRows targets={targets} incomeCents={incomeCents} />
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
  actions: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
