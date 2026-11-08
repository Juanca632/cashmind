import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** Shown instead of the app when the database cannot be updated. */
export function DatabaseError({ message }: { message: string }) {
  return (
    <ThemedView style={styles.screen}>
      <ThemedText>{message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
});
