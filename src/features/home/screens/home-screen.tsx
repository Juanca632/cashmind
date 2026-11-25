import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { CategorySplit } from '@/features/entries/components/category-split';
import { EntryList } from '@/features/entries/components/entry-list';
import { useMonthEntries } from '@/features/entries/hooks/use-month-entries';
import { useMoves } from '@/features/entries/hooks/use-moves';
import { usePreviousIncome } from '@/features/entries/hooks/use-previous-income';
import {
  categorySplit,
  countsInMonth,
  defaultEntryDate,
  EMPTY_KIND_TEXTS,
  entriesOfKind,
  firstEntries,
  HOME_LIST_SIZE,
  mainMoveLines,
  mergeByDate,
  movedIntoMain,
  totalsByKind,
} from '@/features/entries/rules';
import { addEntry, recordRecurringEntries } from '@/features/entries/service';
import { usePocket } from '@/features/entries/hooks/use-pocket';
import { SpaceSelector } from '@/features/home/components/space-selector';
import { SpendingPaceChart } from '@/features/home/components/spending-pace-chart';
import { PocketSpace } from '@/features/home/screens/pocket-space';
import { dailyAllowance, monthFigures, paceSentence, spendingPace, type DailyAllowance, type SpendingPace } from '@/features/home/month-summary';
import { usePlanVersions } from '@/features/plan/hooks/use-plan-versions';
import { savingsPercentFor } from '@/features/plan/rules';
import { ADD_LABELS, KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { IS_DEMO } from '@/shared/demo';
import { useMoney } from '@/shared/hooks/use-money';
import type { Money } from '@/shared/money';
import { formatMonth, isPastMonth, isValidMonthKey, monthKey } from '@/shared/months';
import { Hero, Layout, Size } from '@/shared/theme/theme';
import { hapticSuccess, hapticTick } from '@/shared/haptics';
import { useToday } from '@/shared/hooks/use-today';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { HeroCard } from '@/shared/ui/hero-card';
import { HeroFigure } from '@/shared/ui/hero-figure';
import { KindTile } from '@/shared/ui/kind-tile';
import { IconButton } from '@/shared/ui/icon-button';
import { LinkButton } from '@/shared/ui/link-button';
import { Pill } from '@/shared/ui/pill';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { DataError } from '@/shared/ui/data-error';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/**
 * Home first records the current month's monthly entries, then shows the month, so a new month
 * opens with them already there. It runs again when the month changes while the app is open.
 */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const today = useToday();
  const currentMonth = monthKey(today);
  const [recordedMonth, setRecordedMonth] = useState<string | null>(null);
  // A ref, not state: the effect may run twice for one month, and the month is recorded once.
  const recordingFor = useRef<string | null>(null);

  useEffect(() => {
    if (recordingFor.current === currentMonth) return;
    recordingFor.current = currentMonth;
    // A failure leaves the month as it is and shows it; returning to the app tries again.
    recordRecurringEntries(db, today)
      .catch(() => {
        recordingFor.current = null;
      })
      .then(() => setRecordedMonth(currentMonth));
  }, [db, currentMonth, today]);

  if (recordedMonth !== currentMonth) return <ThemedView style={styles.screen} />;
  return <HomeSpace today={today} />;
}

/** Home shows one space (specs/027-spaces): the month, or the pocket named by the `space` param. */
function HomeSpace({ today }: { today: Date }) {
  const params = useLocalSearchParams<{ space?: string }>();
  const id = Number(params.space);
  if (!params.space || !Number.isInteger(id) || id <= 0) return <HomeMonth today={today} />;
  return <PocketLoader id={id} today={today} />;
}

function PocketLoader({ id, today }: { id: number; today: Date }) {
  const loaded = usePocket(id);
  if (loaded.status === 'error') return <DataError topInset />;
  if (loaded.status === 'loading') return <ThemedView style={styles.screen} />;
  // A pocket deleted meanwhile, or a stale link: show the month instead.
  if (loaded.data === null) return <HomeMonth today={today} />;
  return <PocketSpace pocket={loaded.data.pocket} />;
}

