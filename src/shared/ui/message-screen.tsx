import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

type MessageScreenProps = {
  title: string;
  text?: string;
  /** True on screens without a header, so the text starts below the status bar. */
  topInset?: boolean;
  /** Centers the message on the screen (the database error, shown instead of the whole app). */
  centered?: boolean;
};

/** The one full-screen message of the app: errors and things that no longer exist. */
export function MessageScreen({ title, text, topInset = false, centered = false }: MessageScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <ThemedView
      style={[
        styles.screen,
        centered
          ? styles.centered
          : { paddingTop: topInset ? insets.top + Layout.sectionGap : Layout.looseGap },
      ]}>
      {/* A title with an explanation is a heading; a single sentence reads as plain text. */}
      <ThemedText type={text ? 'subtitle' : 'default'}>{title}</ThemedText>
      {text ? <ThemedText themeColor="textSecondary">{text}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: Layout.itemGap,
    paddingHorizontal: Layout.screenPadding,
  },
  centered: {
    justifyContent: 'center',
    paddingVertical: Layout.looseGap,
  },
});
