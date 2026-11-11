import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EntryKind } from '@/shared/kinds';
import { Radius } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

export const KIND_ICONS: Record<EntryKind, ComponentProps<typeof Feather>['name']> = {
  income: 'trending-up',
  savings: 'database',
  expense: 'shopping-bag',
};

/** The entry kind's icon on a soft tint of its color. Decorative: the name is always written next to it. */
export function KindBadge({ kind }: { kind: EntryKind }) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { backgroundColor: theme.kindTint[kind] }]}>
      <Feather name={KIND_ICONS[kind]} size={18} color={theme.kindInk[kind]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
