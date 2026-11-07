import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  firstPlanMonth,
  formatShortMonth,
  isValidMonthKey,
  monthKey,
  monthsOfYear,
  yearOf,
} from '@/domain/income-plan';
import { useIncomePlan } from '@/hooks/use-income-plan';
import { useTheme } from '@/hooks/use-theme';

export default function MonthPickerScreen() {
  const state = useIncomePlan();
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;

  const currentMonth = monthKey(new Date());
  const firstMonth = firstPlanMonth(state.versions) ?? currentMonth;
  return <MonthPicker currentMonth={currentMonth} minYear={Math.min(yearOf(firstMonth), yearOf(currentMonth))} />;
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
        <YearButton label="‹" accessibilityLabel="Previous year" disabled={year <= minYear} onPress={() => setYear(year - 1)} />
        <ThemedText type="subtitle">{year}</ThemedText>
        <YearButton label="›" accessibilityLabel="Next year" disabled={year >= maxYear} onPress={() => setYear(year + 1)} />
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
                { backgroundColor: isSelected ? theme.text : theme.backgroundElement },
                isCurrent && !isSelected && { borderColor: theme.text, borderWidth: 2 },
                isFuture && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={isSelected ? { color: theme.background } : undefined}>
                {formatShortMonth(month)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

function YearButton({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={Spacing.three}
      onPress={onPress}
      style={({ pressed }) => [styles.yearButton, disabled && styles.disabled, pressed && styles.pressed]}>
      <ThemedText type="subtitle">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: Spacing.four,
    padding: Spacing.four,
  },
  yearRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yearButton: {
    paddingHorizontal: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    alignItems: 'center',
    borderRadius: Spacing.three,
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
