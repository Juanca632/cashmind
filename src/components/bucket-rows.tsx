import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { BUCKETS, formatEuros, type Bucket, type Percentages, type Targets } from '@/domain/income-plan';

export const BUCKET_LABELS: Record<Bucket, string> = {
  fixed: 'Fixed expenses',
  leisure: 'Leisure',
  savings: 'Savings',
};

/** One row per bucket: name, percentage and euro target. */
export function BucketRows({ percentages, targets }: { percentages: Percentages; targets: Targets }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {BUCKETS.map((bucket) => (
        <View key={bucket} style={styles.row}>
          <ThemedText>
            {BUCKET_LABELS[bucket]}{' '}
            <ThemedText themeColor="textSecondary">{percentages[bucket]} %</ThemedText>
          </ThemedText>
          <ThemedText type="smallBold" style={styles.amount}>
            {formatEuros(targets[bucket])}
          </ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 16,
  },
});
