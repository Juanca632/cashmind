import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useExpense } from '@/features/expenses/hooks/use-expense';
import {
  EXPENSE_MISSING,
  MONTH_LOCKED,
  defaultExpenseDate,
  expenseErrorMessage,
  firstEditableDay,
  isExpenseMonthEditable,
  validateExpense,
  type Expense,
  type ExpenseInput,
} from '@/features/expenses/rules';
import { addExpense, deleteExpense, editExpense } from '@/features/expenses/service';
import { BUCKETS, BUCKET_LABELS, type Bucket } from '@/shared/buckets';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { useSubmit } from '@/shared/hooks/use-submit';
import { centsToInput, parseEurosToCents } from '@/shared/money';
import { Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { TextField } from '@/shared/ui/text-field';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function ExpenseScreen() {
  const params = useLocalSearchParams<{ id?: string; month?: string }>();
  const id = params.id ? Number(params.id) : null;
  const loaded = useExpense(id);

  if (loaded.status === 'error') return <DataError />;
  if (loaded.status === 'loading') return <ThemedView style={styles.screen} />;
  const expense = loaded.data;
  if (id !== null && !expense) return <Message text={EXPENSE_MISSING} />;

  const today = new Date();
  if (expense && !isExpenseMonthEditable(expense.date.slice(0, 7), today)) return <Message text={MONTH_LOCKED} />;

  return <ExpenseForm expense={expense} defaultDate={defaultExpenseDate(params.month, today)} today={today} />;
}

function Message({ text }: { text: string }) {
  return (
    <ThemedView style={[styles.screen, styles.content]}>
      <ThemedText>{text}</ThemedText>
    </ThemedView>
  );
}

function ExpenseForm({ expense, defaultDate, today }: { expense: Expense | null; defaultDate: string; today: Date }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [amountText, setAmountText] = useState(expense ? centsToInput(expense.amountCents) : '');
  const [bucket, setBucket] = useState<Bucket>(expense?.bucket ?? 'leisure');
  const [note, setNote] = useState(expense?.note ?? '');
  const [date, setDate] = useState(expense?.date ?? defaultDate);
  const { submit, submitting } = useSubmit();

  const firstDay = firstEditableDay(today);
  const lastDay = dayKey(today);
  const input: ExpenseInput = { date, bucket, amountCents: parseEurosToCents(amountText) ?? 0, note: note.trim() };
  const errors = validateExpense(input, today);
  const amountError = errors.find((error) => error === 'amount-not-positive' || error === 'amount-too-large');

  function onSave() {
    const now = new Date();
    submit(() => (expense ? editExpense(db, expense.id, input, now) : addExpense(db, input, now)));
  }

  function onDelete() {
    if (!expense) return;
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => submit(() => deleteExpense(db, expense.id, new Date())) },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField
            label="Amount"
            suffix="€"
            keyboardType="decimal-pad"
            placeholder="12,50"
            maxLength={12}
            autoFocus={!expense}
            value={amountText}
            onChangeText={setAmountText}
          />
          {amountText.trim() !== '' && amountError ? <ErrorText>{expenseErrorMessage(amountError, today)}</ErrorText> : null}

          <View style={styles.bucketRow}>
            {BUCKETS.map((option) => {
              const selected = option === bucket;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setBucket(option)}
                  style={[styles.bucket, { backgroundColor: selected ? theme.text : theme.backgroundElement }]}>
                  <ThemedText type="smallBold" style={selected ? { color: theme.background } : undefined}>
                    {BUCKET_LABELS[option]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <TextField label="Note (optional)" placeholder="Carrefour" value={note} onChangeText={setNote} maxLength={80} />

          <View style={styles.dateRow}>
            <DayButton
              label="‹"
              accessibilityLabel="Previous day"
              disabled={date <= firstDay}
              onPress={() => setDate(addDays(date, -1))}
            />
            <ThemedText type="smallBold">{date === lastDay ? `Today · ${formatDay(date)}` : formatDay(date)}</ThemedText>
            <DayButton
              label="›"
              accessibilityLabel="Next day"
              disabled={date >= lastDay}
              onPress={() => setDate(addDays(date, 1))}
            />
          </View>
          {errors.includes('date-not-editable') ? <ErrorText>{expenseErrorMessage('date-not-editable', today)}</ErrorText> : null}

          <Button label={expense ? 'Save changes' : 'Add expense'} disabled={errors.length > 0 || submitting} onPress={onSave} />
          {expense ? <Button label="Delete" variant="secondary" disabled={submitting} onPress={onDelete} /> : null}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function DayButton({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={Spacing.three}
      onPress={onPress}
      style={({ pressed }) => [styles.dayButton, disabled && styles.disabled, pressed && styles.pressed]}>
      <ThemedText type="subtitle">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  bucketRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bucket: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    flex: 1,
    paddingVertical: Spacing.three,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    paddingHorizontal: Spacing.three,
  },
  disabled: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.6,
  },
});
