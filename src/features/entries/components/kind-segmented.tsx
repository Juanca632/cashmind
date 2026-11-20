import { Pressable, StyleSheet, View } from 'react-native';

import { hapticTick } from '@/shared/haptics';
import { KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { Layout, Opacity, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';

type KindSegmentedProps = {
  kinds: readonly EntryKind[];
  value: EntryKind;
  onChange: (kind: EntryKind) => void;
};

/**
 * One control with a segment per kind: the selected one filled with its kind's color. A different
 * shape from the category choices, since the kind changes everything below it.
 */
export function KindSegmented({ kinds, value, onChange }: KindSegmentedProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Kind"
      style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      {kinds.map((kind) => {
        const selected = kind === value;
        return (
          <Pressable
            key={kind}
            accessibilityRole="radio"
            accessibilityLabel={KIND_LABELS[kind]}
            accessibilityState={{ selected }}
            // The track's padding is part of the touch area: 48 tall in all.
            hitSlop={{ top: Layout.tightGap, bottom: Layout.tightGap }}
            onPress={() => {
              if (selected) return;
              hapticTick();
              onChange(kind);
            }}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: theme.kindFill[kind] },
              pressed && !selected && styles.pressed,
            ]}>
            <ThemedText type="smallBold" numberOfLines={1} style={{ color: selected ? theme.onAccent : theme.text }}>
              {KIND_LABELS[kind]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: Radius.full,
    flexDirection: 'row',
    gap: Layout.tightGap,
    padding: Layout.tightGap,
  },
  segment: {
    alignItems: 'center',
    borderRadius: Radius.full,
    flex: 1,
    justifyContent: 'center',
    minHeight: Size.pill,
  },
  pressed: {
    opacity: Opacity.pressed,
  },
});
