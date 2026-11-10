import { Feather } from '@react-native-vector-icons/feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryList } from '@/features/entries/components/entry-list';
import { useMonthEntries } from '@/features/entries/hooks/use-month-entries';
import { usePreviousIncome } from '@/features/entries/hooks/use-previous-income';
import { defaultEntryDate, totalsByKind } from '@/features/entries/rules';
import { addEntry } from '@/features/entries/service';
import { monthSummary } from '@/features/home/month-summary';
import { usePlanVersions } from '@/features/plan/hooks/use-plan-versions';
import { savingsPercentFor } from '@/features/plan/rules';
import { ADD_LABELS, KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { IS_DEMO } from '@/shared/demo';
import { formatEuros, formatEurosCompact } from '@/shared/money';
import { formatMonth, isPastMonth, isValidMonthKey, monthKey } from '@/shared/months';
import { Accent, KIND_COLORS, KIND_TINTS, FontFamily, Hero, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useToday } from '@/shared/hooks/use-today';
import { KIND_ICONS } from '@/shared/ui/kind-badge';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const plan = usePlanVersions();
  const params = useLocalSearchParams<{ month?: string }>();
  const today = useToday();
  const currentMonth = monthKey(today);
  // Ignore invalid or future months in the URL and fall back to the current month.
  const month = isValidMonthKey(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  // Reloads the month after a change made on this same screen.
  const [refresh, setRefresh] = useState(0);
  const entries = useMonthEntries(month, refresh);
  const previousIncome = usePreviousIncome(month, refresh);
  // Which kind of entry the list is showing; null shows all of them.
  const [selected, setSelected] = useState<EntryKind | null>(null);
  // A repeat is tied to the month and its income as loaded: once the reload shows the new income
  // (or the month changes) the key changes, so a tap made before the reload cannot record it twice.
  const loadedIncome = entries.status === 'ready' ? totalsByKind(entries.data).income : 0;
  const repeatKey = `${month}:${loadedIncome}`;
  // A ref, not state: two taps in the same frame must not record the income twice.
  const repeatedFor = useRef<string | null>(null);
  const [repeatedKey, setRepeatedKey] = useState<string | null>(null);

  if (plan.status === 'error' || entries.status === 'error' || previousIncome.status === 'error') return <DataError />;
  if (plan.status === 'loading' || entries.status === 'loading' || previousIncome.status === 'loading') {
    return <ThemedView style={styles.screen} />;
  }

  const monthEntries = entries.data;
  const isPast = isPastMonth(month, currentMonth);
  const percent = savingsPercentFor(plan.data, month);
  const summary = monthSummary(totalsByKind(monthEntries), percent);
  const hasIncome = summary.income > 0;

  async function repeatIncome(amountCents: number) {
    if (repeatedFor.current === repeatKey) return;
    repeatedFor.current = repeatKey;
    setRepeatedKey(repeatKey);
    const entry = { date: defaultEntryDate(month, today), kind: 'income', amountCents, note: 'Monthly income' } as const;
    const result = await addEntry(db, entry, new Date());
    if (result.ok) {
      setRefresh((current) => current + 1);
      return;
    }
    repeatedFor.current = null;
    setRepeatedKey(null);
    Alert.alert('Something went wrong', result.message);
  }
  const toggle = (kind: EntryKind) => setSelected(kind === selected ? null : kind);
  const openNewEntry = (kind?: EntryKind) => router.push({ pathname: '/entry', params: { month, kind } });
  const savingsDone = summary.goal > 0 && summary.saved >= summary.goal;

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
          {hasIncome ? (
            <LeftToSpend left={summary.left} />
          ) : (
            <View style={styles.askIncome}>
              <ThemedText type="heading" style={[styles.centeredText, { color: Hero.text }]}>
                Add this month&apos;s income
              </ThemedText>
              <View style={styles.cardActions}>
                <CardPill label="Add income" onPress={() => openNewEntry('income')} />
                {previousIncome.data !== null ? (
                  <CardPill
                    label={`Repeat ${formatEurosCompact(previousIncome.data)}`}
                    accessibilityLabel="Repeat last income"
                    disabled={repeatedKey === repeatKey}
                    onPress={() => repeatIncome(previousIncome.data as number)}
                  />
                ) : null}
              </View>
            </View>
          )}
        </View>

        {hasIncome ? (
          <View style={styles.tiles}>
            <KindTile kind="income" value={formatEurosCompact(summary.income)} detail="received" selected={selected} onSelect={toggle} />
            <KindTile kind="expense" title="Spent" value={formatEurosCompact(summary.spent)} detail="this month" selected={selected} onSelect={toggle} />
            <KindTile
              kind="savings"
              value={formatEurosCompact(summary.saved)}
              detail={summary.goal === 0 ? 'No goal' : savingsDone ? 'Goal reached' : `of ${formatEurosCompact(summary.goal)}`}
              selected={selected}
              onSelect={toggle}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <View style={styles.titleGroup}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {selected ? TILE_TITLES[selected] : 'Activity'}
              </ThemedText>
              {selected ? (
                <Pressable accessibilityRole="button" style={styles.showAll} onPress={() => setSelected(null)}>
                  <ThemedText type="small" style={{ color: Accent.background }}>
                    Show all
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            <Button
              label="Add"
              icon="plus"
              accessibilityLabel={ADD_LABELS[selected ?? 'expense']}
              variant="pill"
              onPress={() => openNewEntry(selected ?? undefined)}
            />
          </View>
          <ThemedView type="backgroundElement" style={styles.activity}>
            <EntryList
              entries={selected ? monthEntries.filter((entry) => entry.kind === selected) : monthEntries}
              today={today}
              emptyText={emptyListText(selected, isPast)}
              onPress={(entry) => router.push({ pathname: '/entry', params: { id: String(entry.id) } })}
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

/** Tile and filter titles; expenses read as what was spent. */
const TILE_TITLES: Record<EntryKind, string> = {
  income: KIND_LABELS.income,
  savings: KIND_LABELS.savings,
  expense: 'Spent',
};

const EMPTY_TEXTS: Record<EntryKind, string> = {
  income: 'No income this month.',
  savings: 'No savings this month.',
  expense: 'No expenses this month.',
};

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

function emptyListText(selected: EntryKind | null, isPast: boolean): string {
  if (selected) return EMPTY_TEXTS[selected];
  if (isPast) return 'Nothing was recorded this month.';
  return 'Record what you earn, spend and save.';
}

/** The month in brief: what can still be spent after expenses and the savings goal. */
function LeftToSpend({ left }: { left: number }) {
  const [whole, decimals] = formatEuros(left).split(',');
  return (
    <View style={styles.brief}>
      <ThemedText style={[styles.briefLabel, { color: Hero.label }]}>Left to spend</ThemedText>
      <View style={styles.figure}>
        <ThemedText numberOfLines={1} adjustsFontSizeToFit style={[styles.figureWhole, { color: Hero.text }]}>
          {whole}
        </ThemedText>
        <ThemedText style={[styles.figureDecimals, { color: Hero.label }]}>,{decimals}</ThemedText>
      </View>
    </View>
  );
}

type KindTileProps = {
  kind: EntryKind;
  title?: string;
  value: string;
  detail: string;
  selected: EntryKind | null;
  onSelect: (kind: EntryKind) => void;
};

/** One colored tile per kind of entry below the card. Tapping it lists only those entries. */
function KindTile({ kind, title = KIND_LABELS[kind], value, detail, selected, onSelect }: KindTileProps) {
  const color = KIND_COLORS[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityValue={{ text: `${value}, ${detail}` }}
      accessibilityState={{ selected: kind === selected }}
      onPress={() => onSelect(kind)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: KIND_TINTS[kind], borderColor: kind === selected ? color : 'transparent' },
        pressed && styles.pressed,
      ]}>
      <View style={styles.tileTitle}>
        <Feather name={KIND_ICONS[kind]} size={16} color={color} />
        <ThemedText type="smallBold" numberOfLines={1} style={{ color }}>
          {title}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} adjustsFontSizeToFit style={[styles.tileValue, { color }]}>
        {value}
      </ThemedText>
      <ThemedText type="caption" numberOfLines={1} style={{ color }}>
        {detail}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'center',
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
