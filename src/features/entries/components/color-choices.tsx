import { Feather } from '@react-native-vector-icons/feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { hapticTick } from '@/shared/haptics';
import { Hero, IconSize, Layout, Opacity, POCKET_COLORS, POCKET_COLOR_NAMES, Radius, Size, type PocketColor } from '@/shared/theme/theme';

const COLOR_LABELS: Record<PocketColor, string> = {
  blue: 'Blue',
  indigo: 'Indigo',
  purple: 'Purple',
  pink: 'Pink',
  orange: 'Orange',
  amber: 'Amber',
  green: 'Green',
  slate: 'Slate',
};

/** The pocket palette as round swatches; the chosen one carries a check (specs/027-spaces). */
export function ColorChoices({ value, onChange }: { value: PocketColor; onChange: (color: PocketColor) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Colour">
      {POCKET_COLOR_NAMES.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityLabel={COLOR_LABELS[color]}
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              hapticTick();
              onChange(color);
            }}
            style={({ pressed }) => [styles.swatch, { backgroundColor: POCKET_COLORS[color].base }, pressed && styles.pressed]}>
            {selected ? <Feather name="check" size={IconSize.medium} color={Hero.text} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
  swatch: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: Size.badge,
    justifyContent: 'center',
    width: Size.badge,
  },
  pressed: {
    opacity: Opacity.pressed,
  },
});
