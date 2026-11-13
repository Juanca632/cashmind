import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { IconSize, Opacity, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

type IconButtonProps = {
  icon: ComponentProps<typeof Feather>['name'];
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
};

/** A plain icon with a full-size touch area. */
export function IconButton({ icon, accessibilityLabel, disabled = false, onPress }: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
      <Feather name={icon} size={IconSize.large} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Size.control,
    minWidth: Size.control,
  },
  disabled: {
    opacity: Opacity.disabled,
  },
  pressed: {
    opacity: Opacity.pressed,
  },
});
