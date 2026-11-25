import { Feather } from '@react-native-vector-icons/feather';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';

import { categoryIcon } from '@/features/entries/components/category-icons';
import { entryTitle, moveTitle, pocketLabel, type Entry, type ListItem, type MoveLine } from '@/features/entries/rules';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { useMoney } from '@/shared/hooks/use-money';
import { IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { KindBadge } from '@/shared/ui/kind-badge';
import { ThemedText } from '@/shared/ui/themed-text';

type EntryListProps = {
  /** Entries and moves, as `mergeByDate` puts them together (specs/028-move-money). */
  items: readonly ListItem[];
  /** Today, to name the most recent days. */
  today: Date;
  /** Shown when there is nothing to list. */
  emptyText: string;
  /** Called when an entry is tapped. */
  onPress: (entry: Entry) => void;
  /** Called when a move is tapped. */
  onPressMove: (line: MoveLine) => void;
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

export function EntryList({ items, today, emptyText, onPress, onPressMove }: EntryListProps) {
  if (items.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        {emptyText}
      </ThemedText>
    );
  }

  return (
    <LayoutAnimationConfig skipEntering>
      {items.map((item) => (
        <Animated.View key={listItemKey(item)} entering={ENTERING} exiting={EXITING} layout={LAYOUT}>
          <ListRow item={item} today={today} onPress={onPress} onPressMove={onPressMove} />
        </Animated.View>
      ))}
    </LayoutAnimationConfig>
  );
}

/** A key that stays unique when entries and moves share a list. */
export function listItemKey(item: ListItem): string {
  return item.type === 'entry' ? `entry:${item.entry.id}` : `move:${item.move.id}`;
}

/** One row of a list: an entry or a move. */
export function ListRow({
  item,
  today,
  onPress,
  onPressMove,
}: {
  item: ListItem;
  today: Date;
  onPress: (entry: Entry) => void;
  onPressMove: (line: MoveLine) => void;
}) {
  return item.type === 'entry' ? (
    <EntryRow entry={item.entry} today={today} onPress={onPress} />
  ) : (
    <MoveRow move={item.move} sign={item.sign} today={today} onPress={onPressMove} />
  );
}

type MoveRowProps = MoveLine & {
  today: Date;
  onPress: (line: MoveLine) => void;
};

/** A move as one side sees it: where it went or came from, its day and a signed amount. */
const MoveRow = memo(function MoveRow({ move, sign, today, onPress }: MoveRowProps) {
  const theme = useTheme();
  const money = useMoney();
  const amount = `${sign === 1 ? '+' : '-'}${money.format(move.amountCents)}`;
  const title = moveTitle(move, sign);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${dayTitle(move.date, today)}, ${amount}`}
      onPress={() => onPress({ move, sign })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pressed }]}>
      <KindBadge kind="savings" icon="shuffle" />
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {dayTitle(move.date, today)}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" style={sign === 1 ? { color: theme.kindInk.income } : undefined}>
        {amount}
      </ThemedText>
    </Pressable>
  );
});

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
  // An expense paid from a pocket says so: it does not count in the month (specs/026-pocket-spending).
  const fromPocket =
    entry.kind === 'expense' && entry.pocketName !== null
      ? `from ${pocketLabel({ name: entry.pocketName, emoji: entry.pocketEmoji })}`
      : null;
  const parts = [entryTitle(entry), dayTitle(entry.date, today), amount, fromPocket, repeats ? 'recorded by a repeat' : null];
  return (
    <Pressable
      accessibilityRole="button"
      // An entry recorded by a repeat (active or stopped) says so; the others read their texts as they are.
      accessibilityLabel={repeats || fromPocket ? parts.filter(Boolean).join(', ') : undefined}
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
          {fromPocket ? (
            <ThemedText type="caption" numberOfLines={1} style={[styles.pocket, { color: theme.kindInk.savings }]}>
              · {fromPocket}
            </ThemedText>
          ) : null}
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
  pocket: {
    flexShrink: 1,
  },
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
