import { StyleSheet, View } from 'react-native';

import type { FixedItem } from '@/features/plan/rules';
import { formatEuros } from '@/shared/money';
import { CARD_SHADOW, Radius, Spacing } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** What the user pays every month, read-only. */
export function FixedItemsList({ items }: { items: readonly FixedItem[] }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {items.length === 0 ? <ThemedText themeColor="textSecondary">No fixed expenses in this plan.</ThemedText> : null}
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <ThemedText numberOfLines={1} style={styles.name}>
            {item.name}
          </ThemedText>
          <ThemedText type="smallBold">{formatEuros(item.amountCents)}</ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    boxShadow: CARD_SHADOW,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
  },
});
