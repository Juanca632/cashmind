import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMonthExpenses } from '@/features/expenses/hooks/use-month-expenses';
import { totalsByBucket } from '@/features/expenses/rules';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { fixedTotal, planForMonth, targetsFor, type IncomePlan } from '@/features/plan/rules';
import { BUCKETS, BUCKET_LABELS, otherFlexible, type Bucket } from '@/shared/buckets';
import { formatEurosCompact, formatPercentOf } from '@/shared/money';
import { monthKey } from '@/shared/months';
import { Radius, Spacing } from '@/shared/theme/theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { PlanDonut } from '@/shared/ui/plan-donut';
import { ShortfallWarning } from '@/shared/ui/shortfall-warning';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** The current plan at a glance. Changing it happens on the editor, reached from the end of this screen. */
export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const month = monthKey(new Date());
  const state = useIncomePlan();
  const expenses = useMonthExpenses(month);
  if (state.status === 'error' || expenses.status === 'error') return <DataError />;
  if (state.status === 'loading' || expenses.status === 'loading') return <ThemedView style={styles.screen} />;

  const plan = planForMonth(state.data, month);
  if (!plan) return <Redirect href="/plan-edit" />;

  const income = totalsByBucket(expenses.data).income;
  const targets = income > 0 ? targetsFor(plan, income) : null;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Spacing.five + insets.bottom }]}>
        {targets ? (
          <PlanDonut targets={targets}>
            <ThemedText type="small" themeColor="textSecondary">
              This month&apos;s income
            </ThemedText>
            <ThemedText type="heading" numberOfLines={1} adjustsFontSizeToFit>
              {formatEurosCompact(income)}
            </ThemedText>
          </PlanDonut>
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.message}>
            Add this month&apos;s income to see the split.
          </ThemedText>
        )}

        <ThemedView type="backgroundElement" style={styles.card}>
          {BUCKETS.map((bucket) => (
            <View key={bucket} style={styles.row}>
              <BucketBadge bucket={bucket} />
              <ThemedText type="smallBold" style={styles.name}>
                {BUCKET_LABELS[bucket]}
              </ThemedText>
              {targets ? (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatPercentOf(targets[bucket], income)}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.amount}>
                    {formatEurosCompact(targets[bucket])}
                  </ThemedText>
                </>
              ) : (
                <ThemedText type="smallBold">{planValue(plan, bucket)}</ThemedText>
              )}
            </View>
          ))}
        </ThemedView>

        {targets ? <ShortfallWarning shortfall={targets.shortfall} /> : null}

        <View style={styles.actions}>
          <Button
            label="Edit plan"
            icon="edit-2"
            onPress={() => router.push({ pathname: '/plan-edit', params: income > 0 ? { income: String(income) } : {} })}
          />
          <Button label="Edit fixed expenses" icon="home" variant="secondary" onPress={() => router.push('/fixed-expenses')} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

/** What the plan says about a part when there is no income to apply it to. */
function planValue(plan: IncomePlan, bucket: Bucket): string {
  if (bucket === 'fixed') return formatEurosCompact(fixedTotal(plan.fixedItems));
  if (bucket === otherFlexible(plan.kept)) return 'The rest';
  return plan.keptAmount.unit === 'pct' ? `${plan.keptAmount.pct} %` : formatEurosCompact(plan.keptAmount.cents);
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
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  message: {
    paddingVertical: Spacing.four,
    textAlign: 'center',
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