function HomeMonth({ today }: { today: Date }) {
  const money = useMoney();
  const db = useSQLiteContext();
  const plan = usePlanVersions();
  const params = useLocalSearchParams<{ month?: string }>();
  const currentMonth = monthKey(today);
  // Ignore invalid or future months in the URL and fall back to the current month.
  const month = isValidMonthKey(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  // Reloads the month after a change made on this same screen.
  const [refresh, setRefresh] = useState(0);
  const entries = useMonthEntries(month, refresh);
  const previousIncome = usePreviousIncome(month, refresh);
  const moves = useMoves();
  // Which kind of entry the list is showing; null shows all of them.
  const [selected, setSelected] = useState<EntryKind | null>(null);
  // A repeat is tied to the month and its income as loaded: once the reload shows the new income
  // (or the month changes) the key changes, so a tap made before the reload cannot record it twice.
  const loadedIncome = entries.status === 'ready' ? totalsByKind(entries.data).income : 0;
  const repeatKey = `${month}:${loadedIncome}`;
  // A ref, not state: two taps in the same frame must not record the income twice.
  const repeatedFor = useRef<string | null>(null);
  const [repeatedKey, setRepeatedKey] = useState<string | null>(null);

  if (plan.status === 'error' || entries.status === 'error' || previousIncome.status === 'error' || moves.status === 'error') {
    return <DataError topInset />;
  }
  if (plan.status === 'loading' || entries.status === 'loading' || previousIncome.status === 'loading' || moves.status === 'loading') {
    return <ThemedView style={styles.screen} />;
  }

  const monthEntries = entries.data;
  // Expenses paid from a pocket are not the month's money: they count in no figure and show only in
  // their pocket's list (specs/026-pocket-spending).
  const counted = monthEntries.filter(countsInMonth);
  const isPast = isPastMonth(month, currentMonth);
  const percent = savingsPercentFor(plan.data, month);
  // Money moved out of pockets into Main adds to left to spend (specs/028-move-money).
  const movedIn = movedIntoMain(moves.data, month);
  const summary = monthFigures(monthEntries, moves.data, percent, month);
  const hasIncome = summary.income > 0;
  // Moves into Main show in the whole list only, not when one kind is picked.
  const lines = selected === null ? mainMoveLines(moves.data, month) : [];
  const list = firstEntries(mergeByDate(entriesOfKind(counted, selected), lines), HOME_LIST_SIZE);
  // Savings go into pockets, not categories (specs/025-pockets), so they have no split.
  const split = selected && selected !== 'savings' ? categorySplit(counted, selected) : [];

  async function repeatIncome(amountCents: number) {
    if (repeatedFor.current === repeatKey) return;
    repeatedFor.current = repeatKey;
    setRepeatedKey(repeatKey);
    const entry = { date: defaultEntryDate(month, today), kind: 'income', amountCents, note: 'Monthly income', category: 'other', pocketId: null } as const;
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
          <View style={styles.topActions}>
            {isPast ? null : <Pill label="My plan" onPress={() => router.push('/plan')} />}
            <IconButton icon="settings" accessibilityLabel="Settings" onPress={() => router.push('/settings')} />
          </View>
        </View>

        <HeroCard overspent={overspent}>
            {hasIncome ? (
              <HeroFigure
                label="Left to spend"
                cents={summary.left}
                countKey={month}
                detail={dailyText(dailyAllowance(summary.left, today, month), money)}
              />
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
                      label={`Repeat ${money.formatCompact(previousIncome.data)}`}
                      accessibilityLabel="Repeat last income"
                      disabled={repeatedKey === repeatKey}
                      onPress={() => repeatIncome(previousIncome.data as number)}
                    />
                  ) : null}
                </View>
              </View>
            )}
        </HeroCard>
        {/* Under the figure it changes, as Revolut switches accounts under the balance (specs/027-spaces). */}
        <SpaceSelector pocket={null} />

        {hasIncome ? (
          <View style={styles.section}>
            <SectionTitle>Overview</SectionTitle>
            <View style={styles.tiles}>
              <KindTile kind="income" value={money.formatCompact(summary.income)} detail="received" selected={selected} onSelect={toggle} />
              <KindTile kind="expense" title="Spent" value={money.formatCompact(summary.spent)} detail="this month" selected={selected} onSelect={toggle} />
              <KindTile
                kind="savings"
                value={money.formatCompact(summary.saved)}
                detail={summary.goal === 0 ? 'No goal' : savingsDone ? 'Goal reached' : `of ${money.formatCompact(summary.goal)}`}
                progress={summary.goal > 0 ? Math.min(summary.saved / summary.goal, 1) : undefined}
                selected={selected}
                onSelect={toggle}
              />
            </View>
          </View>
        ) : null}

        {hasIncome ? (
          <SpendingPaceSection
            pace={spendingPace(counted, summary.income + movedIn - Math.max(summary.goal, summary.saved), month, today)}
            month={month}
          />
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
              items={list.shown}
              today={today}
              emptyText={emptyListText(selected, isPast)}
              onPress={(entry) => router.push({ pathname: '/entry', params: { id: String(entry.id) } })}
              onPressMove={(line) => router.push({ pathname: '/move', params: { id: String(line.move.id) } })}
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

/** The small title above each block of home. */
function SectionTitle({ children }: { children: string }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary">
      {children}
    </ThemedText>
  );
}

/**
 * The month's spending against the plan's pace. In the current month the chart is headed by one
 * sentence saying how it stands today; what was spent is already on the Spent tile.
 */
function SpendingPaceSection({ pace, month }: { pace: SpendingPace; month: string }) {
  const money = useMoney();
  const today = pace.paceTodayCents;
  const line = `The plan's pace goes from ${money.format(pace.startCents)} to ${money.format(pace.endCents)}.`;
  const label =
    today === null
      ? `Spending pace: ${money.format(pace.spentCents)} spent this month, the plan allowed ${money.format(pace.endCents)}. ${line}`
      : `Spending pace: ${money.format(pace.spentCents)} spent so far, your pace today is ${money.format(today)}. ${line}`;
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <SectionTitle>Spending pace</SectionTitle>
        <LinkButton label="See trends ›" accessibilityLabel="See trends" onPress={() => router.push('/trends')} />
      </View>
      <Card>
        {today === null ? null : <ThemedText type="smallBold">{paceSentence(pace.spentCents, today, money.format)}</ThemedText>}
        <SpendingPaceChart pace={pace} month={month} accessibilityLabel={label} />
      </Card>
    </View>
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

/** The hero's line under "Left to spend": what can be spent each day until the month ends. */
function dailyText(daily: DailyAllowance | null, money: Money): string | null {
  if (daily === null) return null;
  return daily.daysLeft === 1
    ? `Today: ${money.format(daily.cents)}`
    : `≈ ${money.format(daily.cents)} / day · ${daily.daysLeft} days left`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centeredText: {
    textAlign: 'center',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.itemGap,
    justifyContent: 'space-between',
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.tightGap,
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
  tiles: {
    flexDirection: 'row',
    gap: Layout.itemGap,
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
