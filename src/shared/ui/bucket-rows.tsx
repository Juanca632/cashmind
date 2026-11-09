import { Feather } from '@react-native-vector-icons/feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { BucketBadge } from '@/shared/ui/bucket-badge';
import { ThemedText } from '@/shared/ui/themed-text';
import { bucketProgress } from '@/shared/buckets';
import { BUCKETS, BUCKET_LABELS, progressPercent, type Bucket, type Targets } from '@/shared/buckets';
import { formatEuros } from '@/shared/money';
import { BUCKET_COLORS, CARD_SHADOW, ERROR_COLOR, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

type BucketRowsProps = {
  targets: Targets;
  /** Amount recorded per bucket; when given, each row shows its progress against the target. */
  spent?: Record<Bucket, number>;
  /** When given, tapping a row calls it with that bucket. */
  onSelect?: (bucket: Bucket) => void;
  /** The row shown as selected. */
  selected?: Bucket | null;
};

/** One card per bucket (name, euro target, optional progress), plus the shortfall warning. */
export function BucketRows({ targets, spent, onSelect, selected }: BucketRowsProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {targets.shortfall > 0 ? (
        <ThemedText type="smallBold" style={{ color: ERROR_COLOR }}>
          This income is {formatEuros(targets.shortfall)} short of your needs. Wants and savings are 0 € this month.
        </ThemedText>
      ) : null}
      <View style={styles.cards}>
        {BUCKETS.map((bucket) => (
          <Pressable
            key={bucket}
            accessibilityRole={onSelect ? 'button' : undefined}
            accessibilityLabel={onSelect ? spokenRow(bucket, targets, spent) : undefined}
            accessibilityState={onSelect ? { selected: bucket === selected } : undefined}
            disabled={!onSelect}
            onPress={() => onSelect?.(bucket)}
            style={({ pressed }) => [
              styles.bucket,
              { backgroundColor: theme.backgroundElement, borderColor: bucket === selected ? BUCKET_COLORS[bucket] : 'transparent' },
              pressed && styles.pressed,
            ]}>
            <View style={styles.row}>
              <View style={styles.name}>
                <BucketBadge bucket={bucket} />
                <ThemedText>{BUCKET_LABELS[bucket]}</ThemedText>
              </View>
              <View style={styles.name}>
                <ThemedText type="smallBold" style={styles.amount}>
                  {formatEuros(targets[bucket])}
                </ThemedText>
                {onSelect ? <Feather name="chevron-right" size={18} color={theme.textSecondary} /> : null}
              </View>
            </View>
            {spent ? <Progress bucket={bucket} spent={spent[bucket]} target={targets[bucket]} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** What a screen reader says for a tappable row; the icons are left out. */
function spokenRow(bucket: Bucket, targets: Targets, spent?: Record<Bucket, number>): string {
  const recorded = spent ? `, ${formatEuros(spent[bucket])} recorded` : '';
  return `${BUCKET_LABELS[bucket]}, ${formatEuros(targets[bucket])} planned${recorded}`;
}

function Progress({ bucket, spent, target }: { bucket: Bucket; spent: number; target: number }) {
  const theme = useTheme();
  const { left, over } = bucketProgress(spent, target);
  const isSavings = bucket === 'savings';
  const goalReached = isSavings && spent > 0 && left === 0;
  const isOver = !isSavings && over > 0;

  const fillColor = isOver ? ERROR_COLOR : BUCKET_COLORS[bucket];
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
          style={isOver ? { color: ERROR_COLOR } : goalReached ? { color: BUCKET_COLORS.savings } : undefined}>
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
  cards: {
    gap: Spacing.two,
  },
  bucket: {
    borderRadius: Radius.card,
    borderWidth: 1.5,
    boxShadow: CARD_SHADOW,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
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
