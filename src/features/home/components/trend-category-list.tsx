import { Feather } from '@react-native-vector-icons/feather';
import { StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS, type EntryCategory } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import type { CategoryShare } from '@/features/entries/rules';
import type { EntryKind } from '@/shared/kinds';
import { useMoney } from '@/shared/hooks/use-money';
import { IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Card } from '@/shared/ui/card';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { ThemedText } from '@/shared/ui/themed-text';

/** One category of the selected month, with how it compares with its usual (null without one). */
export type TrendCategoryRow = { share: CategoryShare; versusUsual: string | null };

type TrendCategoryListProps = {
  kind: EntryKind;
  /** Largest first, as `categorySplit` gives them; empty shows a short line instead. */
  rows: readonly TrendCategoryRow[];
  onPress: (category: EntryCategory) => void;
};

/**
 * The selected month's categories as horizontal bars, the largest full, each with how it compares
 * with its usual so the one that changed most stands out; each opens its own history.
 */
export function TrendCategoryList({ kind, rows, onPress }: TrendCategoryListProps) {
  const theme = useTheme();
  const money = useMoney();
  const largest = rows[0]?.share.cents ?? 1;
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        By category
      </ThemedText>
      <Card>
        {rows.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nothing recorded this month
          </ThemedText>
        ) : null}
        {rows.map(({ share, versusUsual }) => {
          const label = CATEGORY_LABELS[share.category];
          const amount = money.format(share.cents);
          return (
            <PressableScale
              key={share.category}
              accessibilityRole="button"
              accessibilityLabel={[`${label}: ${amount}`, versusUsual].filter(Boolean).join(', ')}
              accessibilityHint="Shows its last months"
              onPress={() => onPress(share.category)}
              style={styles.row}>
              <View style={styles.line}>
                <Feather name={categoryIcon(kind, share.category)} size={IconSize.small} color={theme.kindInk[kind]} />
                <ThemedText type="small" numberOfLines={1} style={styles.label}>
                  {label}
                </ThemedText>
                <ThemedText type="smallBold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {amount}
                </ThemedText>
                <Feather name="chevron-right" size={IconSize.small} color={theme.textSecondary} />
              </View>
              <View style={[styles.track, { backgroundColor: theme.kindTint[kind] }]} importantForAccessibility="no-hide-descendants">
                <View style={[styles.fill, { width: `${(share.cents / largest) * 100}%`, backgroundColor: theme.kindInk[kind] }]} />
              </View>
              {versusUsual ? (
                <ThemedText type="caption" themeColor="textSecondary">
                  {versusUsual}
                </ThemedText>
              ) : null}
            </PressableScale>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Layout.itemGap,
  },
  row: {
    gap: Layout.tightGap,
    justifyContent: 'center',
    minHeight: Size.control,
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.itemGap,
  },
  label: {
    flex: 1,
  },
  track: {
    borderRadius: Radius.bar,
    height: Size.categoryBar,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.bar,
    height: '100%',
    minWidth: Size.categoryBar,
  },
});
