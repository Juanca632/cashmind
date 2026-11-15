import { StyleSheet, TextInput, View } from 'react-native';

import { FontFamily, Layout, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ErrorText } from '@/shared/ui/error-text';
import { ThemedText } from '@/shared/ui/themed-text';

type AmountFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Shown under the amount once something was typed. */
  error: string | null;
  autoFocus?: boolean;
};

/** The big euro amount at the top of an entry or monthly entry form, with its error. */
export function AmountField({ value, onChangeText, error, autoFocus }: AmountFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <View style={styles.amount}>
        <TextInput
          accessibilityLabel="Amount"
          keyboardType="decimal-pad"
          placeholder="0,00"
          placeholderTextColor={theme.textSecondary}
          maxLength={10}
          autoFocus={autoFocus}
          value={value}
          onChangeText={onChangeText}
          style={[styles.amountInput, { color: theme.text }]}
        />
        <ThemedText type="heading" themeColor="textSecondary">
          €
        </ThemedText>
      </View>
      {value.trim() !== '' && error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Layout.sectionGap,
  },
  amount: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.itemGap,
    justifyContent: 'center',
    paddingVertical: Layout.sectionGap,
  },
  amountInput: {
    fontFamily: FontFamily.bold,
    fontSize: 40,
    fontVariant: ['tabular-nums'],
    minWidth: Size.amountInput,
    padding: 0,
    textAlign: 'center',
  },
});
