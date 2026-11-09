import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { incomeForMonth, planForMonth, targetsFor } from '@/features/plan/rules';
import { BUCKETS, BUCKET_LABELS } from '@/shared/buckets';
import { formatEuros, formatPercentOf } from '@/shared/money';
import { monthKey } from '@/shared/months';
import { Spacing } from '@/shared/theme/theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { PlanBar } from '@/shared/ui/plan-bar';
import { SectionCard } from '@/shared/ui/section-card';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** The plan as it stands, one section per part. Changing it happens on another screen. */
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
        <SectionCard title="Fixed expenses" value={formatEuros(targets.fixed)} />

        <SectionCard title="Monthly income" value={formatEuros(plan.incomeCents)}>
          {thisMonth.isOverride ? (
            <ThemedText type="small" themeColor="textSecondary">
              This month only: {formatEuros(thisMonth.incomeCents)}
            </ThemedText>
          ) : null}
          <Button
            label="Change this month's income"
            variant="soft"
            onPress={() => router.replace('/month-income')}
          />
        </SectionCard>

        <SectionCard title="How it is split">
          <PlanBar targets={targets} />
          {BUCKETS.map((bucket) => (
            <View key={bucket} style={styles.row}>
              <BucketBadge bucket={bucket} size="small" />
              <ThemedText style={styles.flex}>{BUCKET_LABELS[bucket]}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatPercentOf(targets[bucket], plan.incomeCents)}
              </ThemedText>
              <ThemedText type="smallBold">{formatEuros(targets[bucket])}</ThemedText>
            </View>
          ))}
        </SectionCard>

        <Button label="Edit plan" icon="edit-2" onPress={() => router.push('/plan-edit')} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
