import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Bucket } from '@/shared/buckets';
import { BUCKET_COLORS, BUCKET_TINTS, Radius } from '@/shared/theme/theme';

export const BUCKET_ICONS: Record<Bucket, ComponentProps<typeof Feather>['name']> = {
  fixed: 'home',
  leisure: 'shopping-bag',
  savings: 'trending-up',
};

const SIZES = { small: { circle: 24, icon: 13 }, regular: { circle: 40, icon: 18 } } as const;

/** The part's icon on a soft tint of its color. Decorative: the name is always written next to it. */
export function BucketBadge({ bucket, size = 'regular' }: { bucket: Bucket; size?: keyof typeof SIZES }) {
  const { circle, icon } = SIZES[size];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { backgroundColor: BUCKET_TINTS[bucket], height: circle, width: circle }]}>
      <Feather name={BUCKET_ICONS[bucket]} size={icon} color={BUCKET_COLORS[bucket]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    justifyContent: 'center',
  },
});
