import { StyleSheet, View } from 'react-native';

import { BUCKETS, type Bucket } from '@/shared/buckets';
import { BUCKET_COLORS, Spacing } from '@/shared/theme/theme';

/** The plan at a glance: one bar split into the three budget parts. */
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
});
