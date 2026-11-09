import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/shared/ui/themed-text';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { FontFamily, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import type { Bucket } from '@/shared/buckets';
import type { Amount } from '@/features/plan/rules';
import { useTheme } from '@/shared/theme/use-theme';

type Unit = Amount['unit'];

type AmountFieldProps = {
  label: string;
  bucket: Bucket;
  /** Small text at the right of the label, e.g. the suggested amount. */
  suggestion?: string;
  unit: Unit;
  value: string;
  onChangeText: (text: string) => void;
  onChangeUnit: (unit: Unit) => void;
  /** Small text under the label, explaining what the field is for. */
  description?: string;
  /** Small text under the field, e.g. the value in the other unit. */
  hint?: string;
  /** Highlights the field as filled in automatically. */
  automatic?: boolean;
};

/** Number input with a € / % switch, used for the plan buckets. */
export function AmountField({ label, bucket, suggestion, unit, value, onChangeText, onChangeUnit, description, hint, automatic }: AmountFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.name}>
          <BucketBadge bucket={bucket} size="small" />
          <ThemedText type="smallBold">
            {label}
            {automatic ? ' · automatic' : ''}
          </ThemedText>
        </View>
        {suggestion ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {suggestion}
          </ThemedText>
        ) : null}
      </View>
      {description ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {description}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.inputRow,
          { backgroundColor: theme.backgroundElement },
          automatic && { borderColor: theme.backgroundSelected, borderStyle: 'dashed', borderWidth: 1 },
        ]}>
        <TextInput
          accessibilityLabel={label}
          keyboardType={unit === 'eur' ? 'decimal-pad' : 'number-pad'}
          maxLength={unit === 'pct' ? 3 : 12}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: automatic ? theme.textSecondary : theme.text }]}
          value={value}
          onChangeText={onChangeText}
        />
        <View style={[styles.switch, { backgroundColor: theme.backgroundSelected }]}>
          {(['eur', 'pct'] as const).map((option) => {
            const selected = option === unit;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={option === 'eur' ? `${label} in euros` : `${label} in percent`}
                accessibilityState={{ selected }}
                hitSlop={Spacing.one}
                onPress={() => onChangeUnit(option)}
                style={[styles.option, selected && { backgroundColor: theme.text }]}>
                <ThemedText type="smallBold" style={selected ? { color: theme.background } : undefined}>
                  {option === 'eur' ? '€' : '%'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
      {hint ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  inputRow: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 52,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  switch: {
    borderRadius: Radius.field,
    flexDirection: 'row',
    padding: Spacing.half,
  },
  option: {
    alignItems: 'center',
    borderRadius: Radius.field,
    justifyContent: 'center',
    minHeight: MIN_TOUCH - Spacing.one * 2,
    minWidth: MIN_TOUCH - Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
