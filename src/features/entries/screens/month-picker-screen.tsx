import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DataError } from '@/shared/ui/data-error';
import { IconButton } from '@/shared/ui/icon-button';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { Accent, Radius, Spacing } from '@/shared/theme/theme';
import { formatShortMonth, isValidMonthKey, monthKey, monthsOfYear, yearOf } from '@/shared/months';
import { useFirstEntryMonth } from '@/features/entries/hooks/use-first-entry-month';
import { useTheme } from '@/shared/theme/use-theme';

export default function MonthPickerScreen() {
  const state = useFirstEntryMonth();
  if (state.status === 'error') return <DataError />;
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;

  const currentMonth = monthKey(new Date());
  // One rule: back to the year of the first entry, and always at least to last year.
  const lastYear = yearOf(currentMonth) - 1;
  const minYear = state.data ? Math.min(yearOf(state.data), lastYear) : lastYear;
  return <MonthPicker currentMonth={currentMonth} minYear={minYear} />;
}

function MonthPicker({ currentMonth, minYear }: { currentMonth: string; minYear: number }) {
  const theme = useTheme();
  const params = useLocalSearchParams<{ month?: string }>();
  const selected = isValidMonthKey(params.month) ? params.month : currentMonth;
  const maxYear = yearOf(currentMonth);
  const [year, setYear] = useState(() => Math.min(Math.max(yearOf(selected), minYear), maxYear));

  function pick(month: string) {
    // Go back to home (already in the stack) with the picked month.
    router.dismissTo({ pathname: '/', params: { month } });
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.yearRow}>
        <IconButton icon="chevron-left" accessibilityLabel="Previous year" disabled={year <= minYear} onPress={() => setYear(year - 1)} />
        <ThemedText type="heading">{year}</ThemedText>
        <IconButton icon="chevron-right" accessibilityLabel="Next year" disabled={year >= maxYear} onPress={() => setYear(year + 1)} />
      </View>

      <View style={styles.grid}>
        {monthsOfYear(year).map((month) => {
          const isFuture = month > currentMonth;
          const isSelected = month === selected;
          const isCurrent = month === currentMonth;
          return (
            <Pressable
              key={month}
              accessibilityRole="button"
              accessibilityState={{ disabled: isFuture, selected: isSelected }}
              disabled={isFuture}
              onPress={() => pick(month)}
              style={({ pressed }) => [
                styles.cell,
                { backgroundColor: isSelected ? Accent.background : theme.backgroundElement },
                isCurrent && !isSelected && { borderColor: Accent.background, borderWidth: 2 },
                isFuture && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={isSelected ? { color: Accent.text } : undefined}>
                {formatShortMonth(month)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: Spacing.four,
    padding: Spacing.three,
  },
  yearRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    alignItems: 'center',
    borderRadius: Radius.card,
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: Spacing.four,
  },
  disabled: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.6,
  },
});
