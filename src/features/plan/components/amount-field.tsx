import { StyleSheet, TextInput, View } from 'react-native';

import type { FlexibleBucket } from '@/shared/buckets';
import { FontFamily, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { ThemedText } from '@/shared/ui/themed-text';

type AmountFieldProps = {
  label: string;
  bucket: FlexibleBucket;
  value: string;
  onChangeText: (text: string) => void;
  /** Small text at the right of the label, e.g. the suggested share. */
  suggestion?: string;
  /** Small text under the field, e.g. the value in euros. */
  hint?: string;
  /** Highlights the field as filled in automatically. */
  automatic?: boolean;
};

/** Percentage input for savings and wants: name and field on one line, euros and suggestion below. */
export function AmountField({ label, bucket, value, onChangeText, suggestion, hint, automatic }: AmountFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.name}>
          <BucketBadge bucket={bucket} size="small" />
          <ThemedText type="smallBold">
            {label}
            {automatic ? ' · automatic' : ''}
          </ThemedText>
        </View>
        <View
          style={[
            styles.inputRow,
            { backgroundColor: theme.background },
            automatic && { borderColor: theme.textSecondary, borderStyle: 'dashed', borderWidth: 1 },
          ]}>
          <TextInput
            accessibilityLabel={label}
            accessibilityHint={automatic ? 'Filled in automatically' : undefined}
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor={theme.textSecondary}
            selectTextOnFocus
            style={[styles.input, { color: automatic ? theme.textSecondary : theme.text }]}
            value={value}
            onChangeText={onChangeText}
          />
          <ThemedText themeColor="textSecondary">%</ThemedText>
        </View>
      </View>
      <View style={styles.row}>
        <ThemedText type="caption" themeColor="textSecondary">
          {hint ?? ''}
        </ThemedText>
        {suggestion ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {suggestion}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  inputRow: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    width: 112,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    textAlign: 'right',
  },
});
