import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { incomeForMonth, planForMonth, targetsFor } from '@/features/plan/rules';
import { BUCKETS, BUCKET_LABELS } from '@/shared/buckets';
import { formatEurosCompact, formatPercentOf } from '@/shared/money';
import { monthKey } from '@/shared/months';
import { Radius, Spacing } from '@/shared/theme/theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { DataError } from '@/shared/ui/data-error';
import { PlanDonut } from '@/shared/ui/plan-donut';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** The current plan at a glance. Read-only: nothing can be changed from here. */
export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const state = useIncomePlan();
  if (state.status === 'error') return <DataError />;
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;

  const month = monthKey(new Date());
  const plan = planForMonth(state.data.versions, month);
  if (!plan) return <Redirect href="/plan-edit" />;

  const targets = targetsFor(plan, plan.incomeCents);
  const thisMonth = incomeForMonth(plan, state.data.overrides, month);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Spacing.five + insets.bottom }]}>
        <PlanDonut targets={targets}>
          <ThemedText type="small" themeColor="textSecondary">
            Monthly income
          </ThemedText>
          <ThemedText type="heading">{formatEurosCompact(plan.incomeCents)}</ThemedText>
        </PlanDonut>

        {thisMonth.isOverride ? (
          <ThemedText type="small" themeColor="textSecondary">
            This month only: {formatEurosCompact(thisMonth.incomeCents)}
          </ThemedText>
        ) : null}

        <ThemedView type="backgroundElement" style={styles.card}>
          {BUCKETS.map((bucket) => (
            <View key={bucket} style={styles.row}>
              <BucketBadge bucket={bucket} />
              <ThemedText type="smallBold" style={styles.name}>
                {BUCKET_LABELS[bucket]}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatPercentOf(targets[bucket], plan.incomeCents)}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.amount}>
                {formatEurosCompact(targets[bucket])}
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.three,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 62,
  },
  name: {
    flex: 1,
  },
  amount: {
    fontVariant: ['tabular-nums'],
    minWidth: 76,
    textAlign: 'right',
  },
});
