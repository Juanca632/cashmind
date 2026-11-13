import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Layout, Radius } from '@/shared/theme/theme';
import { ThemedView } from '@/shared/ui/themed-view';

/** The one card of the app: same surface, corners and padding everywhere. */
type CardProps = {
  children: ReactNode;
  /** large: more padding, for a card that holds one big figure. */
  size?: 'regular' | 'large';
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, size = 'regular', style }: CardProps) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, size === 'large' && styles.large, style]}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    gap: Layout.itemGap,
    padding: Layout.cardPadding,
  },
  large: {
    padding: Layout.cardPaddingLarge,
  },
});
