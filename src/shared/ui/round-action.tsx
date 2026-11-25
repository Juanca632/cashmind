import { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { elevation, IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { ThemedText } from '@/shared/ui/themed-text';

type RoundActionProps = {
  label: string;
  icon: ComponentProps<typeof Feather>['name'];
  /** What a screen reader says, when the visible label is shorter. */
  accessibilityLabel?: string;
  onPress: () => void;
};

/**
 * A round action with a short name under it, in a row of a few, as banking apps put them under a
 * balance (specs/027-spaces). The circle is neutral, so it never competes with the coloured card
 * above, and floats like the app's other buttons.
 */
export function RoundAction({ label, icon, accessibilityLabel, onPress }: RoundActionProps) {
  const theme = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} style={styles.action}>
      <View style={[styles.circle, { backgroundColor: theme.backgroundElement }, elevation(theme, 'raised')]}>
        <Feather name={icon} size={IconSize.large} color={theme.text} />
      </View>
      <ThemedText type="smallBold">{label}</ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    gap: Layout.tightGap,
    minWidth: Size.roundAction,
  },
  circle: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: Size.roundAction,
    justifyContent: 'center',
    width: Size.roundAction,
  },
});
