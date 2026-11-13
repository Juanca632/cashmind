import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EntryKind } from '@/shared/kinds';
import { IconSize, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

export const KIND_ICONS: Record<EntryKind, ComponentProps<typeof Feather>['name']> = {
  income: 'trending-up',
  savings: 'database',
  expense: 'shopping-bag',
};

type IconName = ComponentProps<typeof Feather>['name'];

/**
 * An icon on a soft tint of the kind's color: the kind's own icon unless another one is given.
 * Decorative: the name is always written next to it.
 */
export function KindBadge({ kind, icon = KIND_ICONS[kind] }: { kind: EntryKind; icon?: IconName }) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { backgroundColor: theme.kindTint[kind] }]}>
      <Feather name={icon} size={IconSize.medium} color={theme.kindInk[kind]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: Size.badge,
    justifyContent: 'center',
    width: Size.badge,
  },
});
