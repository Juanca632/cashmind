import { Feather } from '@react-native-vector-icons/feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseList } from '@/features/expenses/components/expense-list';
import { useMonthExpenses } from '@/features/expenses/hooks/use-month-expenses';
import { totalsByBucket } from '@/features/expenses/rules';
import { FixedItemsList } from '@/features/plan/components/fixed-items-list';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { incomeForMonth, planForMonth, targetsFor } from '@/features/plan/rules';
import { BUCKET_LABELS, bucketProgress, type Bucket } from '@/shared/buckets';
import { IS_DEMO } from '@/shared/demo';
import { formatEuros, formatEurosCompact } from '@/shared/money';
import { formatMonth, isPastMonth, isValidMonthKey, monthKey } from '@/shared/months';
import { Accent, BUCKET_COLORS, BUCKET_TINTS, Hero, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useToday } from '@/shared/hooks/use-today';
import { BUCKET_ICONS } from '@/shared/ui/bucket-badge';
import { ShortfallWarning } from '@/shared/ui/bucket-rows';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const state = useIncomePlan();
  const params = useLocalSearchParams<{ month?: string }>();
  const today = useToday();
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
        <View style={styles.monthCard}>
          <View style={styles.topRow}>
            <CardPill
              label={formatMonth(month)}
              accessibilityLabel={`Month: ${formatMonth(month)}`}
              onPress={() => router.push({ pathname: '/month-picker', params: { month } })}
            />
            {IS_DEMO ? (
              <ThemedText type="caption" style={{ color: Hero.label }}>
                Demo data
              </ThemedText>
            ) : null}
            {isPast ? null : <CardPill label="My plan" onPress={() => router.push('/plan')} />}
          </View>

          {targets && plan ? (
            <>
              <MonthBrief spent={targets.fixed + spent.leisure} budget={targets.fixed + targets.leisure} />
              <View style={styles.actions}>
                <RoundAction
                  icon="plus"
                  label="Spend"
                  accessibilityLabel="Add expense"
                  onPress={() => router.push({ pathname: '/expense', params: { month } })}
                />
                <RoundAction
                  icon="trending-up"
                  label="Save"
                  accessibilityLabel="Add savings"
                  onPress={() => router.push({ pathname: '/expense', params: { month, bucket: 'savings' } })}
                />
                {isPast ? null : (
                  <RoundAction icon="edit-2" label="Edit plan" accessibilityLabel="Edit plan" onPress={() => router.push('/plan-edit')} />
                )}
              </View>
            </>
          ) : (
            <ThemedText style={[styles.centeredText, styles.noPlan, { color: Hero.label }]}>
              There was no plan in {formatMonth(month)}.
            </ThemedText>
          )}
        </View>

        {targets && plan ? (
          <>
            <ShortfallWarning shortfall={targets.shortfall} />
            <View style={styles.tiles}>
              <PartTile
                bucket="leisure"
                value={`${amountOnly(spent.leisure)} / ${amountOnly(targets.leisure)}`}
                selected={selected}
                onSelect={toggle}
              />
              <PartTile
                bucket="savings"
                value={`${amountOnly(spent.savings)} / ${amountOnly(targets.savings)}`}
                selected={selected}
                onSelect={toggle}
              />
              <PartTile bucket="fixed" value={formatEurosCompact(targets.fixed)} selected={selected} onSelect={toggle} />
            </View>
          </>
        ) : null}

        <ThemedView type="backgroundElement" style={styles.section}>
          <View style={styles.sectionTitle}>
            <ThemedText type="heading">{selected ? BUCKET_LABELS[selected] : 'Activity'}</ThemedText>
            {selected ? (
              <Pressable accessibilityRole="button" style={styles.showAll} onPress={() => setSelected(null)}>
                <ThemedText type="small" style={{ color: Accent.background }}>
                  Show all
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
          {selected === 'fixed' && plan ? (
            <FixedItemsList items={plan.fixedItems} />
          ) : (
            <ExpenseList
              expenses={selected ? monthExpenses.filter((expense) => expense.bucket === selected) : monthExpenses}
              today={today}
              emptyText={emptyListText(selected, isPast)}
              onPress={(expense) => router.push({ pathname: '/expense', params: { id: String(expense.id) } })}
            />
          )}
        </ThemedView>

        {isPast ? (
          <Button label="Back to current month" variant="secondary" onPress={() => router.setParams({ month: currentMonth })} />
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

/** '150' or '12,50': the amount without the euro sign, for the compact 'x / y' of a tile. */
function amountOnly(cents: number): string {
  return formatEurosCompact(cents).replace(/[\s\u00a0\u202f]€$/, '');
}

function CardPill({ label, accessibilityLabel, onPress }: { label: string; accessibilityLabel?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.cardPill, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={{ color: Hero.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function emptyListText(selected: Bucket | null, isPast: boolean): string {
  if (selected) return `Nothing in ${BUCKET_LABELS[selected]} this month.`;
  if (isPast) return 'Nothing was recorded this month.';
  return 'Record what you spend on wants and what you save. Fixed expenses are already counted.';
}

/** The month in brief: everything spent so far against what the plan allows. Savings is not spending. */
function MonthBrief({ spent, budget }: { spent: number; budget: number }) {
  const { left, over } = bucketProgress(spent, budget);
  const isOver = over > 0;
  const [whole, decimals] = formatEuros(spent).split(',');
  return (
    <View style={styles.brief}>
      <ThemedText type="small" style={{ color: Hero.label }}>
        Spent this month
      </ThemedText>
      <View style={styles.figure}>
        <ThemedText type="display" numberOfLines={1} style={{ color: Hero.text }}>
          {whole}
        </ThemedText>
        <ThemedText type="heading" style={{ color: Hero.label }}>
          ,{decimals}
        </ThemedText>
      </View>
      <ThemedText type="small" style={{ color: isOver ? Hero.over : Hero.label }}>
        of {formatEurosCompact(budget)} · {isOver ? `${formatEurosCompact(over)} over` : `${formatEurosCompact(left)} left`}
      </ThemedText>
    </View>
  );
}

function RoundAction({
  icon,
  label,
  accessibilityLabel,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={styles.actionCircle}>
        <Feather name={icon} size={22} color={Hero.text} />
      </View>
      <ThemedText type="small" style={{ color: Hero.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type PartTileProps = {
  bucket: Bucket;
  value: string;
  selected: Bucket | null;
  onSelect: (bucket: Bucket) => void;
};

/** One colored tile per part below the card. Tapping it shows what is inside. */
function PartTile({ bucket, value, selected, onSelect }: PartTileProps) {
  const color = BUCKET_COLORS[bucket];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={BUCKET_LABELS[bucket]}
      accessibilityState={{ selected: bucket === selected }}
      onPress={() => onSelect(bucket)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: BUCKET_TINTS[bucket], borderColor: bucket === selected ? color : 'transparent' },
        pressed && styles.pressed,
      ]}>
      <Feather name={BUCKET_ICONS[bucket]} size={22} color={color} />
      <ThemedText type="smallBold" style={[styles.tileValue, { color }]}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={{ color }}>
        {BUCKET_LABELS[bucket]}
      </ThemedText>
    </Pressable>
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
    gap: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.one,
  },
  monthCard: {
    backgroundColor: Hero.background,
    borderRadius: Radius.hero,
    experimental_backgroundImage: Hero.gradient,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardPill: {
    backgroundColor: Hero.control,
    borderRadius: Radius.full,
    justifyContent: 'center',
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.three,
  },
  noPlan: {
    paddingVertical: Spacing.five,
  },
  brief: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  figure: {
    alignItems: 'baseline',
    flexDirection: 'row',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  action: {
    alignItems: 'center',
    gap: Spacing.one,
    minWidth: 88,
  },
  actionCircle: {
    alignItems: 'center',
    backgroundColor: Hero.control,
    borderRadius: Radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    borderRadius: Radius.card,
    borderWidth: 1.5,
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.two + Spacing.one,
  },
  tileValue: {
    fontSize: 16,
  },
  section: {
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH,
  },
  showAll: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH,
  },
  pressed: {
    opacity: 0.6,
  },
});
