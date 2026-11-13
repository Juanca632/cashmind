import { Feather } from '@react-native-vector-icons/feather';
import { StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import type { CategoryShare } from '@/features/entries/rules';
import type { EntryKind } from '@/shared/kinds';
import { formatEuros } from '@/shared/money';
import { IconSize, Layout, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Card } from '@/shared/ui/card';
import { ThemedText } from '@/shared/ui/themed-text';

/** What one kind's month is made of, one line per category, largest first. */
export function CategorySplit({ kind, shares }: { kind: EntryKind; shares: CategoryShare[] }) {
  const theme = useTheme();
  return (
    <Card>
      <ThemedText type="smallBold" themeColor="textSecondary">
        By category
      </ThemedText>
      {shares.map((share) => {
        const label = CATEGORY_LABELS[share.category];
        const amount = formatEuros(share.cents);
        return (
          <View key={share.category} style={styles.line} accessible accessibilityLabel={`${label}: ${amount}, ${share.percent} %`}>
            <Feather name={categoryIcon(kind, share.category)} size={IconSize.small} color={theme.kindInk[kind]} />
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
    </Card>
  );
}

const styles = StyleSheet.create({
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.itemGap,
  },
  label: {
    flex: 1,
  },
  percent: {
    fontVariant: ['tabular-nums'],
    minWidth: Size.percentColumn,
    textAlign: 'right',
  },
});
