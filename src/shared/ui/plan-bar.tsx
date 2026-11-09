import { StyleSheet, View } from 'react-native';

import { BUCKETS, BUCKET_LABELS, type Bucket } from '@/shared/buckets';
import { formatPercentOf } from '@/shared/money';
import { BUCKET_COLORS, Spacing } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';

/** The plan at a glance: one bar split into the three budget parts, with their shares. */
export function PlanBar({ targets }: { targets: Record<Bucket, number> }) {
  const total = BUCKETS.reduce((sum, bucket) => sum + targets[bucket], 0);
  if (total <= 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {BUCKETS.map((bucket) =>
          targets[bucket] > 0 ? (
            <View key={bucket} style={{ backgroundColor: BUCKET_COLORS[bucket], flex: targets[bucket] }} />
          ) : null,
        )}
      </View>
      <View style={styles.legend}>
        {BUCKETS.map((bucket) => (
          <View key={bucket} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: BUCKET_COLORS[bucket] }]} />
            <ThemedText type="small" themeColor="textSecondary">
              {`${BUCKET_LABELS[bucket]} ${formatPercentOf(targets[bucket], total)}`}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  bar: {
    borderRadius: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.half,
    height: 12,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dot: {
    borderRadius: Spacing.one,
    height: 8,
    width: 8,
  },
});
