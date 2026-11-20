import { Feather } from '@react-native-vector-icons/feather';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { KeyboardAvoidingView, Pressable, StyleSheet, View } from 'react-native';

import { DEFAULT_CATEGORY, type EntryCategory } from '@/features/entries/categories';
import { AmountField } from '@/features/entries/components/amount-field';
import { CategoryChoices } from '@/features/entries/components/category-choices';
import { QuickAddRow } from '@/features/entries/components/quick-add-row';
import { useEntriesBetween } from '@/features/entries/hooks/use-entries-between';
import { useEntry } from '@/features/entries/hooks/use-entry';
import { useRecurringItem } from '@/features/entries/hooks/use-recurring-item';
import {
  ENTRY_MISSING,
  defaultEntryDate,
  entryErrorMessage,
  lastDayOfMonth,
  quickAddRange,
  quickAddSuggestions,
  validateEntry,
  type Entry,
  type EntryInput,
  type QuickAddSuggestion,
} from '@/features/entries/rules';
import { addEntry, deleteEntry, editEntry } from '@/features/entries/service';
import { ADD_LABELS, ENTRY_KINDS, KIND_LABELS, NOTE_EXAMPLES, type EntryKind } from '@/shared/kinds';
import { addDays, dayKey, dayToDate, formatDay } from '@/shared/days';
import { monthKey } from '@/shared/months';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { centsToInput, parseEurosToCents } from '@/shared/money';
import { IconSize, Layout, Opacity, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { KIND_ICONS } from '@/shared/ui/kind-badge';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { hapticTick } from '@/shared/haptics';
import { DataError } from '@/shared/ui/data-error';
import { MessageScreen } from '@/shared/ui/message-screen';
import { ErrorText } from '@/shared/ui/error-text';
import { SwitchRow } from '@/shared/ui/switch-row';
import { TextField } from '@/shared/ui/text-field';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function EntryScreen() {
  const params = useLocalSearchParams<{ id?: string; month?: string; kind?: string; repeat?: string }>();
  const id = params.id ? Number(params.id) : null;
  const loaded = useEntry(id);
  const item = useRecurringItem(loaded.status === 'ready' ? (loaded.data?.recurringId ?? null) : null);
  const today = new Date();
  const range = quickAddRange(today);
  const recent = useEntriesBetween(range.from, range.to);

  if (loaded.status === 'error' || item.status === 'error') return <DataError />;
  if (loaded.status === 'loading' || item.status === 'loading' || recent.status === 'loading') {
    return <ThemedView style={styles.screen} />;
  }
  const entry = loaded.data;
  if (id !== null && !entry) return <MessageScreen title={ENTRY_MISSING} />;
  // Suggestions only help when adding; if recent entries cannot be read the form works without them.
  const suggestions = entry === null && recent.status === 'ready' ? quickAddSuggestions(recent.data, today) : [];

  return (
    <EntryForm
      entry={entry}
      defaultKind={params.kind === 'savings' || params.kind === 'income' ? params.kind : 'expense'}
      defaultDate={defaultEntryDate(params.month, today)}
      // An entry repeats while its item is active; Add from My plan starts with repeat on.
      initialRepeat={entry ? item.data?.active === true : params.repeat === '1'}
      today={today}
      suggestions={suggestions}
    />
  );
}

function EntryForm({
  entry,
  defaultKind,
  defaultDate,
  initialRepeat,
  today,
  suggestions,
}: {
  entry: Entry | null;
  defaultKind: EntryKind;
  defaultDate: string;
  initialRepeat: boolean;
  today: Date;
  /** Expenses recorded often lately, offered while adding an expense. */
  suggestions: readonly QuickAddSuggestion[];
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [amountText, setAmountText] = useState(entry ? centsToInput(entry.amountCents) : '');
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? defaultKind);
  const [category, setCategory] = useState<EntryCategory>(entry?.category ?? DEFAULT_CATEGORY);
  const [note, setNote] = useState(entry?.note ?? '');
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [repeat, setRepeat] = useState(initialRepeat);
  const form = JSON.stringify({ amountText, kind, category, note, date, repeat });
  const [savedForm] = useState(form);
  const { dialog: discardDialog, allowLeave } = useDiscardGuard(form !== savedForm);
  const { dialog: confirmDialog, ask } = useConfirm();
  const { submit, submitting } = useSubmit(allowLeave);

  // An entry stays in its month; the date moves within it, up to today.
  const formMonth = (entry?.date ?? defaultDate).slice(0, 7);
  const firstDay = `${formMonth}-01`;
  const todayKey = dayKey(today);
  const lastDay = lastDayOfMonth(formMonth) < todayKey ? lastDayOfMonth(formMonth) : todayKey;
  // Only this month's entries can repeat; past months never change.
  const canRepeat = formMonth === monthKey(today);
  const input: EntryInput = { date, kind, amountCents: parseEurosToCents(amountText) ?? 0, note: note.trim(), category };
  const errors = validateEntry(input, today);
  const amountError = errors.find((error) => error === 'amount-not-positive' || error === 'amount-too-large');

  const submitLabel = entry ? 'Save changes' : ADD_LABELS[kind];

  /** Fills the form from a suggestion; the kind, the date and the repeat switch stay as they are. */
  function fillFrom(suggestion: QuickAddSuggestion) {
    hapticTick();
    setAmountText(centsToInput(suggestion.amountCents));
    setCategory(suggestion.category);
    setNote(suggestion.note);
  }

  function onSave() {
    const now = new Date();
    const choice = canRepeat ? { repeat } : {};
    submit(() => (entry ? editEntry(db, entry.id, input, now, choice) : addEntry(db, input, now, choice)));
  }

  /** Android's calendar, limited to the entry's month and to today. */
  function pickDate() {
    DateTimePickerAndroid.open({
      value: dayToDate(date),
      mode: 'date',
      minimumDate: dayToDate(firstDay),
      maximumDate: dayToDate(lastDay),
      onValueChange: (_event, picked) => {
        if (picked) setDate(dayKey(picked));
      },
    });
  }

  function onDelete() {
    if (!entry) return;
    ask({
      title: 'Delete this entry?',
      message: 'This cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Delete',
      onConfirm: () => submit(() => deleteEntry(db, entry.id), 'delete'),
    });
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        <Stack.Screen options={{ title: entry ? 'Edit entry' : ADD_LABELS[kind] }} />
        {discardDialog}
        {confirmDialog}
        <ScreenScroll>
          <AmountField
            value={amountText}
            onChangeText={setAmountText}
            error={amountError ? entryErrorMessage(amountError) : null}
            autoFocus={!entry}
          />

          {kind === 'expense' ? <QuickAddRow suggestions={suggestions} onPick={fillFrom} /> : null}

          <View style={styles.kindRow}>
            {ENTRY_KINDS.map((option) => {
              const selected = option === kind;
              return (
                <PressableScale
                  key={option}
                  accessibilityRole="radio"
                  accessibilityLabel={KIND_LABELS[option]}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    if (option === kind) return;
                    hapticTick();
                    setKind(option);
                    // Categories belong to a kind: a new kind starts again from Other.
                    setCategory(DEFAULT_CATEGORY);
                  }}
                  style={[styles.kind, { backgroundColor: selected ? theme.kindFill[option] : theme.backgroundElement }]}>
                  <Feather name={KIND_ICONS[option]} size={IconSize.medium} color={selected ? theme.onAccent : theme.kindInk[option]} />
                  <ThemedText type="smallBold" style={selected ? { color: theme.onAccent } : undefined}>
                    {KIND_LABELS[option]}
                  </ThemedText>
                </PressableScale>
              );
            })}
          </View>

          <CategoryChoices kind={kind} value={category} onChange={setCategory} />

          <TextField label="Note (optional)" placeholder={NOTE_EXAMPLES[kind]} value={note} onChangeText={setNote} maxLength={80} />

          <View style={[styles.dateRow, { backgroundColor: theme.backgroundElement }]}>
            <IconButton
              icon="chevron-left"
              accessibilityLabel="Previous day"
              disabled={date <= firstDay}
              onPress={() => setDate(addDays(date, -1))}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Date: ${formatDay(date)}. Pick a day`}
              hitSlop={Layout.itemGap}
              onPress={pickDate}
              style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
              <ThemedText type="smallBold">{date === todayKey ? `Today · ${formatDay(date)}` : formatDay(date)}</ThemedText>
            </Pressable>
            <IconButton
              icon="chevron-right"
              accessibilityLabel="Next day"
              disabled={date >= lastDay}
              onPress={() => setDate(addDays(date, 1))}
            />
          </View>
          {errors.includes('date-invalid') ? <ErrorText>{entryErrorMessage('date-invalid')}</ErrorText> : null}

          {canRepeat ? <SwitchRow label="Repeat every month" value={repeat} onValueChange={setRepeat} /> : null}

          <Button label={submitLabel} disabled={errors.length > 0 || submitting} onPress={onSave} />
          {entry ? <Button label="Delete" variant="destructive" disabled={submitting} onPress={onDelete} /> : null}
        </ScreenScroll>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  kindRow: {
    flexDirection: 'row',
    gap: Layout.itemGap,
  },
  kind: {
    alignItems: 'center',
    borderRadius: Radius.card,
    flex: 1,
    gap: Layout.tightGap,
    justifyContent: 'center',
    minHeight: Size.choice,
  },
  pressed: {
    opacity: Opacity.pressed,
  },
  dateRow: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: Size.control,
  },
});
