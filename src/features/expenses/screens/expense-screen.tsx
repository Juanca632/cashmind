import { Feather } from '@react-native-vector-icons/feather';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, type ComponentProps } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

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
import { BUCKETS, BUCKET_DESCRIPTIONS, BUCKET_LABELS, type Bucket } from '@/shared/buckets';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { useSubmit } from '@/shared/hooks/use-submit';
import { centsToInput, parseEurosToCents } from '@/shared/money';
import { BUCKET_COLORS, FontFamily, Hero, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { BUCKET_ICONS } from '@/shared/ui/bucket-badge';
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

  const newEntryLabel = bucket === 'savings' ? 'Add to savings' : 'Add expense';
  const submitLabel = expense ? 'Save changes' : newEntryLabel;

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
          <View style={styles.amount}>
            <TextInput
              accessibilityLabel="Amount"
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={theme.textSecondary}
              maxLength={12}
              autoFocus={!expense}
              value={amountText}
              onChangeText={setAmountText}
              style={[styles.amountInput, { color: theme.text }]}
            />
            <ThemedText type="heading" themeColor="textSecondary">
              €
            </ThemedText>
          </View>
          {amountText.trim() !== '' && amountError ? <ErrorText>{expenseErrorMessage(amountError, today)}</ErrorText> : null}

          <View style={styles.bucketRow}>
            {BUCKETS.map((option) => {
              const selected = option === bucket;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityLabel={BUCKET_LABELS[option]}
                  accessibilityState={{ selected }}
                  onPress={() => setBucket(option)}
                  style={[styles.bucket, { backgroundColor: selected ? BUCKET_COLORS[option] : theme.backgroundElement }]}>
                  <Feather name={BUCKET_ICONS[option]} size={18} color={selected ? Hero.text : BUCKET_COLORS[option]} />
                  <ThemedText type="smallBold" style={selected ? { color: Hero.text } : undefined}>
                    {BUCKET_LABELS[option]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.centered}>
            {BUCKET_DESCRIPTIONS[bucket]}
          </ThemedText>

          <TextField label="Note (optional)" placeholder="Cinema" value={note} onChangeText={setNote} maxLength={80} />

          <View style={[styles.dateRow, { backgroundColor: theme.backgroundElement }]}>
            <DayButton
              icon="chevron-left"
              accessibilityLabel="Previous day"
              disabled={date <= firstDay}
              onPress={() => setDate(addDays(date, -1))}
            />
            <ThemedText type="smallBold">{date === lastDay ? `Today · ${formatDay(date)}` : formatDay(date)}</ThemedText>
            <DayButton
              icon="chevron-right"
              accessibilityLabel="Next day"
              disabled={date >= lastDay}
              onPress={() => setDate(addDays(date, 1))}
            />
          </View>
          {errors.includes('date-not-editable') ? <ErrorText>{expenseErrorMessage('date-not-editable', today)}</ErrorText> : null}

          <Button label={submitLabel} disabled={errors.length > 0 || submitting} onPress={onSave} />
          {expense ? <Button label="Delete" variant="secondary" disabled={submitting} onPress={onDelete} /> : null}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function DayButton({
  icon,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={Spacing.three}
      onPress={onPress}
      style={({ pressed }) => [styles.dayButton, disabled && styles.disabled, pressed && styles.pressed]}>
      <Feather name={icon} size={24} color={theme.text} />
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
  amount: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
  amountInput: {
    fontFamily: FontFamily.bold,
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    minWidth: 120,
    padding: 0,
    textAlign: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  bucketRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bucket: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flex: 1,
    gap: Spacing.one,
    justifyContent: 'center',
    minHeight: 72,
  },
  dateRow: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH + Spacing.one,
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
