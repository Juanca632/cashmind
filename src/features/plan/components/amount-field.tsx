import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/shared/ui/themed-text';
import { Spacing } from '@/shared/theme/theme';
import type { Amount } from '@/features/plan/rules';
import { useTheme } from '@/shared/theme/use-theme';

type Unit = Amount['unit'];

type AmountFieldProps = {
  label: string;
  unit: Unit;
  value: string;
  onChangeText: (text: string) => void;
  onChangeUnit: (unit: Unit) => void;
  /** Small text under the field, e.g. the value in the other unit. */
  hint?: string;
  /** Highlights the field as filled in automatically. */
  automatic?: boolean;
};

/** Number input with a € / % switch, used for the plan buckets. */
export function AmountField({ label, unit, value, onChangeText, onChangeUnit, hint, automatic }: AmountFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
        {automatic ? ' · automatic' : ''}
      </ThemedText>
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
        <ThemedText type="small" themeColor="textSecondary">
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
  inputRow: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: Spacing.two,
  },
  switch: {
    borderRadius: Spacing.two,
    flexDirection: 'row',
    padding: Spacing.half,
  },
  option: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    minWidth: 36,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
