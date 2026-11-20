import { Feather } from '@react-native-vector-icons/feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { CATEGORIES, CATEGORY_LABELS, type EntryCategory } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import { hapticTick } from '@/shared/haptics';
import type { EntryKind } from '@/shared/kinds';
import { IconSize, Layout, Opacity, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Pill } from '@/shared/ui/pill';
import { ThemedText } from '@/shared/ui/themed-text';

/** Categories per line in the grid: two lines hold every kind's categories. */
const GRID_COLUMNS = 4;

type CategoryChoicesProps = {
  kind: EntryKind;
  value: EntryCategory;
  onChange: (category: EntryCategory) => void;
  /** grid: icons in circles with their names, four per line (the entry form); pills: wrapping pills. */
  layout?: 'pills' | 'grid';
};

/** The kind's fixed categories; exactly one is selected. */
export function CategoryChoices({ kind, value, onChange, layout = 'pills' }: CategoryChoicesProps) {
  const theme = useTheme();

  function pick(option: EntryCategory) {
    if (option === value) return;
    hapticTick();
    onChange(option);
  }

  if (layout === 'grid') {
    return (
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Category">
        {CATEGORIES[kind].map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={CATEGORY_LABELS[option]}
              accessibilityState={{ selected }}
              onPress={() => pick(option)}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
              <View style={[styles.circle, { backgroundColor: selected ? theme.kindFill[kind] : theme.kindTint[kind] }]}>
                <Feather name={categoryIcon(kind, option)} size={IconSize.medium} color={selected ? theme.onAccent : theme.kindInk[kind]} />
              </View>
              <ThemedText
                type={selected ? 'smallBold' : 'caption'}
                themeColor={selected ? 'text' : 'textSecondary'}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {CATEGORY_LABELS[option]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Category">
      {CATEGORIES[kind].map((option) => (
        <Pill
          key={option}
          label={CATEGORY_LABELS[option]}
          icon={categoryIcon(kind, option)}
          accessibilityRole="radio"
          weight="regular"
          selected={option === value}
          colors={{ fill: theme.kindTint[kind], ink: theme.kindInk[kind] }}
          onPress={() => pick(option)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Layout.itemGap,
  },
  cell: {
    alignItems: 'center',
    gap: Layout.tightGap,
    minHeight: Size.control,
    paddingHorizontal: Layout.tightGap,
    width: `${100 / GRID_COLUMNS}%`,
  },
  circle: {
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
