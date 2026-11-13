import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout } from '@/shared/theme/theme';
import { EdgeFades } from '@/shared/ui/edge-fades';

type ScreenScrollProps = {
  children: ReactNode;
  /** True on screens without a header, so content starts below the status bar. */
  topInset?: boolean;
  /** loose: more space between blocks, for calm screens with few of them. */
  spacing?: 'regular' | 'loose';
};

/**
 * The padding of a screen's scrolling content: the side margin, the block spacing below a header
 * (or a little below the status bar when there is no header) and room above the system bar. Lists
 * that scroll themselves use it too, so every screen keeps the same edges.
 */
export function useScreenContent(topInset = false): ViewStyle[] {
  const insets = useSafeAreaInsets();
  return [
    styles.content,
    { paddingBottom: Layout.screenBottom + insets.bottom, paddingTop: topInset ? Layout.itemGap + insets.top : Layout.sectionGap },
  ];
}

/**
 * The scrolling body of a screen: the app's side margin and block spacing, clear of the system bars,
 * with content fading out before it reaches them.
 */
export function ScreenScroll({ children, topInset = false, spacing = 'regular' }: ScreenScrollProps) {
  const content = useScreenContent(topInset);
  return (
    <View style={styles.fill}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[content, spacing === 'loose' ? styles.loose : styles.blocks]}>
        {children}
      </ScrollView>
      <EdgeFades top={topInset} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  blocks: {
    gap: Layout.sectionGap,
  },
  loose: {
    gap: Layout.looseGap,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
  },
});
