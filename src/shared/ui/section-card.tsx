import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CARD_SHADOW, Radius, Spacing } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

type SectionCardProps = {
  title: string;
  /** Shown at the right of the title, e.g. a total. */
  value?: string;
  children?: ReactNode;
};

/** One section of a screen: a white card with its own title. */
export function SectionCard({ title, value, children }: SectionCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {title}
        </ThemedText>
        {value ? <ThemedText type="heading">{value}</ThemedText> : null}
      </View>
      {children}
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
