import { Pressable, StyleSheet, View } from 'react-native';

import { type Entry } from '@/features/entries/rules';
import { KIND_LABELS } from '@/shared/kinds';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { formatEuros } from '@/shared/money';
import { KIND_COLORS, Spacing } from '@/shared/theme/theme';
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
    <View>
      {entries.map((entry) => (
        <Pressable
          key={entry.id}
          accessibilityRole="button"
          onPress={() => onPress(entry)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
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
            style={entry.kind === 'savings' || entry.kind === 'income' ? { color: KIND_COLORS[entry.kind] } : undefined}>
            {entry.kind === 'income' ? '+' : ''}
            {formatEuros(entry.amountCents)}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: Spacing.two,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    minHeight: 62,
  },
  text: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
