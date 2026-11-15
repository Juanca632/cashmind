import { StyleSheet, View } from 'react-native';

import { CATEGORIES, CATEGORY_LABELS, type EntryCategory } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import { hapticTick } from '@/shared/haptics';
import type { EntryKind } from '@/shared/kinds';
import { Layout } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Pill } from '@/shared/ui/pill';

type CategoryChoicesProps = {
  kind: EntryKind;
  value: EntryCategory;
  onChange: (category: EntryCategory) => void;
};

/** The kind's fixed categories as pills; exactly one is selected. */
export function CategoryChoices({ kind, value, onChange }: CategoryChoicesProps) {
  const theme = useTheme();
  return (
    <View style={styles.categories} accessibilityRole="radiogroup" accessibilityLabel="Category">
      {CATEGORIES[kind].map((option) => (
        <Pill
          key={option}
          label={CATEGORY_LABELS[option]}
          icon={categoryIcon(kind, option)}
          accessibilityRole="radio"
          weight="regular"
          selected={option === value}
          colors={{ fill: theme.kindTint[kind], ink: theme.kindInk[kind] }}
          onPress={() => {
            if (option === value) return;
            hapticTick();
            onChange(option);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
});
