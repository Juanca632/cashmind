import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
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
  onPress: () => void;
  /** What a screen reader says, when the visible label is shorter. */
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio';
  /** Selected pills take `colors`; others are neutral. Undefined means the pill has no selected state. */
  selected?: boolean;
  /** Fill and ink when selected; the ink also colors the icon when not selected. */
  colors?: { fill: string; ink: string };
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
              borderColor: active ? colors.ink : 'transparent',
            },
        // Action pills float like buttons; choices (filters, categories) lie flat like cards.
        selected === undefined && !hero && elevation(theme, 'raised'),
        disabled && (hero ? styles.disabledOnHero : styles.disabled),
      ]}>
      {icon ? <Feather name={icon} size={IconSize.small} color={iconInk} /> : null}
      <ThemedText type={weight === 'bold' ? 'smallBold' : 'small'} numberOfLines={1} style={{ color: ink }}>
        {label}
      </ThemedText>
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
    gap: Layout.tightGap,
    justifyContent: 'center',
    minHeight: Size.pill,
    // Never narrower than the minimum touch size, since the touch area only grows up and down.
    minWidth: Size.control,
    paddingHorizontal: Layout.pillPadding,
  },
  disabled: {
    opacity: Opacity.disabled,
  },
  disabledOnHero: {
    opacity: Opacity.disabledOnHero,
  },
});
