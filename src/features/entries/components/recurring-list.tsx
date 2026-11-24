import { Pressable, StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import type { RecurringItem } from '@/features/entries/rules';
import { useMoney } from '@/shared/hooks/use-money';
import { Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { KindBadge } from '@/shared/ui/kind-badge';
import { ThemedText } from '@/shared/ui/themed-text';

type RecurringListProps = {
  items: RecurringItem[];
  onPress: (item: RecurringItem) => void;
};

/** What a monthly item is called: its note, else its category. */
function itemTitle(item: RecurringItem): string {
  return item.note || CATEGORY_LABELS[item.category];
}

/** The items that repeat every month, one row each: category icon, name and amount ("+" for income). */
export function RecurringList({ items, onPress }: RecurringListProps) {
  const theme = useTheme();
  const money = useMoney();
  if (items.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        Nothing repeats yet.
      </ThemedText>
    );
  }
  return (
    <View>
      {items.map((item) => {
        const amount = `${item.kind === 'income' ? '+' : ''}${money.format(item.amountCents)}`;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${itemTitle(item)}, ${amount}, every month`}
            onPress={() => onPress(item)}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pressed }]}>
            <KindBadge kind={item.kind} icon={categoryIcon(item.kind, item.category)} />
            <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
              {itemTitle(item)}
            </ThemedText>
            <ThemedText
              type="smallBold"
              style={item.kind === 'savings' || item.kind === 'income' ? { color: theme.kindInk[item.kind] } : undefined}>
              {amount}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: Layout.itemGap,
  },
  row: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.rowGap,
    marginHorizontal: -Layout.itemGap,
    minHeight: Size.row,
    paddingHorizontal: Layout.itemGap,
  },
  title: {
    flex: 1,
  },
});
