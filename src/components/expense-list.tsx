import { Pressable, StyleSheet, View } from 'react-native';

import { BUCKET_LABELS } from '@/components/bucket-rows';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatDay, type Expense } from '@/domain/expenses';
import { formatEuros } from '@/domain/income-plan';

type ExpenseListProps = {
  expenses: Expense[];
  /** When given, tapping an expense calls it (only for editable months). */
  onPress?: (expense: Expense) => void;
};

export function ExpenseList({ expenses, onPress }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <ThemedText themeColor="textSecondary">No expenses recorded this month.</ThemedText>;
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
          <View style={styles.text}>
            <ThemedText numberOfLines={1}>{expense.note || BUCKET_LABELS[expense.bucket]}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
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
    borderRadius: Spacing.three,
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
