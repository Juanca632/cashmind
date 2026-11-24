import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { useMoney } from '@/shared/hooks/use-money';
import { BIG_FIGURE, FontFamily, Layout, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ErrorText } from '@/shared/ui/error-text';
import { ThemedText } from '@/shared/ui/themed-text';

type AmountFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Shown under the amount once something was typed. */
  error: string | null;
  autoFocus?: boolean;
  /** large: the entry form's hero figure, as big as My plan's percentage. */
  size?: 'regular' | 'large';
};

/** The big amount at the top of an entry or monthly entry form, with its error. */
export function AmountField({ value, onChangeText, error, autoFocus, size = 'regular' }: AmountFieldProps) {
  const theme = useTheme();
  const money = useMoney();
  const input = useRef<TextInputInstance>(null);
  const symbol = (
    <ThemedText type="heading" themeColor="textSecondary">
      {money.symbol}
    </ThemedText>
  );
  return (
    <View style={styles.group}>
      {/* The whole row opens the keyboard, the symbol included, so the big amount reads as something to tap. */}
      <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.amount}>
        {money.symbolFirst ? symbol : null}
        <TextInput
          ref={input}
          accessibilityLabel="Amount"
          keyboardType={money.keyboard}
          placeholder={money.placeholder}
          placeholderTextColor={theme.textSecondary}
          maxLength={13}
          autoFocus={autoFocus}
          value={value}
          onChangeText={onChangeText}
          style={[styles.amountInput, size === 'large' && styles.large, { color: theme.text }]}
        />
        {money.symbolFirst ? null : symbol}
      </Pressable>
      {value.trim() !== '' && error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Layout.itemGap,
  },
  amount: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.itemGap,
    justifyContent: 'center',
    paddingVertical: Layout.itemGap,
  },
  amountInput: {
    fontFamily: FontFamily.bold,
    fontSize: 40,
    fontVariant: ['tabular-nums'],
    minWidth: Size.amountInput,
    padding: 0,
    textAlign: 'center',
  },
  large: BIG_FIGURE,
});
