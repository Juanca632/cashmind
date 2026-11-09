import { Pressable, StyleSheet, View } from 'react-native';

import { BUCKET_LABELS } from '@/shared/buckets';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { CARD_SHADOW, Radius, Spacing } from '@/shared/theme/theme';
import { type Expense } from '@/features/expenses/rules';
import { formatDay } from '@/shared/days';
import { formatEuros } from '@/shared/money';

type ExpenseListProps = {
  expenses: Expense[];
  /** When given, tapping an expense calls it (only for editable months). */
  onPress?: (expense: Expense) => void;
};

export function ExpenseList({ expenses, onPress }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText themeColor="textSecondary">No expenses recorded this month.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {expenses.map((expense) => (
        <Pressable
          key={expense.id}
          accessibilityRole={onPress ? 'button' : undefined}
          disabled={!onPress}
          onPress={() => onPress?.(expense)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <BucketBadge bucket={expense.bucket} />
          <View style={styles.text}>
            <ThemedText numberOfLines={1}>{expense.note || BUCKET_LABELS[expense.bucket]}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {formatDay(expense.date)} · {BUCKET_LABELS[expense.bucket]}
            </ThemedText>
          </View>
          <ThemedText type="smallBold">{formatEuros(expense.amountCents)}</ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    boxShadow: CARD_SHADOW,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
