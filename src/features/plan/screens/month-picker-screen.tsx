import { Feather } from '@react-native-vector-icons/feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DataError } from '@/shared/ui/data-error';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { Hero, Radius, Spacing } from '@/shared/theme/theme';
import { firstPlanMonth } from '@/features/plan/rules';
import { formatShortMonth, isValidMonthKey, monthKey, monthsOfYear, yearOf } from '@/shared/months';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { useTheme } from '@/shared/theme/use-theme';

export default function MonthPickerScreen() {
  const state = useIncomePlan();
  if (state.status === 'error') return <DataError />;
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;

  const currentMonth = monthKey(new Date());
  const firstMonth = firstPlanMonth(state.data.versions) ?? currentMonth;
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
        <YearButton icon="chevron-left" accessibilityLabel="Previous year" disabled={year <= minYear} onPress={() => setYear(year - 1)} />
        <ThemedText type="subtitle">{year}</ThemedText>
        <YearButton icon="chevron-right" accessibilityLabel="Next year" disabled={year >= maxYear} onPress={() => setYear(year + 1)} />
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
                { backgroundColor: isSelected ? Hero.background : theme.backgroundElement },
                isCurrent && !isSelected && { borderColor: Hero.background, borderWidth: 2 },
                isFuture && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={isSelected ? { color: Hero.text } : undefined}>
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
  icon,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={Spacing.three}
      onPress={onPress}
      style={({ pressed }) => [styles.yearButton, disabled && styles.disabled, pressed && styles.pressed]}>
      <Feather name={icon} size={24} color={theme.text} />
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
