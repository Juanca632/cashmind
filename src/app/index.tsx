import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BucketRows } from '@/components/bucket-rows';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatEuros, incomeForMonth, monthKey, targetsFor } from '@/domain/income-plan';
import { useIncomePlan } from '@/hooks/use-income-plan';

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export default function HomeScreen() {
  const state = useIncomePlan();

  if (state.status === 'loading') return <ThemedView style={styles.screen} />;

  const { plan, overrides } = state;

  if (!plan) {
    return (
      <ThemedView style={[styles.screen, styles.empty]}>
        <ThemedText type="subtitle">Plan your month</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centered}>
          Set your monthly income and how much of it goes to fixed expenses, leisure and savings.
        </ThemedText>
        <Button label="Set up my plan" onPress={() => router.push('/plan')} />
      </ThemedView>
    );
  }

  const now = new Date();
  const { incomeCents, isOverride } = incomeForMonth(plan, overrides, monthKey(now));
  const targets = targetsFor(incomeCents, plan.percentages);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            {monthFormatter.format(now)}
          </ThemedText>
          <ThemedText type="subtitle">{formatEuros(incomeCents)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {isOverride ? 'Income for this month only' : 'Monthly income'}
          </ThemedText>
        </View>

        <BucketRows percentages={plan.percentages} targets={targets} />

        <View style={styles.actions}>
          <Button label="Change this month's income" variant="secondary" onPress={() => router.push('/month-income')} />
          <Button label="Edit plan" variant="secondary" onPress={() => router.push('/plan')} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  centered: {
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
});
