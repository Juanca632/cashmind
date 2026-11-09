import { Feather } from '@react-native-vector-icons/feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseList } from '@/features/expenses/components/expense-list';
import { useMonthExpenses } from '@/features/expenses/hooks/use-month-expenses';
import { isExpenseMonthEditable, totalsByBucket } from '@/features/expenses/rules';
import { FixedItemsList } from '@/features/plan/components/fixed-items-list';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { incomeForMonth, planForMonth, targetsFor } from '@/features/plan/rules';
import { BUCKET_LABELS, bucketProgress, type Bucket } from '@/shared/buckets';
import { formatEuros } from '@/shared/money';
import { formatMonth, isPastMonth, isValidMonthKey, monthKey } from '@/shared/months';
import { BUCKET_COLORS, BUCKET_COLORS_ON_HERO, CARD_SHADOW, Hero, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { ShortfallWarning } from '@/shared/ui/bucket-rows';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** The over-budget color, light enough to read on the Hero background. */
const OVER_ON_HERO = '#FF9A8C';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
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
          List what you must pay, then split the rest between savings and wants.
        </ThemedText>
        <Button label="Set up my plan" onPress={() => router.push('/plan-edit')} />
      </ThemedView>
    );
  }

  const isPast = isPastMonth(month, currentMonth);
  const canEditExpenses = isExpenseMonthEditable(month, today);
  const plan = planForMonth(versions, month);
  const income = plan ? incomeForMonth(plan, overrides, month) : null;
  const targets = plan && income ? targetsFor(plan, income.incomeCents) : null;
  const spent = totalsByBucket(monthExpenses);
  const toggle = (bucket: Bucket) => setSelected(bucket === selected ? null : bucket);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing.five + insets.bottom, paddingTop: Spacing.two + insets.top },
        ]}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Month: ${formatMonth(month)}`}
            accessibilityHint="Opens the month picker"
            onPress={() => router.push({ pathname: '/month-picker', params: { month } })}
            style={({ pressed }) => [styles.month, pressed && styles.pressed]}>
            <ThemedText type="smallBold">{formatMonth(month)}</ThemedText>
            <Feather name="chevron-down" size={16} color={theme.text} />
          </Pressable>
          {isPast ? null : <Button label="My plan" variant="pill" onPress={() => router.push('/plan')} />}
        </View>

        {targets && plan ? (
          <>
            <LeftToSpendCard
              spent={spent.leisure}
              target={targets.leisure}
              onPress={() => toggle('leisure')}
            />
            <ShortfallWarning shortfall={targets.shortfall} />
            <View style={styles.parts}>
              <PartRow bucket="savings" selected={selected} onSelect={toggle}>
                <SavingsProgress saved={spent.savings} target={targets.savings} />
              </PartRow>
              <PartRow bucket="fixed" selected={selected} onSelect={toggle}>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {formatEuros(targets.fixed)} · {plan.fixedItems.length === 1 ? '1 item' : `${plan.fixedItems.length} items`}
                </ThemedText>
              </PartRow>
            </View>
          </>
        ) : (
          <View style={styles.planCard}>
            <ThemedText style={[styles.centeredText, { color: Hero.label }]}>
              There was no plan in {formatMonth(month)}.
            </ThemedText>
          </View>
        )}

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
          {selected === 'fixed' && plan ? (
            <FixedItemsList items={plan.fixedItems} />
          ) : (
            <ExpenseList
              expenses={selected ? monthExpenses.filter((expense) => expense.bucket === selected) : monthExpenses}
              onPress={
                canEditExpenses
                  ? (expense) => router.push({ pathname: '/expense', params: { id: String(expense.id) } })
                  : undefined
              }
            />
          )}
        </View>

        {isPast ? (
          <Button label="Back to current month" variant="secondary" onPress={() => router.setParams({ month: currentMonth })} />
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

/** The screen's focal point: how much of the wants budget is still available. */
function LeftToSpendCard({ spent, target, onPress }: { spent: number; target: number; onPress: () => void }) {
  const { left, over } = bucketProgress(spent, target);
  const isOver = over > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Wants, ${isOver ? `${formatEuros(over)} over` : `${formatEuros(left)} left to spend`}`}
      onPress={onPress}
      style={({ pressed }) => [styles.planCard, pressed && styles.pressed]}>
      <ThemedText type="small" style={{ color: Hero.label }}>
        Left to spend
      </ThemedText>
      <ThemedText
        type="display"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ color: isOver ? OVER_ON_HERO : Hero.text }}>
        {isOver ? `${formatEuros(over)} over` : formatEuros(left)}
      </ThemedText>
      <ProgressBar
        spent={spent}
        target={target}
        fill={isOver ? OVER_ON_HERO : BUCKET_COLORS_ON_HERO.leisure}
        track="rgba(255, 255, 255, 0.2)"
      />
      <ThemedText type="small" style={{ color: Hero.label }}>
        {formatEuros(spent)} of {formatEuros(target)}
      </ThemedText>
    </Pressable>
  );
}

type PartRowProps = {
  bucket: Bucket;
  selected: Bucket | null;
  onSelect: (bucket: Bucket) => void;
  children: ReactNode;
};

/** One compact line per part below the main card. Tapping it shows what is inside. */
function PartRow({ bucket, selected, onSelect, children }: PartRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={BUCKET_LABELS[bucket]}
      accessibilityState={{ selected: bucket === selected }}
      onPress={() => onSelect(bucket)}
      style={({ pressed }) => [
        styles.part,
        { backgroundColor: theme.backgroundElement, borderColor: bucket === selected ? BUCKET_COLORS[bucket] : 'transparent' },
        pressed && styles.pressed,
      ]}>
      <BucketBadge bucket={bucket} />
      <View style={styles.partText}>
        <ThemedText type="smallBold">{BUCKET_LABELS[bucket]}</ThemedText>
        {children}
      </View>
      <Feather name="chevron-right" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

function SavingsProgress({ saved, target }: { saved: number; target: number }) {
  const theme = useTheme();
  const goalReached = saved > 0 && bucketProgress(saved, target).left === 0;
  return (
    <View style={styles.savings}>
      <ProgressBar spent={saved} target={target} fill={BUCKET_COLORS.savings} track={theme.backgroundSelected} />
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {goalReached ? 'Goal reached · ' : ''}
        {formatEuros(saved)} of {formatEuros(target)}
      </ThemedText>
    </View>
  );
}

function ProgressBar({ spent, target, fill, track }: { spent: number; target: number; fill: string; track: string }) {
  const ratio = target > 0 ? Math.min(spent / target, 1) : spent > 0 ? 1 : 0;
  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <View style={[styles.fill, { backgroundColor: fill, width: `${ratio * 100}%` }]} />
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
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  month: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: MIN_TOUCH,
    paddingRight: Spacing.three,
  },
  planCard: {
    backgroundColor: Hero.background,
    borderRadius: Radius.hero,
    gap: Spacing.two,
    padding: Spacing.four,
  },
  parts: {
    gap: Spacing.two,
  },
  part: {
    alignItems: 'center',
    borderRadius: Radius.card,
    borderWidth: 1.5,
    boxShadow: CARD_SHADOW,
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  partText: {
    flex: 1,
    gap: Spacing.one,
  },
  savings: {
    gap: Spacing.one,
  },
  track: {
    borderRadius: Spacing.one,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Spacing.one,
    height: '100%',
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
