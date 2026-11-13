import { Feather } from '@react-native-vector-icons/feather';
import { StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import type { CategoryShare } from '@/features/entries/rules';
import type { EntryKind } from '@/shared/kinds';
import { formatEuros } from '@/shared/money';
import { Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** What one kind's month is made of, one line per category, largest first. */
export function CategorySplit({ kind, shares }: { kind: EntryKind; shares: CategoryShare[] }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        By category
      </ThemedText>
      {shares.map((share) => {
        const label = CATEGORY_LABELS[share.category];
        const amount = formatEuros(share.cents);
        return (
          <View key={share.category} style={styles.line} accessible accessibilityLabel={`${label}: ${amount}, ${share.percent} %`}>
            <Feather name={categoryIcon(kind, share.category)} size={16} color={theme.kindInk[kind]} />
            <ThemedText type="small" numberOfLines={1} style={styles.label}>
              {label}
            </ThemedText>
            <ThemedText type="smallBold">{amount}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.percent}>
              {`${share.percent} %`}
            </ThemedText>
          </View>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  label: {
    flex: 1,
  },
  percent: {
    fontVariant: ['tabular-nums'],
    minWidth: 44,
    textAlign: 'right',
  },
});
