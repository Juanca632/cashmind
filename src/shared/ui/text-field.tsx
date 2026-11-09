import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/shared/ui/themed-text';
import { FontFamily, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  suffix?: string;
};

export function TextField({ label, suffix, ...inputProps }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement }]}>
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
