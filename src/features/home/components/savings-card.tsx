import { Feather } from '@react-native-vector-icons/feather';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useMoney } from '@/shared/hooks/use-money';
import { BORDER_WIDTH, elevation, IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { KIND_ICONS } from '@/shared/ui/kind-badge';
import { GoalBar } from '@/shared/ui/goal-bar';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { ThemedText } from '@/shared/ui/themed-text';

type SavingsCardProps = {
  savedCents: number;
  goalCents: number;
  /** What of the goal is still to put into pockets; null where splitting is not offered (past months). */
  toSplitCents: number | null;
  /** How many pockets got a saving this month. */
  pocketCount: number;
};

/**
 * The month's savings in one wide block under the income and spent tiles (specs/030-split-savings):
 * what was saved against the goal, and what is still to split into pockets. While something is
 * left to split, a filled strip says so and the whole block, which floats like other buttons, opens Split.
 */
export function SavingsCard({ savedCents, goalCents, toSplitCents, pocketCount }: SavingsCardProps) {
  const money = useMoney();
  const theme = useTheme();
  const ink = theme.kindInk.savings;
  const hasGoal = goalCents > 0;
  const canSplit = hasGoal && toSplitCents !== null && toSplitCents > 0;
  const figure = hasGoal ? `${money.formatCompact(savedCents)} of ${money.formatCompact(goalCents)}` : money.formatCompact(savedCents);
  const status = !hasGoal
    ? 'No goal'
    : canSplit
      ? `${money.format(toSplitCents)} to split`
      : savedCents >= goalCents
        ? `✓ In ${pocketCount === 1 ? '1 pocket' : `${pocketCount} pockets`}`
        : null;

  const content = (
    <>
      <View style={styles.row}>
        <Feather name={KIND_ICONS.savings} size={IconSize.small} color={ink} />
        <ThemedText type="smallBold" style={[styles.grow, { color: ink }]}>
          Savings
        </ThemedText>
        <ThemedText type="tileValue" numberOfLines={1} style={{ color: ink }}>
          {figure}
        </ThemedText>
      </View>
      {hasGoal ? <GoalBar progress={Math.min(savedCents / goalCents, 1)} color={ink} /> : null}
      {canSplit ? (
        // The one thing to do here, filled with the savings colour so it never reads as a footnote.
        <View style={[styles.action, { backgroundColor: theme.kindFill.savings }]}>
          <ThemedText type="smallBold" style={[styles.grow, { color: theme.onAccent }]}>
            {status}
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
            Split
          </ThemedText>
          <Feather name="chevron-right" size={IconSize.medium} color={theme.onAccent} />
        </View>
      ) : status ? (
        <ThemedText type="small" style={{ color: ink }}>
          {status}
        </ThemedText>
      ) : null}
    </>
  );

  const surface = [styles.card, { backgroundColor: theme.kindTint.savings }];
  if (!canSplit) {
    return (
      <View accessible accessibilityLabel="Savings" accessibilityValue={{ text: [figure, status].filter(Boolean).join(', ') }} style={surface}>
        {content}
      </View>
    );
  }
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Split savings"
      accessibilityValue={{ text: `${figure}, ${status}` }}
      onPress={() => router.push('/split')}
      style={[surface, elevation(theme, 'raised')]}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: 'transparent',
    borderRadius: Radius.card,
    borderWidth: BORDER_WIDTH,
    gap: Layout.itemGap,
    padding: Layout.tilePadding,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.tightGap,
  },
  grow: {
    flex: 1,
  },
  action: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.tightGap,
    minHeight: Size.pill,
    paddingHorizontal: Layout.pillPadding,
  },
});
