import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EntryBucket } from '@/shared/buckets';
import { BUCKET_COLORS, BUCKET_TINTS, Radius } from '@/shared/theme/theme';

export const BUCKET_ICONS: Record<EntryBucket, ComponentProps<typeof Feather>['name']> = {
  fixed: 'home',
  leisure: 'shopping-bag',
  savings: 'database',
  income: 'trending-up',
};

/** The part's icon on a soft tint of its color. Decorative: the name is always written next to it. */
export function BucketBadge({ bucket }: { bucket: EntryBucket }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { backgroundColor: BUCKET_TINTS[bucket] }]}>
      <Feather name={BUCKET_ICONS[bucket]} size={18} color={BUCKET_COLORS[bucket]} />
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
