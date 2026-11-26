import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

/** How much of the savings goal is saved. Decorative: the figure next to it says it in words. */
export function GoalBar({ progress, color, testID = 'savings-goal-bar' }: { progress: number; color: string; testID?: string }) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
      style={[styles.goalTrack, { backgroundColor: theme.savingsTrack }]}>
      <Animated.View
        style={[
          styles.goalFill,
          {
            backgroundColor: color,
            width: `${progress * 100}%`,
            transitionProperty: 'width',
            transitionDuration: reducedMotion ? 0 : 300,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  goalTrack: {
    borderRadius: Radius.full,
    height: Size.progress,
    marginTop: Layout.tightGap,
    overflow: 'hidden',
  },
  goalFill: {
    borderRadius: Radius.full,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
});
