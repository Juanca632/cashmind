import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { bucketProgress } from '@/shared/buckets';
import { BUCKETS, BUCKET_LABELS, progressPercent, type Bucket, type Targets } from '@/shared/buckets';
import { formatEuros } from '@/shared/money';
import { ERROR_COLOR, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

const SUCCESS_COLOR = '#1E8E3E';

type BucketRowsProps = {
  targets: Targets;
  /** Amount recorded per bucket; when given, each row shows its progress against the target. */
  spent?: Record<Bucket, number>;
};

/** One row per bucket (name, euro target, optional progress) plus the shortfall warning. */
export function BucketRows({ targets, spent }: BucketRowsProps) {
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
          <View key={bucket} style={styles.bucket}>
            <View style={styles.row}>
              <ThemedText>{BUCKET_LABELS[bucket]}</ThemedText>
              <ThemedText type="smallBold" style={styles.amount}>
                {formatEuros(targets[bucket])}
              </ThemedText>
            </View>
            {spent ? <Progress bucket={bucket} spent={spent[bucket]} target={targets[bucket]} /> : null}
          </View>
        ))}
      </ThemedView>
    </View>
  );
}

function Progress({ bucket, spent, target }: { bucket: Bucket; spent: number; target: number }) {
  const theme = useTheme();
  const { left, over } = bucketProgress(spent, target);
  const isSavings = bucket === 'savings';
  const goalReached = isSavings && spent > 0 && left === 0;
  const isOver = !isSavings && over > 0;

  const fillColor = isOver ? ERROR_COLOR : goalReached ? SUCCESS_COLOR : theme.text;
  const ratio = target > 0 ? Math.min(spent / target, 1) : spent > 0 ? 1 : 0;

  let status: string;
  if (isSavings) {
    status = goalReached ? 'Goal reached' : `${formatEuros(left)} left to save`;
  } else {
    status = isOver ? `${formatEuros(over)} over` : `${formatEuros(left)} left`;
  }

  return (
    <View style={styles.progress}>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { backgroundColor: fillColor, width: `${ratio * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          {progressLabel(spent, target, isSavings)}
        </ThemedText>
        <ThemedText
          type="small"
          themeColor={isOver || goalReached ? undefined : 'textSecondary'}
          style={isOver ? { color: ERROR_COLOR } : goalReached ? { color: SUCCESS_COLOR } : undefined}>
          {status}
        </ThemedText>
      </View>
    </View>
  );
}

/** '70 % saved · 630,00 €', or just the amount when there is no target. */
function progressLabel(spent: number, target: number, isSavings: boolean): string {
  const verb = isSavings ? 'saved' : 'spent';
  const pct = progressPercent(spent, target);
  return pct === null ? `${formatEuros(spent)} ${verb}` : `${pct} % ${verb} · ${formatEuros(spent)}`;
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    gap: Spacing.four,
    padding: Spacing.three,
  },
  bucket: {
    gap: Spacing.two,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 16,
  },
  progress: {
    gap: Spacing.one,
  },
  track: {
    borderRadius: Spacing.one,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Spacing.one,
    height: '100%',
  },
});
