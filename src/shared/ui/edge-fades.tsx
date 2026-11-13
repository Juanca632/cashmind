import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme/use-theme';

/**
 * The app draws behind Android's status and navigation bars (edge to edge). Each fade covers exactly
 * its bar: the background color at the screen edge, clear where the bar ends, so scrolling content
 * blends out under the bar's icons or buttons instead of mixing with them. Put them last inside the
 * screen, over the scrolling content.
 */
export function EdgeFades({ top = false }: { top?: boolean }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  // The same color fully transparent (#RRGGBB00), so the fade never turns grey.
  const clear = `${theme.background}00`;
  return (
    <>
      {top && insets.top > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.top,
            { height: insets.top, experimental_backgroundImage: `linear-gradient(to bottom, ${theme.background}, ${clear})` },
          ]}
        />
      ) : null}
      {insets.bottom > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.bottom,
            { height: insets.bottom, experimental_backgroundImage: `linear-gradient(to top, ${theme.background}, ${clear})` },
          ]}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottom: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
