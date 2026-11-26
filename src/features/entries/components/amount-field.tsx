import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';

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

/** The longest amount text: 900 000 000,00 with its separators, and a little room to type over it. */
export const MAX_AMOUNT_TEXT = 17;

/** How many characters fit at the full size; a longer amount gets a smaller font so it always fits. */
const FULL_SIZE_CHARS = 9;

/** The big amount at the top of an entry or monthly entry form, with its error. */
export function AmountField({ value, onChangeText, error, autoFocus, size = 'regular' }: AmountFieldProps) {
  const theme = useTheme();
  const money = useMoney();
  const input = useRef<TextInputInstance>(null);
  const base = size === 'large' ? styles.large : styles.amountInput;
  const length = Math.max(value.length, 1);
  // Shrinks with the amount's length past FULL_SIZE_CHARS, so the whole amount stays in view.
  const fontSize = length > FULL_SIZE_CHARS ? Math.floor((base.fontSize * FULL_SIZE_CHARS) / length) : base.fontSize;
  const textStyle = [styles.amountInput, size === 'large' && styles.large, { fontSize }];
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
        {/*
          Android sizes a growing TextInput from the text before the last key, so the new digit
          scrolls the first one out of view. An invisible copy of the text sizes the box instead,
          and the input fills it.
        */}
        <View>
          <Text accessible={false} importantForAccessibility="no" style={[textStyle, styles.measure]}>
            {value === '' ? money.placeholder : value}
          </Text>
          <TextInput
            ref={input}
            accessibilityLabel="Amount"
            keyboardType={money.keyboard}
            placeholder={money.placeholder}
            placeholderTextColor={theme.textSecondary}
            maxLength={MAX_AMOUNT_TEXT}
            autoFocus={autoFocus}
            value={value}
            // Thousands are separated while typing, as the currency shows them (specs/033-amount-grouping).
            onChangeText={(text) => onChangeText(money.groupInput(text))}
            style={[textStyle, StyleSheet.absoluteFill, { color: theme.text }]}
          />
        </View>
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
  measure: {
    // Room for the cursor after the last digit.
    paddingHorizontal: Layout.tightGap,
    opacity: 0,
  },
  large: BIG_FIGURE,
});
