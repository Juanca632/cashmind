import { Feather } from '@react-native-vector-icons/feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { CategorySplit } from '@/features/entries/components/category-split';
import { EntryList } from '@/features/entries/components/entry-list';
import { useMonthEntries } from '@/features/entries/hooks/use-month-entries';
import { usePreviousIncome } from '@/features/entries/hooks/use-previous-income';
import { categorySplit, defaultEntryDate, EMPTY_KIND_TEXTS, entriesOfKind, firstEntries, HOME_LIST_SIZE, totalsByKind } from '@/features/entries/rules';
import { addEntry } from '@/features/entries/service';
import { monthSummary } from '@/features/home/month-summary';
import { usePlanVersions } from '@/features/plan/hooks/use-plan-versions';
import { savingsPercentFor } from '@/features/plan/rules';
import { ADD_LABELS, KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { IS_DEMO } from '@/shared/demo';
import { formatEuros, formatEurosCompact } from '@/shared/money';
import { formatMonth, isPastMonth, isValidMonthKey, monthKey } from '@/shared/months';
import { BORDER_WIDTH, elevation, FontFamily, Hero, IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { hapticSuccess, hapticTick } from '@/shared/haptics';
import { useCountUp } from '@/shared/hooks/use-count-up';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { useToday } from '@/shared/hooks/use-today';
import { KIND_ICONS } from '@/shared/ui/kind-badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { LinkButton } from '@/shared/ui/link-button';
import { Pill } from '@/shared/ui/pill';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { DataError } from '@/shared/ui/data-error';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
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

  if (plan.status === 'error' || entries.status === 'error' || previousIncome.status === 'error') return <DataError topInset />;
  if (plan.status === 'loading' || entries.status === 'loading' || previousIncome.status === 'loading') {
    return <ThemedView style={styles.screen} />;
  }

  const monthEntries = entries.data;
  const isPast = isPastMonth(month, currentMonth);
  const percent = savingsPercentFor(plan.data, month);
  const summary = monthSummary(totalsByKind(monthEntries), percent);
  const hasIncome = summary.income > 0;
  const list = firstEntries(entriesOfKind(monthEntries, selected), HOME_LIST_SIZE);
  const split = selected ? categorySplit(monthEntries, selected) : [];

  async function repeatIncome(amountCents: number) {
    if (repeatedFor.current === repeatKey) return;
    repeatedFor.current = repeatKey;
    setRepeatedKey(repeatKey);
    const entry = { date: defaultEntryDate(month, today), kind: 'income', amountCents, note: 'Monthly income', category: 'other' } as const;
    const result = await addEntry(db, entry, new Date());
    if (result.ok) {
      hapticSuccess();
      setRefresh((current) => current + 1);
      return;
    }
    repeatedFor.current = null;
    setRepeatedKey(null);
    Alert.alert('Something went wrong', result.message);
  }
  const toggle = (kind: EntryKind) => {
    hapticTick();
    setSelected(kind === selected ? null : kind);
  };
  const openNewEntry = (kind?: EntryKind) => router.push({ pathname: '/entry', params: { month, kind } });
  const savingsDone = summary.goal > 0 && summary.saved >= summary.goal;
  const overspent = hasIncome && summary.left < 0;

  return (
    <ThemedView style={styles.screen}>
      <ScreenScroll topInset>
        <View style={styles.topRow}>
          <Pill
            label={formatMonth(month)}
            icon="calendar"
            accessibilityLabel={`Month: ${formatMonth(month)}`}
            onPress={() => router.push({ pathname: '/month-picker', params: { month } })}
          />
          {IS_DEMO ? (
            <ThemedText type="caption" themeColor="textSecondary">
              Demo data
            </ThemedText>
          ) : null}
          {isPast ? null : <Pill label="My plan" onPress={() => router.push('/plan')} />}
        </View>

        {/* The shadow sits on its own view: the card clips its content to its rounded corners. */}
        <View style={[styles.monthShadow, elevation(theme, overspent ? 'heroOverspent' : 'hero')]}>
          <View style={styles.monthCard}>
            <OverspentLayer visible={overspent} />
            {hasIncome ? (
              <LeftToSpend left={summary.left} month={month} />
            ) : (
              <View style={styles.askIncome}>
                <ThemedText type="heading" style={[styles.centeredText, { color: Hero.text }]}>
                  Add this month&apos;s income
                </ThemedText>
                <View style={styles.cardActions}>
                  <Pill variant="hero" label="Add income" onPress={() => openNewEntry('income')} />
                  {previousIncome.data !== null ? (
                    <Pill
                      variant="hero"
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
        </View>

        {hasIncome ? (
          <View style={styles.tiles}>
            <KindTile kind="income" value={formatEurosCompact(summary.income)} detail="received" selected={selected} onSelect={toggle} />
            <KindTile kind="expense" title="Spent" value={formatEurosCompact(summary.spent)} detail="this month" selected={selected} onSelect={toggle} />
            <KindTile
              kind="savings"
              value={formatEurosCompact(summary.saved)}
              detail={summary.goal === 0 ? 'No goal' : savingsDone ? 'Goal reached' : `of ${formatEurosCompact(summary.goal)}`}
              progress={summary.goal > 0 ? Math.min(summary.saved / summary.goal, 1) : undefined}
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
              {selected ? <LinkButton label="Show all" onPress={() => setSelected(null)} /> : null}
            </View>
            <Pill
              label="Add"
              icon="plus"
              accessibilityLabel={ADD_LABELS[selected ?? 'expense']}
              onPress={() => openNewEntry(selected ?? undefined)}
            />
          </View>
          {selected && split.length > 0 ? <CategorySplit kind={selected} shares={split} /> : null}
          <Card style={styles.activity}>
            <EntryList
              entries={list.shown}
              today={today}
              emptyText={emptyListText(selected, isPast)}
              onPress={(entry) => router.push({ pathname: '/entry', params: { id: String(entry.id) } })}
            />
          </Card>
          {list.total > HOME_LIST_SIZE ? (
            <Button
              label={`See all (${list.total})`}
              accessibilityLabel={`See all ${list.total} entries`}
              variant="secondary"
              onPress={() => router.push({ pathname: '/activity', params: { month, kind: selected ?? undefined } })}
            />
          ) : null}
        </View>

        {isPast ? (
          <Button label="Back to current month" variant="secondary" onPress={() => router.setParams({ month: currentMonth })} />
        ) : null}
      </ScreenScroll>
    </ThemedView>
  );
}

/** Tile and filter titles; expenses read as what was spent. */
const TILE_TITLES: Record<EntryKind, string> = {
  income: KIND_LABELS.income,
  savings: KIND_LABELS.savings,
  expense: 'Spent',
};

function emptyListText(selected: EntryKind | null, isPast: boolean): string {
  if (selected) return EMPTY_KIND_TEXTS[selected];
  if (isPast) return 'Nothing was recorded this month.';
  return 'Record what you earn, spend and save.';
}

/** The red version of the card, faded in over the green one when the month is overspent. */
function OverspentLayer({ visible }: { visible: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overspent,
        { opacity: visible ? 1 : 0, transitionProperty: 'opacity', transitionDuration: reducedMotion ? 0 : 250 },
      ]}
    />
  );
}

/** The month in brief: what can still be spent after expenses and the savings goal. */
function LeftToSpend({ left, month }: { left: number; month: string }) {
  const shown = useCountUp(left, month);
  const [whole, decimals] = formatEuros(shown).split(',');
  return (
    <View style={styles.brief} accessible accessibilityLabel={`Left to spend: ${formatEuros(left)}`}>
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
  /** How full the savings goal bar is, from 0 to 1. No bar when undefined. */
  progress?: number;
  selected: EntryKind | null;
  onSelect: (kind: EntryKind) => void;
};

/** One colored tile per kind of entry below the card. Tapping it lists only those entries. */
function KindTile({ kind, title = KIND_LABELS[kind], value, detail, progress, selected, onSelect }: KindTileProps) {
  const theme = useTheme();
  const color = theme.kindInk[kind];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityValue={{ text: `${value}, ${detail}` }}
      accessibilityState={{ selected: kind === selected }}
      onPress={() => onSelect(kind)}
      style={[
        styles.tile,
        // Tapped to filter the list, so they float like the other things you press.
        elevation(theme, 'raised'),
        { backgroundColor: theme.kindTint[kind], borderColor: kind === selected ? color : 'transparent' },
      ]}>
      <View style={styles.tileTitle}>
        <Feather name={KIND_ICONS[kind]} size={IconSize.small} color={color} />
        <ThemedText type="smallBold" numberOfLines={1} style={{ color }}>
          {title}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.tileValue, { color }]}>
        {value}
      </ThemedText>
      <ThemedText type="caption" numberOfLines={1} style={{ color }}>
        {detail}
      </ThemedText>
      {progress === undefined ? null : <GoalBar progress={progress} color={color} />}
    </PressableScale>
  );
}

/** How much of the savings goal is saved. Decorative: the tile already says it in words. */
function GoalBar({ progress, color }: { progress: number; color: string }) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="savings-goal-bar"
      style={[styles.goalTrack, { backgroundColor: theme.savingsTrack }]}>
      <Animated.View
        style={[
          styles.goalFill,
          {
            backgroundColor: color,
            width: `${progress * 100}%`,
            transitionProperty: 'width',
            transitionDuration: reducedMotion ? 0 : 300,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centeredText: {
    textAlign: 'center',
  },
  monthShadow: {
    borderRadius: Radius.hero,
  },
  monthCard: {
    backgroundColor: Hero.background,
    overflow: 'hidden',
    borderRadius: Radius.hero,
    experimental_backgroundImage: Hero.gradient,
    gap: Layout.sectionGap,
    justifyContent: 'center',
    minHeight: Size.hero,
    padding: Layout.cardPadding,
  },
  overspent: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: Hero.overspentGradient,
  },
  goalTrack: {
    borderRadius: Radius.full,
    height: Size.progress,
    marginTop: Layout.tightGap,
    overflow: 'hidden',
  },
  goalFill: {
    borderRadius: Radius.full,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  askIncome: {
    alignItems: 'center',
    gap: Layout.sectionGap,
    paddingVertical: Layout.itemGap,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
    justifyContent: 'center',
  },
  brief: {
    alignItems: 'center',
    gap: Layout.tightGap,
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
    gap: Layout.itemGap,
  },
  tile: {
    borderRadius: Radius.card,
    borderWidth: BORDER_WIDTH,
    flex: 1,
    gap: Layout.tightGap,
    minWidth: 0,
    padding: Layout.tilePadding,
  },
  tileValue: {
    fontSize: 18,
    lineHeight: 24,
  },
  tileTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.tightGap,
  },
  section: {
    gap: Layout.itemGap,
  },
  titleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.sectionGap,
  },
  activity: {
    gap: 0,
    paddingVertical: Layout.itemGap,
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    // As tall as the pill it holds: a taller row would add space above the section.
    minHeight: Size.pill,
  },
});
