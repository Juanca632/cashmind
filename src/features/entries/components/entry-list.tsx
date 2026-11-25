import { Feather } from '@react-native-vector-icons/feather';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';

import { categoryIcon } from '@/features/entries/components/category-icons';
import { entryTitle, type Entry } from '@/features/entries/rules';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { useMoney } from '@/shared/hooks/use-money';
import { IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
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
          <EntryRow entry={entry} today={today} onPress={onPress} />
        </Animated.View>
      ))}
    </LayoutAnimationConfig>
  );
}

type EntryRowProps = {
  entry: Entry;
  today: Date;
  onPress: (entry: Entry) => void;
};

/** One entry: category icon, title, day and amount. Memoized for long lists. */
export const EntryRow = memo(function EntryRow({ entry, today, onPress }: EntryRowProps) {
  const theme = useTheme();
  const money = useMoney();
  const amount = `${entry.kind === 'income' ? '+' : ''}${money.format(entry.amountCents)}`;
  const repeats = entry.recurringId !== null;
  const parts = [entryTitle(entry), dayTitle(entry.date, today), amount, repeats ? 'recorded by a repeat' : null];
  return (
    <Pressable
      accessibilityRole="button"
      // An entry recorded by a repeat (active or stopped) says so; the others read their texts as they are.
      accessibilityLabel={repeats ? parts.filter(Boolean).join(', ') : undefined}
      onPress={() => onPress(entry)}
      // A full-width row highlights when pressed instead of shrinking.
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pressed }]}>
      <KindBadge kind={entry.kind} icon={entry.kind === 'savings' ? undefined : categoryIcon(entry.kind, entry.category)} />
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {entryTitle(entry)}
        </ThemedText>
        <View style={styles.day}>
          <ThemedText type="caption" themeColor="textSecondary">
            {dayTitle(entry.date, today)}
          </ThemedText>
          {repeats ? <Feather name="repeat" size={IconSize.small} color={theme.textSecondary} /> : null}
        </View>
      </View>
      <ThemedText
        type="smallBold"
        style={entry.kind === 'savings' || entry.kind === 'income' ? { color: theme.kindInk[entry.kind] } : undefined}>
        {amount}
      </ThemedText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  empty: {
    paddingVertical: Layout.itemGap,
  },
  row: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.rowGap,
    justifyContent: 'space-between',
    marginHorizontal: -Layout.itemGap,
    minHeight: Size.row,
    paddingHorizontal: Layout.itemGap,
  },
  text: {
    flex: 1,
  },
  day: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.tightGap,
  },
});
