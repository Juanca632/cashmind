import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS, isCategoryOf } from '@/features/entries/categories';
import { useEntriesBetween } from '@/features/entries/hooks/use-entries-between';
import { countsInMonth, isEntryKind } from '@/features/entries/rules';
import { TrendBars } from '@/features/home/components/trend-bars';
import { averageSentence, monthsInUse, monthTotals, TREND_MONTHS, trendAverage } from '@/features/home/trends';
import { useToday } from '@/shared/hooks/use-today';
import { useMoney } from '@/shared/hooks/use-money';
import { formatMonth, lastMonths, monthKey } from '@/shared/months';
import { Layout } from '@/shared/theme/theme';
import { Card } from '@/shared/ui/card';
import { DataError } from '@/shared/ui/data-error';
import { MessageScreen } from '@/shared/ui/message-screen';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** One category of one kind over the same six months as Trends, against its own usual. */
export default function TrendCategoryScreen() {
  const money = useMoney();
  const params = useLocalSearchParams<{ kind?: string; category?: string; month?: string }>();
  const today = useToday();
  const currentMonth = monthKey(today);
  const months = lastMonths(currentMonth, TREND_MONTHS);
  const entries = useEntriesBetween(months[0], currentMonth);
  const [picked, setPicked] = useState(params.month);
  const selected = picked !== undefined && months.includes(picked) ? picked : currentMonth;

  const kind = isEntryKind(params.kind) ? params.kind : null;
  if (kind === null || !isCategoryOf(kind, params.category)) {
    return <MessageScreen title="This category could not be shown" text="Go back and pick it again." />;
  }
  const category = params.category;
  const title = <Stack.Screen options={{ title: CATEGORY_LABELS[category] }} />;
  if (entries.status === 'error') return <DataError />;
  if (entries.status === 'loading') return <ThemedView style={styles.screen}>{title}</ThemedView>;

  // Expenses paid from a pocket are not the month's money (specs/026-pocket-spending).
  const counted = entries.data.filter(countsInMonth);
  const totals = monthTotals(counted, months, kind, category);
  const average = trendAverage(totals, monthsInUse(counted), currentMonth);
  const cents = totals.find((total) => total.month === selected)?.cents ?? 0;

  return (
    <ThemedView style={styles.screen}>
      {title}
      <ScreenScroll>
        <Card>
          <View style={styles.figure} accessibilityLiveRegion="polite">
            <ThemedText type="small" themeColor="textSecondary">
              {formatMonth(selected)}
            </ThemedText>
            <ThemedText type="heading" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {money.format(cents)}
            </ThemedText>
            {average === null ? null : (
              <>
                <ThemedText type="small">{averageSentence(cents, average, selected === currentMonth, money.format, 'usual')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{`Usually ${money.format(average)} / month`}</ThemedText>
              </>
            )}
          </View>
          <TrendBars kind={kind} totals={totals} selected={selected} onSelect={setPicked} currentMonth={currentMonth} average={average} />
        </Card>
      </ScreenScroll>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  figure: {
    gap: Layout.tightGap,
  },
});
