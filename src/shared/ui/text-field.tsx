import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/shared/ui/themed-text';
import { FontFamily, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  suffix?: string;
  /** The section title already says what this is: keep the label for screen readers only. */
  hideLabel?: boolean;
  /** The field sits on a white card. */
  onCard?: boolean;
};

export function TextField({ label, suffix, hideLabel, onCard, ...inputProps }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {hideLabel ? null : (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      )}
      <View style={[styles.inputRow, { backgroundColor: onCard ? theme.background : theme.backgroundElement }]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          {...inputProps}
        />
        {suffix ? <ThemedText themeColor="textSecondary">{suffix}</ThemedText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  inputRow: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
});
