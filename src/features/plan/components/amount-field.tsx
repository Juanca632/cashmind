import { StyleSheet, TextInput, View } from 'react-native';

import type { FlexibleBucket } from '@/shared/buckets';
import { BUCKET_COLORS, BUCKET_TINTS, FontFamily, Radius, Spacing } from '@/shared/theme/theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { ThemedText } from '@/shared/ui/themed-text';

type AmountFieldProps = {
  label: string;
  bucket: FlexibleBucket;
  value: string;
  onChangeText: (text: string) => void;
  /** The value in euros. */
  hint?: string;
  /** The part that takes the rest. */
  automatic?: boolean;
};

/** One row of the split, laid out like an Activity row: icon, name with its euros, and a colored percentage field. */
export function AmountField({ label, bucket, value, onChangeText, hint, automatic }: AmountFieldProps) {
  const color = BUCKET_COLORS[bucket];

  return (
    <View style={styles.row}>
      <BucketBadge bucket={bucket} />
      <View style={styles.text}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {hint ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      <View style={[styles.field, { backgroundColor: BUCKET_TINTS[bucket] }]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={automatic ? 'Filled in automatically' : undefined}
          keyboardType="number-pad"
          maxLength={4}
          placeholder={automatic ? 'Rest' : undefined}
          placeholderTextColor={color}
          selectTextOnFocus
          style={[styles.input, { color }]}
          value={value}
          onChangeText={onChangeText}
        />
        <ThemedText type="smallBold" style={{ color }}>
          %
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two + Spacing.one,
    minHeight: 68,
  },
  text: {
    flex: 1,
  },
  field: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: 48,
    paddingHorizontal: Spacing.two + Spacing.one,
    width: 96,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
    minWidth: 0,
    padding: 0,
    textAlign: 'right',
  },
});
