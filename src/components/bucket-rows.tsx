import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { BUCKETS, formatEuros, formatPercentOf, type Bucket, type Targets } from '@/domain/income-plan';

export const BUCKET_LABELS: Record<Bucket, string> = {
  fixed: 'Fixed expenses',
  leisure: 'Leisure',
  savings: 'Savings',
};

export const ERROR_COLOR = '#D93025';

/** One row per bucket (name, share of the income, euro target) plus the shortfall warning. */
export function BucketRows({ targets, incomeCents }: { targets: Targets; incomeCents: number }) {
  return (
    <View style={styles.container}>
      {targets.shortfall > 0 ? (
        <ThemedText type="smallBold" style={{ color: ERROR_COLOR }}>
          This income is {formatEuros(targets.shortfall)} short of your fixed expenses. Leisure and savings are 0 €
          this month.
        </ThemedText>
      ) : null}
      <ThemedView type="backgroundElement" style={styles.card}>
        {BUCKETS.map((bucket) => (
          <View key={bucket} style={styles.row}>
            <ThemedText>
              {BUCKET_LABELS[bucket]}{' '}
              <ThemedText themeColor="textSecondary">{formatPercentOf(targets[bucket], incomeCents)}</ThemedText>
            </ThemedText>
            <ThemedText type="smallBold" style={styles.amount}>
              {formatEuros(targets[bucket])}
            </ThemedText>
          </View>
        ))}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
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
