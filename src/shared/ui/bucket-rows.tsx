import { StyleSheet, View } from 'react-native';

import { BucketBadge } from '@/shared/ui/bucket-badge';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BUCKETS, BUCKET_LABELS, type Targets } from '@/shared/buckets';
import { formatEuros } from '@/shared/money';
import { CARD_SHADOW, ERROR_COLOR, Radius, Spacing } from '@/shared/theme/theme';

/** Says that a month's income does not cover the fixed expenses. */
export function ShortfallWarning({ shortfall }: { shortfall: number }) {
  if (shortfall <= 0) return null;
  return (
    <ThemedText type="smallBold" style={{ color: ERROR_COLOR }}>
      This income is {formatEuros(shortfall)} short of your fixed expenses. Wants and savings are 0 € this month.
    </ThemedText>
  );
}

/** The euro amount of each part of the plan, with the shortfall warning. */
export function BucketRows({ targets }: { targets: Targets }) {
  return (
    <View style={styles.container}>
      <ShortfallWarning shortfall={targets.shortfall} />
      <ThemedView type="backgroundElement" style={styles.card}>
        {BUCKETS.map((bucket) => (
          <View key={bucket} style={styles.row}>
            <View style={styles.name}>
              <BucketBadge bucket={bucket} size="small" />
              <ThemedText>{BUCKET_LABELS[bucket]}</ThemedText>
            </View>
            <ThemedText type="smallBold">{formatEuros(targets[bucket])}</ThemedText>
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
    borderRadius: Radius.card,
    boxShadow: CARD_SHADOW,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
