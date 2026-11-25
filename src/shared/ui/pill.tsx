import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { BORDER_WIDTH, elevation, Hero, IconSize, Layout, Opacity, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { ThemedText } from '@/shared/ui/themed-text';

/**
 * Grows the touch area of a pill to the minimum touch height, beyond what is drawn. Only up and
 * down: pills side by side would otherwise share the space between them.
 */
const HIT_SLOP = { top: (Size.control - Size.pill) / 2, bottom: (Size.control - Size.pill) / 2 };

type PillProps = {
  label: string;
  icon?: ComponentProps<typeof Feather>['name'];
  /** Drawn before the label instead of an icon, such as a space's round mark (at most `Size.pillMark`). */
  mark?: ReactNode;
  /** An icon after the label, such as the down arrow of a pill that opens a list. */
  trailingIcon?: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  /** What a screen reader says, when the visible label is shorter. */
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio';
  /** Selected pills take `colors`; others are neutral. Undefined means the pill has no selected state. */
  selected?: boolean;
  /** Fill, ink and ring when selected (the ring is the ink unless given); the ink also colors the icon when not selected. */
  colors?: { fill: string; ink: string; ring?: string };
  /** `hero` sits on the month card's gradient. */
  variant?: 'default' | 'hero';
  /** regular: a lighter label, for a long list of choices such as categories. */
  weight?: 'bold' | 'regular';
  disabled?: boolean;
};

/** The one pill of the app: actions, filters and choices. Compact to look at, 48 points to touch. */
export function Pill({
  label,
  icon,
  mark,
  trailingIcon,
  onPress,
  accessibilityLabel,
  accessibilityRole = 'button',
  selected,
  colors,
  variant = 'default',
  weight = 'bold',
  disabled = false,
}: PillProps) {
  const theme = useTheme();
  const hero = variant === 'hero';
  const active = selected === true && colors !== undefined;
  const ink = hero ? Hero.text : active ? colors.ink : theme.text;
  const iconInk = hero ? Hero.text : (colors?.ink ?? theme.text);
  const state = selected === undefined ? { disabled } : { disabled, selected };

  return (
    <PressableScale
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={state}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={[
        styles.pill,
        hero
          ? { backgroundColor: Hero.control }
          : {
              backgroundColor: active ? colors.fill : theme.backgroundElement,
              borderColor: active ? (colors.ring ?? colors.ink) : 'transparent',
            },
        // Action pills float like buttons; choices (filters, categories) lie flat like cards.
        selected === undefined && !hero && elevation(theme, 'raised'),
        disabled && (hero ? styles.disabledOnHero : styles.disabled),
      ]}>
      {mark ?? (icon ? <Feather name={icon} size={IconSize.small} color={iconInk} /> : null)}
      <ThemedText type={weight === 'bold' ? 'smallBold' : 'small'} numberOfLines={1} style={[styles.label, { color: ink }]}>
        {label}
      </ThemedText>
      {trailingIcon ? <Feather name={trailingIcon} size={IconSize.small} color={iconInk} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: Radius.full,
    borderWidth: BORDER_WIDTH,
    flexDirection: 'row',
    // A long label (a pocket's name) truncates instead of pushing the pills beside it off screen.
    flexShrink: 1,
    gap: Layout.tightGap,
    justifyContent: 'center',
    minHeight: Size.pill,
    // Never narrower than the minimum touch size, since the touch area only grows up and down.
    minWidth: Size.control,
    paddingHorizontal: Layout.pillPadding,
  },
  label: {
    flexShrink: 1,
  },
  disabled: {
    opacity: Opacity.disabled,
  },
  disabledOnHero: {
    opacity: Opacity.disabledOnHero,
  },
});
