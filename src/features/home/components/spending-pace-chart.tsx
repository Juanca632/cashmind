import { useId, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { paceAt, type SpendingPace } from '@/features/home/month-summary';
import { formatShortMonth } from '@/shared/months';
import { BORDER_WIDTH, Layout, Opacity, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';

/** Leaves room for the stroke and the dot at the drawing's edges. */
const EDGE = Size.chartDot + BORDER_WIDTH;

type SpendingPaceChartProps = {
  pace: SpendingPace;
  /** The month drawn, 'YYYY-MM', for the dates under the chart. */
  month: string;
  /** What a screen reader says about the whole chart. */
  accessibilityLabel: string;
};

/**
 * A quiet chart: the month's spending as one line with a soft fill below it, and the plan's pace as
 * a faint dashed line. No axes; the amounts are written above it. Days run left to right from the
 * start of the 1st to the end of the month; amounts from the fixed costs (bottom) to the most the
 * month can spend or has spent (top), so the whole height shows the spending that changes.
 */
export function SpendingPaceChart({ pace, month, accessibilityLabel }: SpendingPaceChartProps) {
  const theme = useTheme();
  // React ids hold characters such as « » that an svg url(#…) reference may not resolve on Android.
  const fillId = `fill${useId().replace(/\W/g, '')}`;
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  // The curve starts lower than the fixed costs only if it ever goes below them.
  const bottom = Math.min(pace.startCents, pace.steps[0]?.cents ?? pace.startCents);
  const top = Math.max(pace.endCents, pace.spentCents, bottom + 1);
  const x = (day: number) => EDGE + ((width - 2 * EDGE) * day) / pace.daysInMonth;
  const y = (cents: number) => EDGE + (Size.chart - 2 * EDGE) * (1 - (cents - bottom) / (top - bottom));

  // One point at the end of each day, joined by straight lines.
  const last = pace.steps[pace.steps.length - 1];
  let line = `M ${x(0)} ${y(bottom)}`;
  for (const { day, cents } of pace.steps) line += ` L ${x(day)} ${y(cents)}`;
  const area = last ? `${line} L ${x(last.day)} ${y(bottom)} Z` : '';
  const shortMonth = formatShortMonth(month);

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.chart}>
      <View onLayout={onLayout} style={styles.drawing}>
        {width > 0 ? (
          <Svg width={width} height={Size.chart}>
            <Defs>
              <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.kindInk.expense} stopOpacity={Opacity.chartFill} />
                <Stop offset="1" stopColor={theme.kindInk.expense} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Line
              x1={x(0)}
              y1={y(pace.startCents)}
              x2={x(pace.daysInMonth)}
              y2={y(paceAt(pace, pace.daysInMonth))}
              stroke={theme.textSecondary}
              strokeOpacity={Opacity.disabled}
              strokeWidth={BORDER_WIDTH}
              strokeDasharray={`${Size.chartDot} ${Size.chartDot}`}
            />
            {/* Keyed by their shape: Android does not always redraw a path whose `d` changes in place. */}
            {area ? <Path key={`area${area}`} d={area} fill={`url(#${fillId})`} /> : null}
            <Path
              key={line}
              d={line}
              fill="none"
              stroke={theme.kindInk.expense}
              strokeWidth={BORDER_WIDTH * 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {last ? <Circle cx={x(last.day)} cy={y(last.cents)} r={Size.chartDot} fill={theme.kindInk.expense} /> : null}
          </Svg>
        ) : null}
      </View>
      <View style={styles.dates}>
        <ThemedText type="caption" themeColor="textSecondary">
          {`1 ${shortMonth}`}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {`${pace.daysInMonth} ${shortMonth}`}
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
