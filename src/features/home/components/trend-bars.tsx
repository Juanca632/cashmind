import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import type { MonthGoal, MonthTotal } from '@/features/home/trends';
import { hapticTick } from '@/shared/haptics';
import type { EntryKind } from '@/shared/kinds';
import { formatEuros } from '@/shared/money';
import { formatMonth, formatShortMonth } from '@/shared/months';
import { BORDER_WIDTH, Layout, Opacity, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';

type TrendBarsProps = {
  kind: EntryKind;
  totals: readonly MonthTotal[];
  selected: string;
  onSelect: (month: string) => void;
  /** The month still running: drawn unfinished, with "so far" under it. */
  currentMonth: string;
  /** Drawn as a faint dashed line over the bars and named in the key; null draws none. */
  average: number | null;
  /** On Saved, each month's goal as a mark across its bar. */
  goals?: readonly MonthGoal[];
};

const GROW_MS = 250;

/**
 * One bar per month, the selected one in the kind's color and the others faded, over a faint
 * baseline and with no axes. The tallest of the bars, the average and the goals fills the height;
 * the rest are in proportion. A key under the month names says what the line and marks are.
 */
export function TrendBars({ kind, totals, selected, onSelect, currentMonth, average, goals }: TrendBarsProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const scale = Math.max(1, average ?? 0, ...totals.map((total) => total.cents), ...(goals ?? []).map((goal) => goal.goal ?? 0));
  const heightOf = (cents: number) => (cents / scale) * Size.trendBars;
  const hasGoals = goals?.some((goal) => goal.goal !== null) ?? false;
  const dash = `${Size.chartDot} ${Size.chartDot}`;

  return (
    <View style={styles.chart}>
      <View style={styles.row} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
        {totals.map((total, i) => {
          const goal = goals?.[i];
          const isSelected = total.month === selected;
          const isCurrent = total.month === currentMonth;
          const label = [
            `${formatMonth(total.month)}: ${formatEuros(total.cents)}${isCurrent ? ' so far' : ''}`,
            goal?.goal ? `goal ${formatEuros(goal.goal)}, ${goal.reached ? 'reached' : 'not reached'}` : null,
            average === null ? null : `average ${formatEuros(average)}`,
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <Pressable
              key={total.month}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                if (isSelected) return;
                hapticTick();
                onSelect(total.month);
              }}
              style={styles.column}>
              <Animated.View
                style={[
                  styles.bar,
                  isCurrent
                    ? { backgroundColor: theme.kindTint[kind], borderColor: theme.kindInk[kind], borderStyle: 'dashed', borderWidth: BORDER_WIDTH }
                    : { backgroundColor: theme.kindInk[kind] },
                  {
                    height: total.cents > 0 ? Math.max(heightOf(total.cents), Size.trendBarMin) : 0,
                    opacity: isSelected ? 1 : Opacity.fadedBar,
                    transitionProperty: 'height',
                    transitionDuration: reducedMotion ? 0 : GROW_MS,
                  },
                ]}
              />
              {goal?.goal ? (
                <Animated.View
                  style={[
                    styles.goal,
                    {
                      backgroundColor: theme.text,
                      borderColor: theme.backgroundElement,
                      bottom: heightOf(goal.goal) - Size.goalMark / 2,
                      transitionProperty: 'bottom',
                      transitionDuration: reducedMotion ? 0 : GROW_MS,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          );
        })}
        <View pointerEvents="none" style={[styles.baseline, { backgroundColor: theme.textSecondary }]} />
        {average !== null && width > 0 ? (
          <Svg pointerEvents="none" width={width} height={Size.trendBars} style={StyleSheet.absoluteFill}>
            <Line
              x1={0}
              x2={width}
              y1={Size.trendBars - heightOf(average)}
              y2={Size.trendBars - heightOf(average)}
              stroke={theme.textSecondary}
              strokeWidth={BORDER_WIDTH}
              strokeDasharray={dash}
            />
          </Svg>
        ) : null}
      </View>

      <View style={styles.labels}>
        {totals.map((total) => {
          const isSelected = total.month === selected;
          return (
            <View key={total.month} style={styles.labelColumn}>
              <ThemedText type={isSelected ? 'smallBold' : 'small'} themeColor={isSelected ? 'text' : 'textSecondary'} importantForAccessibility="no">
                {formatShortMonth(total.month)}
              </ThemedText>
              {total.month === currentMonth ? (
                <ThemedText type="caption" themeColor="textSecondary" importantForAccessibility="no">
                  so far
                </ThemedText>
              ) : null}
            </View>
          );
        })}
      </View>

      {average !== null || hasGoals ? (
        <View style={styles.key}>
          {average !== null ? (
            <View style={styles.keyItem}>
              <Svg width={Size.keySample} height={BORDER_WIDTH}>
                <Line x1={0} x2={Size.keySample} y1={BORDER_WIDTH / 2} y2={BORDER_WIDTH / 2} stroke={theme.textSecondary} strokeWidth={BORDER_WIDTH} strokeDasharray={dash} />
              </Svg>
              <ThemedText type="caption" themeColor="textSecondary">{`Avg ${formatEuros(average)}`}</ThemedText>
            </View>
          ) : null}
          {hasGoals ? (
            <View style={styles.keyItem}>
              <View style={[styles.keyGoal, { backgroundColor: theme.text }]} />
              <ThemedText type="caption" themeColor="textSecondary">
                Goal
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    gap: Layout.tightGap,
  },
  row: {
    flexDirection: 'row',
    height: Size.trendBars,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: Radius.bar,
    borderTopRightRadius: Radius.bar,
    width: Size.trendBarWidth,
  },
  goal: {
    borderRadius: Radius.bar,
    borderWidth: BORDER_WIDTH,
    height: Size.goalMark,
    position: 'absolute',
    width: Size.goalMarkWidth,
  },
  baseline: {
    bottom: 0,
    height: BORDER_WIDTH,
    left: 0,
    opacity: Opacity.disabled,
    position: 'absolute',
    right: 0,
  },
  labels: {
    flexDirection: 'row',
  },
  labelColumn: {
    alignItems: 'center',
    flex: 1,
  },
  key: {
    flexDirection: 'row',
    gap: Layout.sectionGap,
    justifyContent: 'center',
  },
  keyItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.tightGap,
  },
  keyGoal: {
    borderRadius: Radius.bar,
    height: BORDER_WIDTH * 2,
    width: Size.keySample,
  },
});
