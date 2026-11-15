import { StyleSheet, Switch, View } from 'react-native';

import { Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';

type SwitchRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/** A labelled on/off choice that fills the width, like the form's fields. The whole row is one control. */
export function SwitchRow({ label, value, onValueChange, disabled }: SwitchRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Switch
        accessibilityLabel={label}
        accessibilityRole="switch"
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        thumbColor={theme.background}
        trackColor={{ false: theme.textSecondary, true: theme.accent }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.itemGap,
    minHeight: Size.control,
    paddingHorizontal: Layout.cardPadding,
  },
  label: {
    flex: 1,
  },
});
