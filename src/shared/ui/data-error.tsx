import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** Shown instead of figures when stored data has the wrong format. */
export function DataError() {
  return (
    <ThemedView style={styles.screen}>
      <ThemedText type="subtitle">Some of your data could not be read</ThemedText>
      <ThemedText themeColor="textSecondary">Nothing was changed or deleted.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.four,
  },
});
