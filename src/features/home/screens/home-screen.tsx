import { Feather } from '@react-native-vector-icons/feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseList } from '@/features/expenses/components/expense-list';
import { useMonthExpenses } from '@/features/expenses/hooks/use-month-expenses';
import { usePreviousIncome } from '@/features/expenses/hooks/use-previous-income';
import { defaultExpenseDate, totalsByBucket } from '@/features/expenses/rules';
import { addExpense } from '@/features/expenses/service';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { planForMonth, targetsFor } from '@/features/plan/rules';
import { BUCKET_LABELS, type Bucket } from '@/shared/buckets';
import { IS_DEMO } from '@/shared/demo';
import { formatEuros, formatEurosCompact } from '@/shared/money';
import { formatMonth, isPastMonth, isValidMonthKey, monthKey } from '@/shared/months';
import { Accent, BUCKET_COLORS, BUCKET_TINTS, FontFamily, Hero, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useToday } from '@/shared/hooks/use-today';
import { BUCKET_ICONS } from '@/shared/ui/bucket-badge';
import { ShortfallWarning } from '@/shared/ui/shortfall-warning';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const state = useIncomePlan();
  const params = useLocalSearchParams<{ month?: string }>();
  const today = useToday();
  const currentMonth = monthKey(today);
  // Ignore invalid or future months in the URL and fall back to the current month.
  const month = isValidMonthKey(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  // Reloads the month after a change made on this same screen.
  const [refresh, setRefresh] = useState(0);
  const expenses = useMonthExpenses(month, refresh);
  const previousIncome = usePreviousIncome(month, refresh);
  const [repeating, setRepeating] = useState(false);
  const repeatInProgress = useRef(false);
  // Which part of the plan the expense list is showing; null shows all of them.
  const [selected, setSelected] = useState<Bucket | null>(null);

  if (state.status === 'error' || expenses.status === 'error' || previousIncome.status === 'error') return <DataError />;
  if (state.status === 'loading' || expenses.status === 'loading' || previousIncome.status === 'loading') {
    return <ThemedView style={styles.screen} />;
  }

  const versions = state.data;
  const monthExpenses = expenses.data;

  if (versions.length === 0) {
    return (
      <ThemedView style={[styles.screen, styles.centeredScreen]}>
        <ThemedText type="heading">Plan your month</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          List what you must pay, then split the rest between savings and leisure.
        </ThemedText>
        <Button label="Set up my plan" onPress={() => router.push('/fixed-expenses')} />
      </ThemedView>
    );
  }

  const isPast = isPastMonth(month, currentMonth);
  const plan = planForMonth(versions, month);
  const spent = totalsByBucket(monthExpenses);
  const targets = plan && spent.income > 0 ? targetsFor(plan, spent.income) : null;

  async function repeatIncome(amountCents: number) {
    // A ref, not state: two taps in the same frame must not record the income twice.
    if (repeatInProgress.current) return;
    repeatInProgress.current = true;
    setRepeating(true);
    try {
      const entry = { date: defaultExpenseDate(month, today), bucket: 'income', amountCents, note: 'Monthly income' } as const;
      const result = await addExpense(db, entry, new Date());
      if (result.ok) setRefresh((current) => current + 1);
      else Alert.alert('Something went wrong', result.message);
    } finally {
      repeatInProgress.current = false;
      setRepeating(false);
    }
  }
  const toggle = (bucket: Bucket) => setSelected(bucket === selected ? null : bucket);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing.five + insets.bottom, paddingTop: Spacing.two + insets.top },
        ]}>
        <View style={styles.topRow}>
          <Button
            label={formatMonth(month)}
            icon="calendar"
            accessibilityLabel={`Month: ${formatMonth(month)}`}
            variant="pill"
            onPress={() => router.push({ pathname: '/month-picker', params: { month } })}
          />
          {IS_DEMO ? (
            <ThemedText type="caption" themeColor="textSecondary">
              Demo data
            </ThemedText>
          ) : null}
          {isPast ? null : <Button label="My plan" variant="pill" onPress={() => router.push('/plan')} />}
        </View>

        <View style={styles.monthCard}>
          {targets ? (
            <MonthBrief spent={targets.fixed + spent.leisure} />
          ) : plan ? (
            <View style={styles.askIncome}>
              <ThemedText type="heading" style={[styles.centeredText, { color: Hero.text }]}>
                Add this month&apos;s income
              </ThemedText>
              {previousIncome.data !== null ? (
                <CardPill
                  label={`Repeat ${formatEurosCompact(previousIncome.data)}`}
                  accessibilityLabel="Repeat last income"
                  disabled={repeating}
                  onPress={() => repeatIncome(previousIncome.data as number)}
                />
              ) : null}
            </View>
          ) : (
            <ThemedText style={[styles.centeredText, styles.noPlan, { color: Hero.label }]}>
              There was no plan in {formatMonth(month)}.
            </ThemedText>
          )}

        </View>

        {targets ? (
          <>
            <ShortfallWarning shortfall={targets.shortfall} />
            <View style={styles.tiles}>
              <PartTile
                bucket="leisure"
                value={spent.leisure > targets.leisure ? `${formatEurosCompact(spent.leisure - targets.leisure)} over` : `${formatEurosCompact(targets.leisure - spent.leisure)} left`}
                detail={`${percentOf(spent.leisure, targets.leisure)} % used`}
                selected={selected}
                onSelect={toggle}
              />
              <PartTile
                bucket="savings"
                value={spent.savings >= targets.savings && spent.savings > 0 ? 'Goal reached' : `${formatEurosCompact(targets.savings - spent.savings)} to go`}
                detail={`${percentOf(spent.savings, targets.savings)} % saved`}
                selected={selected}
                onSelect={toggle}
              />
            </View>
          </>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <View style={styles.titleGroup}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {selected ? BUCKET_LABELS[selected] : 'Activity'}
              </ThemedText>
              {selected ? (
                <Pressable accessibilityRole="button" style={styles.showAll} onPress={() => setSelected(null)}>
                  <ThemedText type="small" style={{ color: Accent.background }}>
                    Show all
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            {plan ? (
              <Button
                label="Add"
                icon="plus"
                accessibilityLabel={selected === 'savings' ? 'Add to savings' : 'Add expense'}
                variant="pill"
                onPress={() => router.push({ pathname: '/expense', params: { month, bucket: selected ?? undefined } })}
              />
            ) : null}
          </View>
          <ThemedView type="backgroundElement" style={styles.activity}>
            <ExpenseList
              expenses={selected ? monthExpenses.filter((expense) => expense.bucket === selected) : monthExpenses}
              today={today}
              emptyText={emptyListText(selected, isPast)}
              onPress={(expense) => router.push({ pathname: '/expense', params: { id: String(expense.id) } })}
            />
          </ThemedView>
        </View>

        {isPast ? (
          <Button label="Back to current month" variant="secondary" onPress={() => router.setParams({ month: currentMonth })} />
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function CardPill({
  label,
  accessibilityLabel,
  disabled = false,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.cardPill, (pressed || disabled) && styles.pressed]}>
      <ThemedText type="smallBold" style={{ color: Hero.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function emptyListText(selected: Bucket | null, isPast: boolean): string {
  if (selected) return `Nothing in ${BUCKET_LABELS[selected]} this month.`;
  if (isPast) return 'Nothing was recorded this month.';
  return 'Record what you earn, spend and save. Fixed expenses are already counted.';
}

/** The month in brief: everything spent so far, fixed expenses included. Savings is not spending. */
function MonthBrief({ spent }: { spent: number }) {
  const [whole, decimals] = formatEuros(spent).split(',');
  return (
    <View style={styles.brief}>
      <ThemedText style={[styles.briefLabel, { color: Hero.label }]}>Spent this month</ThemedText>
      <View style={styles.figure}>
        <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.figureWhole, { color: Hero.text }]}>
          {whole}
        </ThemedText>
        <ThemedText style={[styles.figureDecimals, { color: Hero.label }]}>,{decimals}</ThemedText>
      </View>
    </View>
  );
}

/** How much of `target` is done, as a whole percentage. */
function percentOf(done: number, target: number): number {
  return target > 0 ? Math.round((done * 100) / target) : 0;
}

type PartTileProps = {
  bucket: Bucket;
  value: string;
  detail: string;
  selected: Bucket | null;
  onSelect: (bucket: Bucket) => void;
};

/** One colored tile per part below the card. Tapping it shows what is inside. */
function PartTile({ bucket, value, detail, selected, onSelect }: PartTileProps) {
  const color = BUCKET_COLORS[bucket];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={BUCKET_LABELS[bucket]}
      accessibilityValue={{ text: `${value}, ${detail}` }}
      accessibilityState={{ selected: bucket === selected }}
      onPress={() => onSelect(bucket)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: BUCKET_TINTS[bucket], borderColor: bucket === selected ? color : 'transparent' },
        pressed && styles.pressed,
      ]}>
      <View style={styles.tileTitle}>
        <Feather name={BUCKET_ICONS[bucket]} size={18} color={color} />
        <ThemedText type="smallBold" style={{ color }}>
          {BUCKET_LABELS[bucket]}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} adjustsFontSizeToFit style={[styles.tileValue, { color }]}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={{ color }}>
        {detail}
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
    justifyContent: 'center',
    minHeight: 168,
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
  askIncome: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noPlan: {
    paddingVertical: Spacing.five,
  },
  brief: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  briefLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  figure: {
    alignItems: 'baseline',
    flexDirection: 'row',
  },
  figureWhole: {
    flexShrink: 1,
    fontFamily: FontFamily.bold,
    fontSize: 64,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    lineHeight: 72,
  },
  figureDecimals: {
    fontFamily: FontFamily.semiBold,
    fontSize: 28,
    lineHeight: 36,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    borderRadius: Radius.card,
    borderWidth: 1.5,
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
    padding: Spacing.two + Spacing.one,
  },
  tileValue: {
    fontSize: 18,
    lineHeight: 24,
  },
  tileTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.one,
  },
  titleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  activity: {
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH,
    paddingLeft: Spacing.one,
  },
  showAll: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH,
  },
  pressed: {
    opacity: 0.6,
  },
});
