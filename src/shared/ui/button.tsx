import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/ui/themed-text';
import { CARD_SHADOW, Accent, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

type ButtonProps = {
  label: string;
  icon?: ComponentProps<typeof Feather>['name'];
  /** What a screen reader says, when the visible label is shorter. */
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  /** `soft` is for a button on a white card. */
  variant?: 'primary' | 'secondary' | 'pill' | 'soft';
};

export function Button({ label, icon, accessibilityLabel, onPress, disabled = false, variant = 'primary' }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'pill' ? styles.pill : styles.full,
        primary && { backgroundColor: Accent.background },
        (variant === 'secondary' || variant === 'pill') && { backgroundColor: theme.backgroundElement, boxShadow: CARD_SHADOW },
        variant === 'soft' && { backgroundColor: theme.background },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.7 },
      ]}>
      {icon ? <Feather name={icon} size={16} color={primary ? Accent.text : theme.text} /> : null}
      <ThemedText type="smallBold" style={[styles.label, { color: primary ? Accent.text : theme.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radius.full,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  full: {
    minHeight: 56,
    paddingHorizontal: Spacing.four,
  },
  pill: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.three,
  },
  label: {
    fontSize: 16,
  },
});
