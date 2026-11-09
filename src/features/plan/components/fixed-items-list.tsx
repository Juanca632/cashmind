import { StyleSheet, View } from 'react-native';

import type { FixedItem } from '@/features/plan/rules';
import { formatEuros } from '@/shared/money';
import { MIN_TOUCH, Spacing } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';

/** What the user pays every month, read-only. */
export function FixedItemsList({ items }: { items: readonly FixedItem[] }) {
  return (
    <View style={styles.list}>
      {items.length === 0 ? <ThemedText themeColor="textSecondary">No fixed expenses in this plan.</ThemedText> : null}
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <ThemedText numberOfLines={1} style={styles.name}>
            {item.name}
          </ThemedText>
          <ThemedText type="smallBold">{formatEuros(item.amountCents)}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: Spacing.two,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH + Spacing.two,
  },
  name: {
    flex: 1,
  },
});
