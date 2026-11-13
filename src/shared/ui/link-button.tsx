import { Pressable, StyleSheet } from 'react-native';

import { Opacity, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';

type LinkButtonProps = {
  label: string;
  onPress: () => void;
  /** What a screen reader says, when the visible label is shorter. */
  accessibilityLabel?: string;
};

/** Grows the touch area to the minimum touch size, beyond what is drawn. */
const HIT_SLOP = { top: (Size.control - Size.pill) / 2, bottom: (Size.control - Size.pill) / 2 };

/** A small text action such as "Show all" or "See all": accent text, as tall as a pill, 48 to touch. */
export function LinkButton({ label, onPress, accessibilityLabel }: LinkButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <ThemedText type="small" style={{ color: theme.accentInk }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: Size.pill,
  },
  pressed: {
    opacity: Opacity.pressed,
  },
});
