import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { PressableScale } from '@/shared/ui/pressable-scale';
import { ThemedText } from '@/shared/ui/themed-text';
import { elevation, IconSize, Layout, Opacity, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

type ButtonProps = {
  label: string;
  icon?: ComponentProps<typeof Feather>['name'];
  /** What a screen reader says, when the visible label is shorter. */
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  /**
   * primary: the screen's main action. secondary: any other. destructive: deletes, red text.
   * danger: confirms a deletion in a dialog, red fill. quiet: the safe choice in a dialog.
   */
  variant?: 'primary' | 'secondary' | 'destructive' | 'danger' | 'quiet';
  /** Shares a row with other buttons, each taking an equal part. */
  stretch?: boolean;
  /** compact: smaller text and padding, for buttons side by side in a dialog. */
  size?: 'regular' | 'compact';
};

/** The one full-size button of the app. Pills are `Pill`; small text actions are `LinkButton`. */
export function Button({ label, icon, accessibilityLabel, onPress, disabled = false, variant = 'primary', stretch = false, size = 'regular' }: ButtonProps) {
  const theme = useTheme();
  const look = {
    primary: { fill: theme.accent, ink: theme.onAccent, raised: false },
    secondary: { fill: theme.backgroundElement, ink: theme.text, raised: true },
    destructive: { fill: theme.backgroundElement, ink: theme.error, raised: true },
    danger: { fill: theme.errorFill, ink: theme.onAccent, raised: false },
    quiet: { fill: theme.background, ink: theme.text, raised: false },
  }[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: look.fill },
        look.raised && elevation(theme, 'raised'),
        variant === 'primary' && { outlineColor: theme.accentOutline, outlineWidth: 1 },
        size === 'compact' && styles.compact,
        stretch && styles.stretch,
        disabled && styles.disabled,
      ]}>
      {icon ? <Feather name={icon} size={IconSize.small} color={look.ink} /> : null}
      <ThemedText type={size === 'compact' ? 'smallBold' : 'button'} style={{ color: look.ink }}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radius.full,
    flexDirection: 'row',
    gap: Layout.itemGap,
    justifyContent: 'center',
    minHeight: Size.button,
    paddingHorizontal: Layout.buttonPadding,
  },
  compact: {
    minHeight: Size.control,
    paddingHorizontal: Layout.cardPadding,
  },
  stretch: {
    flex: 1,
  },
  disabled: {
    opacity: Opacity.disabled,
  },
});
