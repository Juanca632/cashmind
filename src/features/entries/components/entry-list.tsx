import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';

import { type Entry } from '@/features/entries/rules';
import { KIND_LABELS } from '@/shared/kinds';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { formatEuros } from '@/shared/money';
import { Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { KindBadge } from '@/shared/ui/kind-badge';
import { ThemedText } from '@/shared/ui/themed-text';

type EntryListProps = {
  entries: Entry[];
  /** Today, to name the most recent days. */
  today: Date;
  /** Shown when there is nothing to list. */
  emptyText: string;
  /** Called when an entry is tapped. */
  onPress: (entry: Entry) => void;
};

// Rows fade in and out and the others slide into place. The first render does not animate.
const ENTERING = FadeIn.duration(200);
const EXITING = FadeOut.duration(150);
const LAYOUT = LinearTransition.duration(200);

function dayTitle(day: string, today: Date): string {
  const todayKey = dayKey(today);
  if (day === todayKey) return 'Today';
  if (day === addDays(todayKey, -1)) return 'Yesterday';
  return formatDay(day);
}

export function EntryList({ entries, today, emptyText, onPress }: EntryListProps) {
  const theme = useTheme();
  if (entries.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        {emptyText}
      </ThemedText>
    );
  }

  return (
    <LayoutAnimationConfig skipEntering>
      {entries.map((entry) => (
        <Animated.View key={entry.id} entering={ENTERING} exiting={EXITING} layout={LAYOUT}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onPress(entry)}
            // A full-width row highlights when pressed instead of shrinking.
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pressed }]}>
            <KindBadge kind={entry.kind} />
            <View style={styles.text}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {entry.note || KIND_LABELS[entry.kind]}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {dayTitle(entry.date, today)}
              </ThemedText>
            </View>
            <ThemedText
              type="smallBold"
              style={entry.kind === 'savings' || entry.kind === 'income' ? { color: theme.kindInk[entry.kind] } : undefined}>
              {entry.kind === 'income' ? '+' : ''}
              {formatEuros(entry.amountCents)}
            </ThemedText>
          </Pressable>
        </Animated.View>
      ))}
    </LayoutAnimationConfig>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: Spacing.two,
  },
  row: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    marginHorizontal: -Spacing.two,
    minHeight: 62,
    paddingHorizontal: Spacing.two,
  },
  text: {
    flex: 1,
  },
});
