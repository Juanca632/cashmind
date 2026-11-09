import { Pressable, StyleSheet, View } from 'react-native';

import { type Expense } from '@/features/expenses/rules';
import { BUCKET_LABELS } from '@/shared/buckets';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { formatEuros } from '@/shared/money';
import { BUCKET_COLORS, Spacing } from '@/shared/theme/theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { ThemedText } from '@/shared/ui/themed-text';

type ExpenseListProps = {
  expenses: Expense[];
  /** Today, to name the most recent days. */
  today: Date;
  /** Shown when there is nothing to list. */
  emptyText: string;
  /** Called when an expense is tapped. */
  onPress: (expense: Expense) => void;
};

function dayTitle(day: string, today: Date): string {
  const todayKey = dayKey(today);
  if (day === todayKey) return 'Today';
  if (day === addDays(todayKey, -1)) return 'Yesterday';
  return formatDay(day);
}

export function ExpenseList({ expenses, today, emptyText, onPress }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        {emptyText}
      </ThemedText>
    );
  }

  return (
    <View>
      {expenses.map((expense) => (
        <Pressable
          key={expense.id}
          accessibilityRole="button"
          onPress={() => onPress(expense)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <BucketBadge bucket={expense.bucket} />
          <View style={styles.text}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {expense.note || BUCKET_LABELS[expense.bucket]}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {dayTitle(expense.date, today)}
            </ThemedText>
          </View>
          <ThemedText
            type="smallBold"
            style={expense.bucket === 'savings' || expense.bucket === 'income' ? { color: BUCKET_COLORS[expense.bucket] } : undefined}>
            {expense.bucket === 'income' ? '+' : ''}
            {formatEuros(expense.amountCents)}
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
