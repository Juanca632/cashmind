import { useId, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PocketMonth } from '@/features/home/pocket-month';
import { formatShortMonth } from '@/shared/months';
import { BORDER_WIDTH, Layout, Opacity, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';

/** Leaves room for the stroke and the dot at the drawing's edges. */
const EDGE = Size.chartDot + BORDER_WIDTH;

type BalanceChartProps = {
  balance: PocketMonth;
  /** The month drawn, 'YYYY-MM', for the dates under the chart. */
  month: string;
  /** What a screen reader says about the whole chart. */
  accessibilityLabel: string;
};

/**
 * A pocket's balance through the month, in the spending pace chart's quiet style: one line with a
 * soft fill, a dot on today, and a faint dashed line where the month started, so up and down read
 * at a glance (specs/029-pocket-balance-chart). The range covers every value drawn.
 */
export function BalanceChart({ balance, month, accessibilityLabel }: BalanceChartProps) {
  const theme = useTheme();
  // React ids hold characters such as « » that an svg url(#…) reference may not resolve on Android.
  const fillId = `fill${useId().replace(/\W/g, '')}`;
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const values = [balance.startCents, ...balance.steps.map((step) => step.cents)];
  const bottom = Math.min(...values);
  const top = Math.max(...values, bottom + 1);
  const x = (day: number) => EDGE + ((width - 2 * EDGE) * day) / balance.daysInMonth;
  const y = (cents: number) => EDGE + (Size.chart - 2 * EDGE) * (1 - (cents - bottom) / (top - bottom));

  // One point at the end of each day, joined by straight lines, from the month's start.
  const last = balance.steps[balance.steps.length - 1];
  let line = `M ${x(0)} ${y(balance.startCents)}`;
  for (const { day, cents } of balance.steps) line += ` L ${x(day)} ${y(cents)}`;
  const area = last ? `${line} L ${x(last.day)} ${y(bottom)} L ${x(0)} ${y(bottom)} Z` : '';
  const shortMonth = formatShortMonth(month);
  const ink = theme.kindInk.savings;

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.chart}>
      <View onLayout={onLayout} style={styles.drawing}>
        {width > 0 ? (
          <Svg width={width} height={Size.chart}>
            <Defs>
              <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={ink} stopOpacity={Opacity.chartFill} />
                <Stop offset="1" stopColor={ink} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Line
              x1={x(0)}
              y1={y(balance.startCents)}
              x2={x(balance.daysInMonth)}
              y2={y(balance.startCents)}
              stroke={theme.textSecondary}
              strokeOpacity={Opacity.disabled}
              strokeWidth={BORDER_WIDTH}
              strokeDasharray={`${Size.chartDot} ${Size.chartDot}`}
            />
            {/* Keyed by their shape: Android does not always redraw a path whose `d` changes in place. */}
            {area ? <Path key={`area${area}`} d={area} fill={`url(#${fillId})`} /> : null}
            <Path key={line} d={line} fill="none" stroke={ink} strokeWidth={BORDER_WIDTH * 2} strokeLinecap="round" strokeLinejoin="round" />
            {last ? <Circle cx={x(last.day)} cy={y(last.cents)} r={Size.chartDot} fill={ink} /> : null}
          </Svg>
        ) : null}
      </View>
      <View style={styles.dates}>
        <ThemedText type="caption" themeColor="textSecondary">
          {`1 ${shortMonth}`}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {`${balance.daysInMonth} ${shortMonth}`}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    gap: Layout.tightGap,
  },
  drawing: {
    height: Size.chart,
  },
  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
