import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useEntriesBetween } from '@/features/entries/hooks/use-entries-between';
import { categorySplit } from '@/features/entries/rules';
import { TrendBars } from '@/features/home/components/trend-bars';
import { TrendCategoryList } from '@/features/home/components/trend-category-list';
import {
  averageSentence,
  goalCount,
  monthsInUse,
  monthTotals,
  savingsGoals,
  TREND_MONTHS,
  TREND_PILLS,
  trendAverage,
} from '@/features/home/trends';
import { usePlanVersions } from '@/features/plan/hooks/use-plan-versions';
import { hapticTick } from '@/shared/haptics';
import { useToday } from '@/shared/hooks/use-today';
import type { EntryKind } from '@/shared/kinds';
import { formatEuros } from '@/shared/money';
import { formatMonth, formatMonthName, lastMonths, monthKey } from '@/shared/months';
import { Layout } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Card } from '@/shared/ui/card';
import { DataError } from '@/shared/ui/data-error';
import { LinkButton } from '@/shared/ui/link-button';
import { Pill } from '@/shared/ui/pill';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/**
 * The last six months of one kind at a time. Tapping a bar picks the month the number, the sentence
 * and the categories are about; it never leaves the screen.
 */
export default function TrendsScreen() {
  const theme = useTheme();
  const today = useToday();
  const currentMonth = monthKey(today);
  const months = lastMonths(currentMonth, TREND_MONTHS);
  const entries = useEntriesBetween(months[0], currentMonth);
  const plan = usePlanVersions();
  const [kind, setKind] = useState<EntryKind>('expense');
  const [picked, setPicked] = useState(currentMonth);
  // A month picked before the month changed under the open screen falls back to the current one.
  const selected = months.includes(picked) ? picked : currentMonth;

  if (entries.status === 'error' || plan.status === 'error') return <DataError />;
  if (entries.status === 'loading' || plan.status === 'loading') return <ThemedView style={styles.screen} />;

  const totals = monthTotals(entries.data, months, kind);
  const average = trendAverage(totals, monthsInUse(entries.data), currentMonth);
  const cents = totals.find((total) => total.month === selected)?.cents ?? 0;
  const goals = kind === 'savings' ? savingsGoals(entries.data, months, plan.data) : undefined;
  const count = goals ? goalCount(goals) : null;
  const inUse = monthsInUse(entries.data);
  const isCurrent = selected === currentMonth;
  const rows = categorySplit(
    entries.data.filter((entry) => entry.date.slice(0, 7) === selected),
    kind,
  ).map((share) => {
    const usual = trendAverage(monthTotals(entries.data, months, kind, share.category), inUse, currentMonth);
    return { share, versusUsual: usual === null ? null : averageSentence(share.cents, usual, isCurrent, formatEuros, 'usual') };
  });

  return (
    <ThemedView style={styles.screen}>
      <ScreenScroll>
        <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Kind">
          {TREND_PILLS.map((pill) => (
            <Pill
              key={pill.kind}
              label={pill.label}
              accessibilityRole="radio"
              selected={pill.kind === kind}
              colors={{ fill: theme.kindTint[pill.kind], ink: theme.kindInk[pill.kind] }}
              onPress={() => {
                if (pill.kind === kind) return;
                hapticTick();
                setKind(pill.kind);
              }}
            />
          ))}
        </View>

        <Card>
          <View style={styles.figure} accessibilityLiveRegion="polite">
            <ThemedText type="small" themeColor="textSecondary">
              {formatMonth(selected)}
            </ThemedText>
            <ThemedText type="heading" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {formatEuros(cents)}
            </ThemedText>
            {average === null ? null : (
              <ThemedText type="small">{averageSentence(cents, average, isCurrent, formatEuros, 'your average')}</ThemedText>
            )}
          </View>
          <TrendBars
            kind={kind}
            totals={totals}
            selected={selected}
            onSelect={setPicked}
            currentMonth={currentMonth}
            average={average}
            goals={goals}
          />
          {count && count.of > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {`Goal reached in ${count.reached} of the last ${count.of} months`}
            </ThemedText>
          ) : null}
        </Card>

        <TrendCategoryList
          kind={kind}
          rows={rows}
          onPress={(category) => router.push({ pathname: '/trend-category', params: { kind, category, month: selected } })}
        />

        <LinkButton
          label={`Open ${formatMonthName(selected)} ›`}
          accessibilityLabel={`Open ${formatMonth(selected)}`}
          onPress={() => router.dismissTo({ pathname: '/', params: { month: selected } })}
        />
      </ScreenScroll>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
  figure: {
    gap: Layout.tightGap,
  },
});
