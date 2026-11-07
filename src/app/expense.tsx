import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BUCKET_LABELS, ERROR_COLOR } from '@/components/bucket-rows';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { deleteExpense, getExpense, insertExpense, updateExpense } from '@/data/expense-repo';
import {
  addDays,
  dayKey,
  firstEditableDay,
  formatDay,
  isExpenseMonthEditable,
  validateExpense,
  type Expense,
  type ExpenseInput,
} from '@/domain/expenses';
import { BUCKETS, isValidMonthKey, monthKey, parseEurosToCents, type Bucket } from '@/domain/income-plan';
import { useTheme } from '@/hooks/use-theme';

type Loaded = { status: 'loading' } | { status: 'ready'; expense: Expense | null } | { status: 'missing' };

export default function ExpenseScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id?: string; month?: string }>();
  const id = params.id ? Number(params.id) : null;
  const [loaded, setLoaded] = useState<Loaded>(id === null ? { status: 'ready', expense: null } : { status: 'loading' });

  useEffect(() => {
    if (id === null) return;
    let active = true;
    getExpense(db, id).then((expense) => {
      if (active) setLoaded(expense ? { status: 'ready', expense } : { status: 'missing' });
    });
    return () => {
      active = false;
    };
  }, [db, id]);

  if (loaded.status === 'loading') return <ThemedView style={styles.screen} />;
  if (loaded.status === 'missing') {
    return (
      <ThemedView style={[styles.screen, styles.content]}>
        <ThemedText>This expense no longer exists.</ThemedText>
      </ThemedView>
    );
  }

  const today = new Date();
  const expense = loaded.expense;
  if (expense && !isExpenseMonthEditable(expense.date.slice(0, 7), today)) {
    return (
      <ThemedView style={[styles.screen, styles.content]}>
        <ThemedText>Expenses of this month can no longer be changed.</ThemedText>
      </ThemedView>
    );
  }

  return <ExpenseForm expense={expense} defaultDate={defaultDate(params.month, today)} today={today} />;
}

/** Today, or the last day of the requested month when adding to the previous month during the grace period. */
function defaultDate(month: string | undefined, today: Date): string {
  if (!isValidMonthKey(month) || month === monthKey(today) || !isExpenseMonthEditable(month, today)) {
    return dayKey(today);
  }
  return addDays(`${monthKey(today)}-01`, -1);
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function ExpenseForm({ expense, defaultDate, today }: { expense: Expense | null; defaultDate: string; today: Date }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [amountText, setAmountText] = useState(expense ? centsToInput(expense.amountCents) : '');
  const [bucket, setBucket] = useState<Bucket>(expense?.bucket ?? 'leisure');
  const [note, setNote] = useState(expense?.note ?? '');
  const [date, setDate] = useState(expense?.date ?? defaultDate);
  const [saving, setSaving] = useState(false);

  const firstDay = firstEditableDay(today);
  const lastDay = dayKey(today);
  const input: ExpenseInput = { date, bucket, amountCents: parseEurosToCents(amountText) ?? 0, note: note.trim() };
  const errors = validateExpense(input, today);

  async function run(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
      router.back();
    } catch {
      Alert.alert('Something went wrong', 'The expense could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function onSave() {
    run(() => (expense ? updateExpense(db, expense.id, input) : insertExpense(db, input)));
  }

  function onDelete() {
    if (!expense) return;
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => run(() => deleteExpense(db, expense.id)) },
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
            autoFocus={!expense}
            value={amountText}
            onChangeText={setAmountText}
          />
          {amountText.trim() !== '' && errors.includes('amount-not-positive') ? (
            <ThemedText type="small" style={{ color: ERROR_COLOR }}>
              The amount must be greater than 0 €.
            </ThemedText>
          ) : null}

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
          {errors.includes('date-not-editable') ? (
            <ThemedText type="small" style={{ color: ERROR_COLOR }}>
              Pick a date between {formatDay(firstDay)} and today.
            </ThemedText>
          ) : null}

          <Button label={expense ? 'Save changes' : 'Add expense'} disabled={errors.length > 0 || saving} onPress={onSave} />
          {expense ? <Button label="Delete" variant="secondary" disabled={saving} onPress={onDelete} /> : null}
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
